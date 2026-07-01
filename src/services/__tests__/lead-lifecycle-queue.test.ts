/**
 * Pruebas de regresión — consistencia contador de cola ↔ solicitar lead.
 *
 * Bug original (change request "Gestor de leads"): "Aparece que hay 10 leads en cola
 * pero cuando voy a solicitar lead no me sale ninguno". La causa: getQueueStats
 * (contador) y requestNextLead (solicitar) divergían en la rama de REINTENTOS —
 * el contador contaba reintentos vencidos que la rotación NUNCA sirve al mismo agente
 * que los intentó por última vez.
 *
 * Invariante que estas pruebas blindan:
 *   getQueueStats().availableInQueue  ===  nº de leads que requestNextLead puede servir
 *   realmente a ese agente (drenando la cola). Si el contador dice N, solicitar debe
 *   devolver exactamente N leads antes de agotarse.
 *
 * Corre 100% en memoria (TypeORM + sqljs), sin MySQL. No necesita infraestructura E2E:
 *   npm test
 *
 * IMPORTANTE: fijamos las env de sqljs ANTES de require() del data source, por eso este
 * fichero usa require() en vez de import (los import se hoisted y romperían el orden).
 */
process.env.NODE_ENV = "test";
process.env.DB_TYPE = "sqlite";
process.env.DB_PATH = "/tmp/spikes-queue-regression-test.db";

import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";

// require() (no import) para respetar el orden: env → data source → servicio.
const { dataSource } = require("../../../app-data-source");
const { Lead } = require("../../models/lead.entity");
const { User } = require("../../models/user.entity");
const { Group } = require("../../models/group.entity");
const { GroupUser } = require("../../models/group-user.entity");
const { GroupCampaign } = require("../../models/group-campaign.entity");
const { Campaign } = require("../../models/campaign.entity");
const { LeadQueue } = require("../../models/lead-queue.entity");
const { LeadLifecycleService } = require("../lead-lifecycle.service");

const hoursAgo = (h: number): Date => new Date(Date.now() - h * 3600_000);
let uuidSeq = 0;
const uuid = (): string => `00000000-0000-4000-8000-${String(++uuidSeq).padStart(12, "0")}`;

// --- Seed helpers -----------------------------------------------------------

const seedCampaignForAgent = async (): Promise<{ userId: number; campaignId: number }> => {
  const campaign = await dataSource.getRepository(Campaign).save({ uuid: uuid(), name: "Campaña test" });
  const group = await dataSource.getRepository(Group).save({ uuid: uuid(), name: "Grupo test", shift: "all" });
  await dataSource.getRepository(GroupCampaign).save({ groupId: group.id, campaignId: campaign.id });
  const user = await dataSource.getRepository(User).save({
    uuid: uuid(),
    name: "Agente",
    firstSurname: "Uno",
    secondSurname: "Test",
    username: `agente_${uuid()}`,
    email: `agente_${uuid()}@test.local`,
    password: "x",
    isManager: false,
    groupId: group.id,
    leadPriorities: [],
  });
  await dataSource.getRepository(GroupUser).save({ groupId: group.id, userId: user.id });
  return { userId: user.id, campaignId: campaign.id };
};

type LeadSeed = Partial<{
  campaignId: number;
  status: string;
  attemptCount: number;
  nextCallDate: Date;
  lastAttemptUserId: number;
  leadStateId: number | null;
}>;

const seedLead = async (data: LeadSeed) => {
  return dataSource.getRepository(Lead).save({
    uuid: uuid(),
    fullName: "Lead Test",
    phoneNumber: "600000000",
    status: "activo",
    attemptCount: 0,
    leadStateId: null,
    ...data,
  });
};

/** Drena la cola: solicita leads uno a uno, "cerrando" cada servido (status muerto)
 *  y liberando al agente, hasta que requestNextLead devuelve null. Devuelve cuántos sirvió. */
const drainQueue = async (userId: number): Promise<number> => {
  let served = 0;
  // Cota de seguridad para que un fallo nunca cuelgue el test.
  for (let i = 0; i < 1000; i++) {
    const lead = await LeadLifecycleService.requestNextLead(userId);
    if (!lead) break;
    served++;
    // Simula que el agente lo tipifica y se cierra: deja de estar disponible y libera al agente.
    await dataSource.getRepository(Lead).update(lead.id, { status: "muerto" });
    await dataSource.getRepository(User).update(userId, { leadId: null });
  }
  return served;
};

const clearAll = async (): Promise<void> => {
  // Libera referencias user.leadId antes de borrar leads (por si los FKs están activos).
  await dataSource.getRepository(User).update({}, { leadId: null }).catch(() => {});
  for (const E of [LeadQueue, Lead, GroupUser, GroupCampaign, User, Group, Campaign]) {
    await dataSource.createQueryBuilder().delete().from(E).execute();
  }
};

// --- Ciclo de vida del suite ------------------------------------------------

before(async () => {
  try {
    fs.unlinkSync(process.env.DB_PATH as string);
  } catch {
    /* no existía */
  }
  await dataSource.initialize();
});

beforeEach(async () => {
  await clearAll();
});

after(async () => {
  await dataSource.destroy();
  try {
    fs.unlinkSync(process.env.DB_PATH as string);
  } catch {
    /* ya limpio */
  }
});

// --- Pruebas ----------------------------------------------------------------

test("REGRESIÓN: reintentos que solo intentó este agente NO se cuentan (no vuelven por rotación)", async () => {
  const { userId, campaignId } = await seedCampaignForAgent();
  // 3 reintentos vencidos, todos con último intento del PROPIO agente → la rotación los excluye.
  for (let i = 0; i < 3; i++) {
    await seedLead({
      campaignId,
      status: "retry",
      attemptCount: 1,
      nextCallDate: hoursAgo(1),
      lastAttemptUserId: userId,
    });
  }

  const { availableInQueue } = await LeadLifecycleService.getQueueStats(userId);
  const served = await drainQueue(userId);

  // El bug original: availableInQueue === 3 pero served === 0. Tras el fix ambos === 0.
  assert.equal(availableInQueue, 0, "el contador no debe incluir reintentos que la rotación no sirve");
  assert.equal(served, 0, "requestNextLead no debe servir reintentos del propio agente");
  assert.equal(availableInQueue, served, "contador y leads servibles deben coincidir");
});

test("un reintento vencido de OTRO agente sí se cuenta y se sirve", async () => {
  const { userId, campaignId } = await seedCampaignForAgent();
  await seedLead({
    campaignId,
    status: "retry",
    attemptCount: 1,
    nextCallDate: hoursAgo(2),
    lastAttemptUserId: userId + 999, // lo intentó otro agente
  });

  const { availableInQueue } = await LeadLifecycleService.getQueueStats(userId);
  const served = await drainQueue(userId);

  assert.equal(availableInQueue, 1);
  assert.equal(served, 1);
});

test("leads nuevos: contador y servibles coinciden", async () => {
  const { userId, campaignId } = await seedCampaignForAgent();
  for (let i = 0; i < 5; i++) await seedLead({ campaignId, status: "activo", attemptCount: 0 });

  const { availableInQueue } = await LeadLifecycleService.getQueueStats(userId);
  const served = await drainQueue(userId);

  assert.equal(availableInQueue, 5);
  assert.equal(served, 5);
});

test("callback vencido hoy: se cuenta y se sirve; callback futuro (otro día) no", async () => {
  const { userId, campaignId } = await seedCampaignForAgent();
  await seedLead({ campaignId, status: "callback", attemptCount: 1, nextCallDate: hoursAgo(1) });
  // Callback agendado dentro de 3 días: fuera de "hoy o vencido".
  await seedLead({ campaignId, status: "callback", attemptCount: 1, nextCallDate: new Date(Date.now() + 3 * 86400_000) });

  const { availableInQueue } = await LeadLifecycleService.getQueueStats(userId);
  const served = await drainQueue(userId);

  assert.equal(availableInQueue, 1);
  assert.equal(served, 1);
});

test("cola personal (LeadQueue): se cuenta y se sirve con máxima prioridad", async () => {
  const { userId, campaignId } = await seedCampaignForAgent();
  // Lead asignado a la cola personal del agente (p.ej. por regla de asignación PRES-018).
  const lead = await seedLead({ campaignId, status: "activo", attemptCount: 0, leadStateId: 5 });
  await dataSource.getRepository(LeadQueue).save({ leadId: lead.id, userId, position: 1 });

  const { availableInQueue } = await LeadLifecycleService.getQueueStats(userId);
  const served = await drainQueue(userId);

  assert.equal(availableInQueue, 1, "la cola personal debe contarse");
  assert.equal(served, 1, "la cola personal debe servirse");
});

test("INVARIANTE GLOBAL (escenario del change request): el contador coincide con lo servible en un pool mixto", async () => {
  const { userId, campaignId } = await seedCampaignForAgent();
  // 2 nuevos (servibles) + 1 callback vencido (servible) + 1 reintento de otro (servible)
  // + 3 reintentos del propio agente (NO servibles, rotación). Servibles reales = 4.
  await seedLead({ campaignId, status: "activo", attemptCount: 0 });
  await seedLead({ campaignId, status: "activo", attemptCount: 0 });
  await seedLead({ campaignId, status: "callback", attemptCount: 1, nextCallDate: hoursAgo(1) });
  await seedLead({ campaignId, status: "retry", attemptCount: 1, nextCallDate: hoursAgo(2), lastAttemptUserId: userId + 999 });
  for (let i = 0; i < 3; i++) {
    await seedLead({ campaignId, status: "retry", attemptCount: 1, nextCallDate: hoursAgo(2), lastAttemptUserId: userId });
  }

  const { availableInQueue } = await LeadLifecycleService.getQueueStats(userId);
  const served = await drainQueue(userId);

  assert.equal(availableInQueue, 4, "el contador debe reflejar solo lo realmente servible");
  assert.equal(served, 4, "solicitar debe entregar exactamente los leads que el contador anuncia");
  assert.equal(availableInQueue, served, "NO se reproduce el bug: contador === leads servibles");
});
