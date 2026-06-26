import { dataSource } from "../../app-data-source";
import { Lead, LeadTipificationHistory } from "../models/lead.entity";
import { Tipification, TipificationCategory, TipificationAction } from "../models/tipification.entity";
import { User } from "../models/user.entity";
import { GroupCampaign } from "../models/group-campaign.entity";
import { LeadQueue } from "../models/lead-queue.entity";
import { LeadStates } from "../enums/lead-states.enum";
import { LeadQueuesService } from "./lead-queues.service";
import { UsersService } from "./users.service";
import { CallBellHelper } from "../helpers/callbell.helper";
import { Brackets, In } from "typeorm";

const leadRepository = dataSource.getRepository(Lead);
const tipificationRepository = dataSource.getRepository(Tipification);
const leadTipificationHistoryRepository = dataSource.getRepository(LeadTipificationHistory);
const userRepository = dataSource.getRepository(User);

/**
 * Servicio del ciclo de vida de leads (sustituye al flujo antiguo de "Solicitar Lead"
 * + tipificación por leadState):
 * - Asignación con prioridad: cola manual/automática > callbacks vencidos > nuevos > reintentos
 * - Rotación entre agentes (un reintento no vuelve al mismo agente que acaba de intentarlo)
 * - Tipificaciones con acciones automáticas
 * - Trigger de intento 6 (WhatsApp obligatorio + bloqueo permanente al agente)
 *
 * La asignación "actual" del agente se persiste en `user.leadId` (lado propietario de la
 * relación, igual que el flujo antiguo) — NUNCA vía `lead.user`, que es el lado inverso y
 * no tiene columna en la tabla `lead`.
 */
export module LeadLifecycleService {
  // Tiempos de reintento por nº de intento alcanzado (en horas): 2h, 1d, 2d, 3d, 5d.
  const RETRY_HOURS_BY_ATTEMPT: Record<number, number> = { 1: 2, 2: 24, 3: 48, 4: 72, 5: 120 };
  const MAX_ATTEMPTS = 6;

  // Estados del ciclo de vida (columna `lead.status`).
  const STATUS = { ACTIVO: "activo", CALLBACK: "callback", RETRY: "retry", MUERTO: "muerto" };

  /**
   * Fin del día (23:59:59.999) de la fecha dada. Los callbacks agendados para HOY (a cualquier
   * hora) deben poder llamarse y contarse durante todo el día, no solo cuando llega su hora.
   */
  const endOfDay = (d: Date): Date => {
    const e = new Date(d);
    e.setHours(23, 59, 59, 999);
    return e;
  };

  /** Carga el usuario (con grupos) y las campañas a las que tiene acceso. */
  const getUserAndCampaigns = async (
    userId: number
  ): Promise<{ user: User; campaignIds: number[] }> => {
    const user = await UsersService.get({ id: userId }, { groupUsers: { group: true } });
    if (!user || !user.groupUsers || user.groupUsers.length === 0) {
      throw new Error("El usuario no pertenece a ningún grupo.");
    }
    const groupIds = user.groupUsers.map((gu) => gu.group.id);
    const groupCampaigns = await dataSource
      .getRepository(GroupCampaign)
      .find({ where: { groupId: In(groupIds) } });
    const campaignIds = groupCampaigns.map((gc) => gc.campaignId);
    if (campaignIds.length === 0) {
      throw new Error("No hay campañas disponibles para los grupos del usuario.");
    }
    return { user, campaignIds };
  };

  /**
   * Base de disponibilidad de un lead para la cola:
   * - dentro de las campañas del agente
   * - no cerrado (status != muerto) ni bloqueado permanentemente
   * - sin turno reservado (shift IS NULL)
   * - "abierto" en el sistema antiguo (leadStateId NULL o NoContesta) — puente sin migración de datos
   * - no en posesión de NINGÚN agente ahora mismo (user.leadId)
   */
  const baseAvailableQuery = (campaignIds: number[]) =>
    leadRepository
      .createQueryBuilder("lead")
      .where("lead.campaignId IN (:...campaignIds)", { campaignIds })
      .andWhere("lead.status != :muerto", { muerto: STATUS.MUERTO })
      .andWhere("lead.isPermanentlyAssigned = false")
      .andWhere("lead.shift IS NULL")
      .andWhere(
        new Brackets((qb) => {
          qb.where("lead.leadStateId IS NULL").orWhere("lead.leadStateId = :noContesta", {
            noContesta: LeadStates.NoContesta,
          });
        })
      )
      .andWhere("lead.id NOT IN (SELECT u.leadId FROM user u WHERE u.leadId IS NOT NULL)");

  /**
   * Solicita el siguiente lead para el agente y se lo asigna (user.leadId).
   * Prioridad: cola (FROM_QUEUE) > callbacks vencidos > nuevos > reintentos.
   * Devuelve el lead asignado o null si no hay disponibles.
   */
  export const requestNextLead = async (userId: number): Promise<Lead | null> => {
    const { user, campaignIds } = await getUserAndCampaigns(userId);
    const now = new Date();
    const endToday = endOfDay(now);

    // 0. Cola manual/automática (agendado a usuario + reglas de asignación PRES-018 B2a).
    const leadQueueRepository = dataSource.getRepository(LeadQueue);
    const inQueue = await leadQueueRepository.findOne({
      where: { userId },
      relations: { lead: true },
      order: { position: "ASC" },
    });
    if (inQueue && inQueue.lead) {
      await assignToAgent(inQueue.lead.id, userId);
      await LeadQueuesService.deleteFirst(userId);
      fireCallbell(inQueue.lead.phoneNumber, user.email);
      return reload(inQueue.lead.id);
    }
    if (inQueue && !inQueue.lead) {
      // Entrada huérfana (lead borrado): límpiala y sigue.
      await leadQueueRepository.delete({ id: inQueue.id });
    }

    // 1. Callbacks de HOY o vencidos (máxima prioridad tras la cola). Se incluye todo el día
    //    de hoy para que un callback agendado para más tarde hoy también se pueda atender.
    let lead = await baseAvailableQuery(campaignIds)
      .andWhere("lead.status = :s", { s: STATUS.CALLBACK })
      .andWhere("lead.nextCallDate <= :endToday", { endToday })
      .orderBy("lead.nextCallDate", "ASC")
      .getOne();

    // 2. Leads nuevos (sin trabajar).
    if (!lead) {
      lead = await baseAvailableQuery(campaignIds)
        .andWhere("lead.status = :s", { s: STATUS.ACTIVO })
        .andWhere("lead.attemptCount = 0")
        .orderBy("lead.createdAt", "ASC")
        .getOne();
    }

    // 3. Reintentos vencidos, rotando: no devolver el lead al último agente que lo intentó.
    if (!lead) {
      lead = await baseAvailableQuery(campaignIds)
        .andWhere("lead.status = :s", { s: STATUS.RETRY })
        .andWhere("lead.nextCallDate <= :now", { now })
        .andWhere(
          new Brackets((qb) => {
            qb.where("lead.lastAttemptUserId IS NULL").orWhere(
              "lead.lastAttemptUserId != :userId",
              { userId }
            );
          })
        )
        .orderBy("lead.nextCallDate", "ASC")
        .addOrderBy("lead.attemptCount", "ASC")
        .getOne();
    }

    if (!lead) return null;

    await assignToAgent(lead.id, userId);
    fireCallbell(lead.phoneNumber, user.email);
    return reload(lead.id);
  };

  /** Asigna el lead al agente (user.leadId) y registra el historial de rotación. */
  const assignToAgent = async (leadId: number, userId: number): Promise<void> => {
    await userRepository.update(userId, { leadId });
    const lead = await leadRepository.findOne({ where: { id: leadId } });
    if (lead) {
      const history = lead.agentRotationHistory || [];
      history.push({ userId, timestamp: new Date().toISOString() });
      lead.agentRotationHistory = history;
      await leadRepository.save(lead);
    }
  };

  /** Notifica a CallBell sin bloquear la respuesta (fire-and-forget). */
  const fireCallbell = (phoneNumber: string, email?: string): void => {
    if (!phoneNumber || !email) return;
    CallBellHelper.assignUserToContact(phoneNumber, email).catch((error) =>
      console.error("Error assigning user to CallBell contact:", error)
    );
  };

  const reload = (leadId: number): Promise<Lead | null> =>
    leadRepository.findOne({
      where: { id: leadId },
      relations: ["campaign", "lastTipification", "leadLogs", "leadSheet"],
    });

  /**
   * Tipifica el lead actual del agente, ejecuta la acción y LIBERA al agente
   * (user.leadId = null) para que pueda solicitar el siguiente.
   */
  export const tipifyLead = async (
    leadId: number,
    tipificationId: number,
    userId: number,
    observation?: string,
    whatsappNumber?: string,
    nextCallDate?: string | Date
  ): Promise<Lead> => {
    const lead = await leadRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new Error("Lead no encontrado");

    const tipification = await tipificationRepository.findOne({ where: { id: tipificationId } });
    if (!tipification) throw new Error("Tipificación no encontrada");

    const isRetry = tipification.action === TipificationAction.REINTENTO;
    const willReachMax = isRetry && lead.attemptCount + 1 >= MAX_ATTEMPTS;
    const requiresWhatsapp = tipification.requiresWhatsapp || willReachMax;

    if (requiresWhatsapp) {
      if (!whatsappNumber || whatsappNumber.trim() === "") {
        throw new Error(
          "Es obligatorio introducir un número de WhatsApp en el último intento (6)."
        );
      }
      lead.whatsappNumber = whatsappNumber.trim();
    } else if (whatsappNumber && whatsappNumber.trim()) {
      lead.whatsappNumber = whatsappNumber.trim();
    }

    // Histórico de tipificaciones (la cuenta de intentos en el momento de tipificar).
    await leadTipificationHistoryRepository.save(
      leadTipificationHistoryRepository.create({
        leadId,
        tipificationId,
        userId,
        observation,
        attemptCountAtTipification: lead.attemptCount,
      })
    );

    lead.lastTipificationId = tipification.id;
    // La rotación (no devolver el lead al mismo agente en el siguiente intento) aplica a los
    // reintentos por NO CONTACTO. En un contacto efectivo (callback / interesado ocupado) el
    // lead puede volver al mismo agente, así que no se marca como "último agente".
    lead.lastAttemptUserId =
      tipification.category === TipificationCategory.NO_CONTACTO ? userId : null;

    switch (tipification.action) {
      case TipificationAction.CERRAR:
        lead.status = STATUS.MUERTO;
        lead.nextCallDate = null;
        break;

      case TipificationAction.VENTAS:
        // Pasa a ventas: sale de la cola de llamadas y queda marcado como Venta
        // en el sistema antiguo (para liquidaciones/contratos).
        lead.status = STATUS.MUERTO;
        lead.leadStateId = LeadStates.Venta;
        lead.nextCallDate = null;
        break;

      case TipificationAction.AGENDA:
        // Cita agendada: sale de la cola de llamadas.
        lead.status = STATUS.MUERTO;
        lead.nextCallDate = null;
        break;

      case TipificationAction.SEGUIMIENTO:
        // Vuelve a la cola como activo (sin contar como nuevo: attemptCount se mantiene).
        lead.status = STATUS.ACTIVO;
        lead.nextCallDate = null;
        break;

      case TipificationAction.CALLBACK:
        lead.status = STATUS.CALLBACK;
        if (nextCallDate) lead.nextCallDate = new Date(nextCallDate);
        break;

      case TipificationAction.REINTENTO:
        lead.attemptCount += 1;
        if (lead.attemptCount >= MAX_ATTEMPTS) {
          // Intento 6: WhatsApp obligatorio (ya validado), bloqueo permanente al agente
          // y fuera de la cola de rotación.
          lead.isPermanentlyAssigned = true;
          lead.permanentAgentId = userId;
          lead.status = STATUS.MUERTO;
          lead.nextCallDate = null;
        } else {
          const retryHours =
            tipification.retryHours || RETRY_HOURS_BY_ATTEMPT[lead.attemptCount] || 24;
          lead.nextCallDate = new Date(Date.now() + retryHours * 60 * 60 * 1000);
          lead.status = STATUS.RETRY;
        }
        break;
    }

    await leadRepository.save(lead);

    // Liberar al agente: su lead actual deja de estar asignado para que pueda pedir el siguiente.
    await userRepository.update(userId, { leadId: null });

    return lead;
  };

  /** Tipificaciones activas agrupadas por categoría (para el modal del frontend). */
  export const getAllTipifications = async (): Promise<{
    contacto: Tipification[];
    no_contacto: Tipification[];
    descarte: Tipification[];
  }> => {
    const tipifications = await tipificationRepository.find({
      where: { isActive: true },
      order: { id: "ASC" },
    });
    return {
      contacto: tipifications.filter((t) => t.category === TipificationCategory.CONTACTO),
      no_contacto: tipifications.filter((t) => t.category === TipificationCategory.NO_CONTACTO),
      descarte: tipifications.filter((t) => t.category === TipificationCategory.DESCARTE),
    };
  };

  /** Contadores para la barra de cola del gestor de leads (por campañas del agente). */
  export const getQueueStats = async (
    userId: number
  ): Promise<{ availableInQueue: number; callbacksToday: number }> => {
    const now = new Date();
    const endToday = endOfDay(now);
    let campaignIds: number[];
    try {
      ({ campaignIds } = await getUserAndCampaigns(userId));
    } catch {
      // Sin grupo/campañas: no hay cola que mostrar.
      return { availableInQueue: 0, callbacksToday: 0 };
    }

    // Leads listos para llamar: nuevos + callbacks de hoy/vencidos + reintentos vencidos.
    const availableInQueue = await baseAvailableQuery(campaignIds)
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            new Brackets((q) => {
              q.where("lead.status = :activo", { activo: STATUS.ACTIVO }).andWhere(
                "lead.attemptCount = 0"
              );
            })
          )
            .orWhere(
              new Brackets((q) => {
                q.where("lead.status = :cb", { cb: STATUS.CALLBACK }).andWhere(
                  "lead.nextCallDate <= :endToday",
                  { endToday }
                );
              })
            )
            .orWhere(
              new Brackets((q) => {
                q.where("lead.status = :rt", { rt: STATUS.RETRY }).andWhere(
                  "lead.nextCallDate <= :now",
                  { now }
                );
              })
            );
        })
      )
      .getCount();

    // "Callbacks hoy" = callbacks agendados para hoy (a cualquier hora) o ya vencidos.
    const callbacksToday = await baseAvailableQuery(campaignIds)
      .andWhere("lead.status = :s", { s: STATUS.CALLBACK })
      .andWhere("lead.nextCallDate <= :endToday", { endToday })
      .getCount();

    return { availableInQueue, callbacksToday };
  };

  /** Tipificaciones por defecto (idempotente): solo inserta si la tabla está vacía. */
  export const seedDefaultTipifications = async (): Promise<void> => {
    const existing = await tipificationRepository.count();
    if (existing > 0) return;

    const C = TipificationCategory;
    const A = TipificationAction;
    const defaults: Array<Partial<Tipification>> = [
      // CONTACTO EFECTIVO
      { name: "Interesado", category: C.CONTACTO, action: A.VENTAS },
      { name: "No interesado", category: C.CONTACTO, action: A.CERRAR },
      { name: "Ya es cliente", category: C.CONTACTO, action: A.CERRAR },
      { name: "Volver a llamar", category: C.CONTACTO, action: A.CALLBACK },
      { name: "No es el momento", category: C.CONTACTO, action: A.REINTENTO, retryHours: 168 },
      { name: "Pide información", category: C.CONTACTO, action: A.SEGUIMIENTO },
      { name: "Interesado pero ocupado", category: C.CONTACTO, action: A.REINTENTO, retryHours: 2 },
      { name: "Cita agendada", category: C.CONTACTO, action: A.AGENDA },
      // NO CONTACTO (todas reintento automático con los tiempos por intento)
      { name: "No contesta", category: C.NO_CONTACTO, action: A.REINTENTO },
      { name: "Ocupado", category: C.NO_CONTACTO, action: A.REINTENTO },
      { name: "Apagado / fuera de cobertura", category: C.NO_CONTACTO, action: A.REINTENTO },
      { name: "Cuelga llamada", category: C.NO_CONTACTO, action: A.REINTENTO },
      { name: "Salta buzón de voz", category: C.NO_CONTACTO, action: A.REINTENTO },
      { name: "Teléfono no disponible temporalmente", category: C.NO_CONTACTO, action: A.REINTENTO },
      // DESCARTE
      { name: "Número incorrecto", category: C.DESCARTE, action: A.CERRAR },
      { name: "No existe", category: C.DESCARTE, action: A.CERRAR },
      { name: "Datos falsos", category: C.DESCARTE, action: A.CERRAR },
      { name: "No llamar", category: C.DESCARTE, action: A.CERRAR },
      { name: "Spam / lead basura", category: C.DESCARTE, action: A.CERRAR },
    ];

    await tipificationRepository.save(defaults.map((d) => tipificationRepository.create(d)));
    console.log(`Seeded ${defaults.length} tipificaciones por defecto`);
  };
}
