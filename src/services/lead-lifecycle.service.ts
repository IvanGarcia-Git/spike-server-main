import { dataSource } from "../../app-data-source";
import { Lead, LeadTipificationHistory } from "../models/lead.entity";
import { Tipification, TipificationCategory, TipificationAction } from "../models/tipification.entity";
import { User } from "../models/user.entity";
import { Brackets, In } from "typeorm";

const leadRepository = dataSource.getRepository(Lead);
const tipificationRepository = dataSource.getRepository(Tipification);
const leadTipificationHistoryRepository = dataSource.getRepository(LeadTipificationHistory);
const userRepository = dataSource.getRepository(User);

/**
 * Servicio para la gestión del ciclo de vida de leads:
 * - Rotación circular entre agentes
 * - Motor de prioridad (callbacks > nuevos > reintentos)
 * - Sistema de tipificaciones con acciones automáticas
 * - Trigger de intento 6 (WhatsApp obligatorio)
 */
export module LeadLifecycleService {
  
  /**
   * Tiempos de reintento por número de intento (en horas)
   */
  const RETRY_HOURS_BY_ATTEMPT: Record<number, number> = {
    1: 2,   // +2 horas
    2: 24,  // +1 día
    3: 48,  // +2 días
    4: 72,  // +3 días
    5: 120, // +5 días
  };

  const MAX_ATTEMPTS_BEFORE_WHATSAPP = 6;

  /**
   * Obtiene el siguiente lead disponible siguiendo la lógica de prioridad:
   * 1. Callbacks vencidos (next_call_date <= ahora)
   * 2. Leads nuevos (attempt_count = 0)
   * 3. Reintentos (ordenados por fecha más antigua)
   * 
   * Excluye leads permanentemente asignados a otros agentes
   */
  export const getNextAvailableLead = async (userId: number): Promise<Lead | null> => {
    const now = new Date();

    // 1. Primero buscar callbacks vencidos
    let lead = await findCallbackLeads(userId, now);
    if (lead) return lead;

    // 2. Luego leads nuevos (sin trabajar)
    lead = await findNewLeads(userId);
    if (lead) return lead;

    // 3. Finalmente reintentos
    lead = await findRetryLeads(userId);
    return lead;
  };

  /**
   * Busca leads con callbacks vencidos disponibles para un agente
   */
  const findCallbackLeads = async (userId: number, now: Date): Promise<Lead | null> => {
    return await leadRepository
      .createQueryBuilder("lead")
      .leftJoin("lead.user", "user")
      .where("lead.status = :status", { status: "callback" })
      .andWhere("lead.nextCallDate <= :now", { now })
      .andWhere(new Brackets((qb) => {
        qb.where("lead.user IS NULL")
          .orWhere("lead.user.id = :userId", { userId })
          .orWhere("lead.isPermanentlyAssigned = true AND lead.user.id = :userId", { userId });
      }))
      .orderBy("lead.nextCallDate", "ASC")
      .getOne();
  };

  /**
   * Busca leads nuevos (sin intentar) disponibles
   */
  const findNewLeads = async (userId: number): Promise<Lead | null> => {
    return await leadRepository
      .createQueryBuilder("lead")
      .leftJoin("lead.user", "user")
      .where("lead.attemptCount = 0")
      .andWhere("lead.status = :status", { status: "activo" })
      .andWhere(new Brackets((qb) => {
        qb.where("lead.user IS NULL")
          .orWhere("lead.isPermanentlyAssigned = true AND lead.user.id = :userId", { userId });
      }))
      .orderBy("lead.createdAt", "ASC")
      .getOne();
  };

  /**
   * Busca leads para reintento, excluyendo agentes que ya lo intentaron recientemente
   */
  const findRetryLeads = async (userId: number): Promise<Lead | null> => {
    const now = new Date();

    // Obtener IDs de leads que este agente ya intentó en los últimos N intentos
    // para evitar que vuelvan al mismo agente consecutivamente
    const leadsWithRecentAttemptByUser = await leadTipificationHistoryRepository
      .createQueryBuilder("history")
      .select("history.leadId")
      .where("history.userId = :userId", { userId })
      .orderBy("history.createdAt", "DESC")
      .limit(100)
      .getRawMany();

    const excludedLeadIds = leadsWithRecentAttemptByUser.map((r: any) => r.leadId);

    const query = leadRepository
      .createQueryBuilder("lead")
      .leftJoin("lead.user", "user")
      .where("lead.attemptCount > 0")
      .andWhere("lead.attemptCount < :maxAttempts", { maxAttempts: MAX_ATTEMPTS_BEFORE_WHATSAPP })
      .andWhere("lead.status IN (:...statuses)", { statuses: ["activo", "callback"] })
      .andWhere(new Brackets((qb) => {
        qb.where("lead.user IS NULL")
          .orWhere("lead.isPermanentlyAssigned = true AND lead.user.id = :userId", { userId });
      }));

    if (excludedLeadIds.length > 0) {
      query.andWhere("lead.id NOT IN (:...excludedIds)", { excludedIds: excludedLeadIds });
    }

    return await query
      .orderBy("lead.nextCallDate", "ASC", "NULLS FIRST")
      .addOrderBy("lead.attemptCount", "ASC")
      .getOne();
  };

  /**
   * Asigna un lead a un agente y registra en el historial de rotación
   */
  export const assignLeadToAgent = async (leadId: number, userId: number): Promise<Lead> => {
    const lead = await leadRepository.findOne({ where: { id: leadId }, relations: ["user"] });
    
    if (!lead) {
      throw new Error(`Lead ${leadId} no encontrado`);
    }

    if (lead.isPermanentlyAssigned && lead.user?.id !== userId) {
      throw new Error(`Lead ${leadId} está permanentemente asignado a otro agente`);
    }

    // Actualizar asignación
    lead.user = await userRepository.findOne({ where: { id: userId } });
    
    // Actualizar historial de rotación
    const rotationHistory = lead.agentRotationHistory || [];
    rotationHistory.push({
      userId,
      timestamp: new Date().toISOString(),
    });
    lead.agentRotationHistory = rotationHistory;

    await leadRepository.save(lead);
    return lead;
  };

  /**
   * Tipifica un lead y ejecuta la acción correspondiente
   */
  export const tipifyLead = async (
    leadId: number,
    tipificationId: number,
    userId: number,
    observation?: string,
    whatsappNumber?: string,
    nextCallDate?: string | Date
  ): Promise<Lead> => {
    const lead = await leadRepository.findOne({ 
      where: { id: leadId },
      relations: ["user", "lastTipification"]
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} no encontrado`);
    }

    const tipification = await tipificationRepository.findOne({ 
      where: { id: tipificationId } 
    });

    if (!tipification) {
      throw new Error(`Tipificación ${tipificationId} no encontrada`);
    }

    // Validar WhatsApp obligatorio si corresponde
    if (tipification.requiresWhatsapp || lead.attemptCount >= MAX_ATTEMPTS_BEFORE_WHATSAPP - 1) {
      if (!whatsappNumber || whatsappNumber.trim() === "") {
        throw new Error("Es obligatorio introducir un número de WhatsApp en el intento 6");
      }
      lead.whatsappNumber = whatsappNumber;
      lead.isPermanentlyAssigned = true;
    } else if (whatsappNumber) {
      lead.whatsappNumber = whatsappNumber;
    }

    // Registrar en histórico
    const history = leadTipificationHistoryRepository.create({
      leadId,
      tipificationId,
      userId,
      observation,
      attemptCountAtTipification: lead.attemptCount,
    });
    await leadTipificationHistoryRepository.save(history);

    // Actualizar última tipificación
    lead.lastTipification = tipification;

    // Callback manual: la fecha la elige el agente en el frontend.
    if (tipification.action === TipificationAction.CALLBACK && nextCallDate) {
      lead.nextCallDate = new Date(nextCallDate);
    }

    // Ejecutar acción de la tipificación
    await executeTipificationAction(lead, tipification, userId);

    return lead;
  };

  /**
   * Ejecuta la acción correspondiente según la tipificación
   */
  const executeTipificationAction = async (
    lead: Lead,
    tipification: Tipification,
    userId: number
  ): Promise<void> => {
    switch (tipification.action) {
      case TipificationAction.CERRAR:
        lead.status = "muerto";
        lead.user = null; // Liberar agente
        break;

      case TipificationAction.REINTENTO:
        lead.attemptCount += 1;
        
        if (lead.attemptCount >= MAX_ATTEMPTS_BEFORE_WHATSAPP) {
          // Forzar WhatsApp y asignación permanente
          lead.isPermanentlyAssigned = true;
          lead.status = "activo";
        } else {
          // Calcular próxima fecha de reintento
          const retryHours = tipification.retryHours || RETRY_HOURS_BY_ATTEMPT[lead.attemptCount] || 24;
          lead.nextCallDate = new Date(Date.now() + retryHours * 60 * 60 * 1000);
          lead.status = "callback";
          
          // Liberar lead para que vaya a otro agente
          lead.user = null;
        }
        break;

      case TipificationAction.CALLBACK:
        lead.status = "callback";
        // La fecha ya debería estar establecida por el frontend
        break;

      case TipificationAction.VENTAS:
        lead.status = "muerto"; // Sale de la cola de llamadas
        lead.user = null;
        // Aquí se podría crear un registro en la tabla de ventas/contratos
        break;

      case TipificationAction.AGENDA:
        lead.status = "muerto"; // Sale de la cola
        lead.user = null;
        break;

      case TipificationAction.SEGUIMIENTO:
        lead.status = "activo";
        lead.user = null; // Vuelve a la cola para seguimiento
        break;
    }

    await leadRepository.save(lead);
  };

  /**
   * Obtiene todas las tipificaciones activas agrupadas por categoría
   */
  export const getAllTipifications = async (): Promise<{
    contacto: Tipification[];
    no_contacto: Tipification[];
    descarte: Tipification[];
  }> => {
    const tipifications = await tipificationRepository.find({
      where: { isActive: true },
      order: { category: "ASC", name: "ASC" },
    });

    return {
      contacto: tipifications.filter((t) => t.category === TipificationCategory.CONTACTO),
      no_contacto: tipifications.filter((t) => t.category === TipificationCategory.NO_CONTACTO),
      descarte: tipifications.filter((t) => t.category === TipificationCategory.DESCARTE),
    };
  };

  /**
   * Obtiene estadísticas de cola para un dashboard
   */
  export const getQueueStats = async (userId?: number) => {
    const now = new Date();

    // Leads disponibles en cola (sin asignar o asignados al usuario)
    const availableInQueue = await leadRepository
      .createQueryBuilder("lead")
      .where("lead.status = :status", { status: "activo" })
      .andWhere("lead.attemptCount < :maxAttempts", { maxAttempts: MAX_ATTEMPTS_BEFORE_WHATSAPP })
      .andWhere(new Brackets((qb) => {
        qb.where("lead.user IS NULL");
        if (userId) {
          qb.orWhere("lead.user.id = :userId", { userId });
        }
      }))
      .getCount();

    // Callbacks para hoy
    const callbacksToday = await leadRepository
      .createQueryBuilder("lead")
      .where("lead.status = :status", { status: "callback" })
      .andWhere("lead.nextCallDate <= :now", { now })
      .getCount();

    return {
      availableInQueue,
      callbacksToday,
    };
  };
}
