import { dataSource } from "../../app-data-source";
import { LeadAssignmentRule, AssignMode } from "../models/lead-assignment-rule.entity";
import { Lead } from "../models/lead.entity";
import { Campaign } from "../models/campaign.entity";
import { GroupUser } from "../models/group-user.entity";
import { User } from "../models/user.entity";
import { LeadQueue } from "../models/lead-queue.entity";
import { LeadSheet } from "../models/lead-sheet.entity";
import { LeadQueuesService } from "./lead-queues.service";
import { LeadStates } from "../enums/lead-states.enum";
import { zonaFromPostalCode } from "../helpers/spanish-provinces.helper";

/**
 * PRES-018 B2a — Motor de reglas de asignación automática de leads.
 */
export module LeadAssignmentRulesService {
  const ruleRepo = () => dataSource.getRepository(LeadAssignmentRule);

  // ---------- CRUD ----------
  export const create = async (data: Partial<LeadAssignmentRule>): Promise<LeadAssignmentRule> => {
    const rule = ruleRepo().create(data);
    return await ruleRepo().save(rule);
  };

  export const findAll = async (): Promise<LeadAssignmentRule[]> => {
    return await ruleRepo().find({ order: { priority: "ASC", id: "ASC" } });
  };

  export const findOne = async (uuid: string): Promise<LeadAssignmentRule | null> => {
    return await ruleRepo().findOne({ where: { uuid } });
  };

  export const update = async (
    uuid: string,
    data: Partial<LeadAssignmentRule>
  ): Promise<LeadAssignmentRule> => {
    const rule = await ruleRepo().findOne({ where: { uuid } });
    if (!rule) throw new Error("LeadAssignmentRule not found");
    // No permitimos sobreescribir identificadores ni el cursor interno desde fuera.
    delete (data as any).id;
    delete (data as any).uuid;
    delete (data as any).roundRobinCursor;
    Object.assign(rule, data);
    return await ruleRepo().save(rule);
  };

  export const remove = async (uuid: string): Promise<{ message: string }> => {
    const rule = await ruleRepo().findOne({ where: { uuid } });
    if (!rule) throw new Error("LeadAssignmentRule not found");
    await ruleRepo().remove(rule);
    return { message: "LeadAssignmentRule deleted" };
  };

  /**
   * Rellena lead.zona de los leads existentes a partir del CP de su ficha.
   * Idempotente: solo toca leads sin zona previa. Devuelve cuántos actualizó.
   * (Necesario porque con synchronize:true las migraciones de datos no se ejecutan solas.)
   */
  export const backfillZonas = async (): Promise<{ updated: number; scanned: number }> => {
    const sheets = await dataSource
      .getRepository(LeadSheet)
      .createQueryBuilder("s")
      .select(["s.leadId AS leadId", "s.zipCode AS zipCode"])
      .where("s.leadId IS NOT NULL AND s.zipCode IS NOT NULL AND s.zipCode <> ''")
      .getRawMany();

    const leadRepo = dataSource.getRepository(Lead);
    let updated = 0;
    for (const row of sheets) {
      const zona = zonaFromPostalCode(row.zipCode);
      if (!zona) continue;
      const res = await leadRepo
        .createQueryBuilder()
        .update(Lead)
        .set({ zona })
        .where("id = :id AND (zona IS NULL OR zona = '')", { id: row.leadId })
        .execute();
      updated += res.affected || 0;
    }
    return { updated, scanned: sheets.length };
  };

  // ---------- Motor ----------

  const matches = (rule: LeadAssignmentRule, lead: Lead, campaign?: Campaign | null): boolean => {
    if (rule.zona && rule.zona !== lead.zona) return false;
    if (rule.sector && rule.sector !== campaign?.sector) return false;
    if (rule.origin && rule.origin !== campaign?.source) return false;
    if (rule.campaignId && rule.campaignId !== lead.campaignId) return false;
    if (rule.shift && rule.shift !== lead.shift) return false;
    return true;
  };

  const groupMemberIds = async (groupId: number): Promise<number[]> => {
    const members = await dataSource.getRepository(GroupUser).find({ where: { groupId } });
    return members.map((m) => m.userId);
  };

  // Carga de trabajo = nº de leads en cola del agente (proxy de "carga").
  const queueCounts = async (userIds: number[]): Promise<Record<number, number>> => {
    const counts: Record<number, number> = {};
    userIds.forEach((id) => (counts[id] = 0));
    if (userIds.length === 0) return counts;
    const rows = await dataSource
      .getRepository(LeadQueue)
      .createQueryBuilder("q")
      .select("q.userId", "userId")
      .addSelect("COUNT(*)", "cnt")
      .where("q.userId IN (:...userIds)", { userIds })
      .groupBy("q.userId")
      .getRawMany();
    rows.forEach((r: any) => (counts[Number(r.userId)] = Number(r.cnt)));
    return counts;
  };

  const pickFromGroup = async (rule: LeadAssignmentRule): Promise<number | null> => {
    if (!rule.targetGroupId) return null;
    const ids = (await groupMemberIds(rule.targetGroupId)).sort((a, b) => a - b);
    if (ids.length === 0) return null;

    if (rule.assignMode === AssignMode.ROUND_ROBIN) {
      // Cursor por posición (no por "id mayor que"): robusto ante altas/bajas de
      // miembros. Si el cursor ya no está en el grupo, indexOf=-1 → empieza en ids[0].
      const idx = ids.indexOf(rule.roundRobinCursor);
      const chosen = ids[(idx + 1) % ids.length];
      await ruleRepo().update({ id: rule.id }, { roundRobinCursor: chosen });
      return chosen;
    }

    // LEAST_BUSY (default): el de menor cola; empate → menor userId.
    const counts = await queueCounts(ids);
    let chosen = ids[0];
    for (const id of ids) {
      if (counts[id] < counts[chosen]) chosen = id;
    }
    return chosen;
  };

  /** Resuelve el agente destino para un lead según la primera regla que encaja. */
  export const resolveAssignee = async (lead: Lead): Promise<number | null> => {
    const rules = await ruleRepo().find({
      where: { active: true },
      order: { priority: "ASC", id: "ASC" },
    });
    if (rules.length === 0) return null;

    const campaign = lead.campaignId
      ? await dataSource.getRepository(Campaign).findOne({ where: { id: lead.campaignId } })
      : null;

    for (const rule of rules) {
      if (!matches(rule, lead, campaign)) continue;

      if (rule.assignMode === AssignMode.DIRECT) {
        // Si una regla directa está mal configurada (sin agente), no bloqueamos las
        // reglas siguientes: seguimos evaluando.
        if (rule.targetUserId) return rule.targetUserId;
        continue;
      }
      const fromGroup = await pickFromGroup(rule);
      if (fromGroup) return fromGroup;
      // Si el grupo no tiene miembros, seguimos evaluando reglas posteriores.
    }
    return null;
  };

  /**
   * Aplica las reglas a un lead recién creado: si una regla resuelve un agente y
   * el lead no está ya en cola, lo encola y lo marca como "AgendarUsuario".
   * Devuelve el userId asignado o null. No lanza (uso en flujos de creación).
   */
  export const applyToLead = async (leadId: number): Promise<number | null> => {
    try {
      const leadRepo = dataSource.getRepository(Lead);
      const lead = await leadRepo.findOne({ where: { id: leadId } });
      if (!lead) return null;

      // No reasignar si ya está encolado o si ya es el lead activo de algún agente.
      const existing = await dataSource.getRepository(LeadQueue).findOne({ where: { leadId } });
      if (existing) return null;
      const alreadyAssigned = await dataSource.getRepository(User).findOne({ where: { leadId } });
      if (alreadyAssigned) return null;

      const userId = await resolveAssignee(lead);
      if (!userId) return null;

      await LeadQueuesService.create(leadId, userId);
      await leadRepo.update({ id: leadId }, { leadStateId: LeadStates.AgendarUsuario });
      return userId;
    } catch (error) {
      console.error("[LeadAssignmentRules] applyToLead error:", error);
      return null;
    }
  };
}
