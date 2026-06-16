import { Between } from "typeorm";
import { dataSource } from "../../app-data-source";
import { LeadLog } from "../models/lead-log.entity";
import { LeadStates } from "../enums/lead-states.enum";

/**
 * PRES-018 B3 — Estadísticas del gestor de llamadas/leads (camino A).
 *
 * Se aproximan las métricas a partir de los LeadLog (cada cambio de estado que
 * registra un agente: userId + leadStateId + createdAt) y de los estados del lead.
 * NO hay integración de telefonía, por lo que no existe duración real de llamada;
 * los "intentos" se aproximan por los registros "No contesta"/"Ilocalizable".
 */

// Estados que implican que el agente HABLÓ con el cliente (contacto efectivo).
const CONTACTED_STATES = [LeadStates.Venta, LeadStates.NoInteresa, LeadStates.NoMejorar];
// Estados de intento sin respuesta.
const NO_ANSWER_STATES = [LeadStates.NoContesta, LeadStates.Ilocalizable];

const STATE_LABELS: Record<number, string> = {
  [LeadStates.Venta]: "Venta",
  [LeadStates.AgendaPersonal]: "Agenda personal",
  [LeadStates.MorningShift]: "Turno mañana",
  [LeadStates.EveningShift]: "Turno tarde",
  [LeadStates.AgendarUsuario]: "Agendado a usuario",
  [LeadStates.NoContesta]: "No contesta",
  [LeadStates.NoInteresa]: "No interesa",
  [LeadStates.NoMejorar]: "No mejora",
  [LeadStates.Erroneo]: "Erróneo",
  [LeadStates.Ilocalizable]: "Ilocalizable",
  [LeadStates.Repetido]: "Repetido",
};

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;
const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export module LeadStatsService {
  export const getLeadStats = async (start: Date, end: Date) => {
    const logs = await dataSource.getRepository(LeadLog).find({
      where: { createdAt: Between(start, end) },
      relations: { lead: { campaign: true }, user: true },
      order: { createdAt: "ASC" },
    });

    // ---- Agrupar por lead ----
    const byLead = new Map<number, LeadLog[]>();
    for (const log of logs) {
      if (!byLead.has(log.leadId)) byLead.set(log.leadId, []);
      byLead.get(log.leadId)!.push(log);
    }

    let contactados = 0;
    let ventas = 0;
    const intentosHastaContacto: number[] = [];
    const tiemposRespuestaDias: number[] = [];

    // Conversión por origen (source de la campaña del lead).
    const origenMap = new Map<string, { leads: number; ventas: number }>();

    for (const [, leadLogs] of byLead) {
      const reachedIdx = leadLogs.findIndex((l) => CONTACTED_STATES.includes(l.leadStateId));
      const isVenta = leadLogs.some((l) => l.leadStateId === LeadStates.Venta);
      if (reachedIdx >= 0) {
        contactados++;
        const noAnswerBefore = leadLogs
          .slice(0, reachedIdx)
          .filter((l) => NO_ANSWER_STATES.includes(l.leadStateId)).length;
        intentosHastaContacto.push(noAnswerBefore + 1); // +1 por la llamada que sí contactó

        const lead = leadLogs[reachedIdx].lead;
        if (lead?.createdAt) {
          const ms = new Date(leadLogs[reachedIdx].createdAt).getTime() - new Date(lead.createdAt).getTime();
          if (ms >= 0) tiemposRespuestaDias.push(ms / (1000 * 60 * 60 * 24));
        }
      }
      if (isVenta) ventas++;

      const origen = leadLogs[0]?.lead?.campaign?.source || "Sin origen";
      if (!origenMap.has(origen)) origenMap.set(origen, { leads: 0, ventas: 0 });
      const o = origenMap.get(origen)!;
      o.leads++;
      if (isVenta) o.ventas++;
    }

    const leadsGestionados = byLead.size;

    // ---- Ranking por agente ----
    const agentMap = new Map<number, { name: string; interacciones: number; contactos: number; ventas: number }>();
    for (const log of logs) {
      if (!agentMap.has(log.userId)) {
        const u = log.user;
        const name = u
          ? [u.name, (u as any).firstSurname, (u as any).secondSurname].filter(Boolean).join(" ") || (u as any).username
          : `Usuario ${log.userId}`;
        agentMap.set(log.userId, { name, interacciones: 0, contactos: 0, ventas: 0 });
      }
      const a = agentMap.get(log.userId)!;
      a.interacciones++;
      if (CONTACTED_STATES.includes(log.leadStateId)) a.contactos++;
      if (log.leadStateId === LeadStates.Venta) a.ventas++;
    }
    const ranking = [...agentMap.entries()]
      .map(([userId, a]) => ({
        userId,
        name: a.name,
        interacciones: a.interacciones,
        contactos: a.contactos,
        ventas: a.ventas,
        pctConversion: pct(a.ventas, a.contactos),
      }))
      .sort((x, y) => y.ventas - x.ventas || y.contactos - x.contactos);

    // ---- Distribución por estado (último estado de cada lead en el rango) ----
    const estadoCount = new Map<number, number>();
    for (const [, leadLogs] of byLead) {
      const last = leadLogs[leadLogs.length - 1];
      estadoCount.set(last.leadStateId, (estadoCount.get(last.leadStateId) || 0) + 1);
    }
    const porEstado = [...estadoCount.entries()]
      .map(([stateId, count]) => ({ estado: STATE_LABELS[stateId] || `Estado ${stateId}`, count }))
      .sort((a, b) => b.count - a.count);

    const porOrigen = [...origenMap.entries()]
      .map(([origen, o]) => ({ origen, leads: o.leads, ventas: o.ventas, pctConversion: pct(o.ventas, o.leads) }))
      .sort((a, b) => b.ventas - a.ventas);

    return {
      rango: { startDate: start, endDate: end },
      resumen: {
        leadsGestionados,
        contactados,
        ventas,
        totalInteracciones: logs.length,
        pctContacto: pct(contactados, leadsGestionados),
        pctContratacion: pct(ventas, contactados), // sobre contactados
        pctContratacionSobreGestionados: pct(ventas, leadsGestionados),
        mediaIntentosHastaContacto: round2(avg(intentosHastaContacto)),
        tiempoMedioRespuestaDias: round2(avg(tiemposRespuestaDias)),
      },
      porOrigen,
      ranking,
      porEstado,
    };
  };
}
