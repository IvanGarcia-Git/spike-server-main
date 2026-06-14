import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * PRES-018 B2a — Regla configurable de asignación automática de leads.
 *
 * Una regla "encaja" con un lead cuando TODOS sus criterios definidos (no nulos)
 * coinciden. Las reglas se evalúan por `priority` ascendente; la primera que
 * encaja decide el destinatario según `assignMode`.
 */

export enum AssignMode {
  DIRECT = "direct", // a un agente concreto (targetUserId)
  ROUND_ROBIN = "round_robin", // rotatorio entre los miembros del grupo (targetGroupId)
  LEAST_BUSY = "least_busy", // al miembro del grupo con menos leads en cola
}

@Entity()
export class LeadAssignmentRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 36 })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 150 })
  name: string;

  @Column("boolean", { default: true })
  active: boolean;

  // Menor = se evalúa antes.
  @Column("int", { default: 100 })
  priority: number;

  // --- Criterios (nulos = no filtra por ese criterio) ---
  @Column("varchar", { length: 100, nullable: true })
  zona?: string;

  @Column("varchar", { length: 50, nullable: true })
  sector?: string; // Campaign.sector: Luz | Gas | Placas | Telefonia

  @Column("varchar", { length: 255, nullable: true })
  origin?: string; // Campaign.source

  @Column("int", { nullable: true })
  campaignId?: number;

  @Column("varchar", { length: 20, nullable: true })
  shift?: string; // morning | evening

  // --- Destino ---
  @Column("varchar", { length: 20, default: AssignMode.LEAST_BUSY })
  assignMode: AssignMode;

  @Column("int", { nullable: true })
  targetUserId?: number; // para assignMode = direct

  @Column("int", { nullable: true })
  targetGroupId?: number; // para round_robin / least_busy

  // Estado interno de la rotación round-robin: último userId asignado.
  @Column("int", { default: 0 })
  roundRobinCursor: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
