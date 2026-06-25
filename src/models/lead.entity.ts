import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Generated,
  ManyToMany,
} from "typeorm";
import { LeadState } from "./lead-state.entity";
import { Campaign } from "./campaign.entity";
import { LeadLog } from "./lead-log.entity";
import { LeadQueue } from "./lead-queue.entity";
import { User } from "./user.entity";
import { LeadCall } from "./lead-call.entity";
import { LeadSheet } from "./lead-sheet.entity";
import { LeadDocument } from "./lead-document.entity";
import { Tipification } from "./tipification.entity";

export enum GroupShift {
  MORNING = "morning",
  EVENING = "evening",
}

@Entity()
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("uuid")
  @Generated("uuid")
  uuid: string;

  @Column("varchar", {
    length: 255,
  })
  fullName: string;

  @Column("varchar", {
    length: 20,
  })
  phoneNumber: string;

  @Column("varchar", {
    length: 100,
    nullable: true,
  })
  email?: string;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  billUri?: string;

  @Column({
    type: "varchar", nullable: true,
  })
  shift?: GroupShift;

  //This is only an informative and arbitrary field so is no related to any user logic
  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  assignedUserName?: string;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  removedCampaignName?: string;

  // Ciclo de vida del lead
  @Column("varchar", {
    length: 50,
    default: "activo",
    comment: "Estado en el ciclo de vida: activo/muerto/callback",
  })
  status: string;

  @Column({
    type: "int",
    default: 0,
    comment: "Número de intentos de llamada realizados",
  })
  attemptCount: number;

  @Column({
    type: "datetime",
    nullable: true,
    comment: "Fecha/hora programada para la próxima llamada (callback)",
  })
  nextCallDate?: Date;

  @Column({
    type: "json",
    nullable: true,
    comment: "Historial de agentes que han intentado este lead [{userId, timestamp}][]",
  })
  agentRotationHistory?: Array<{ userId: number; timestamp: string }>;

  @Column("varchar", {
    length: 20,
    nullable: true,
    comment: "Número de WhatsApp (obligatorio desde intento 6)",
  })
  whatsappNumber?: string;

  @Column({
    type: "boolean",
    default: false,
    comment: "True cuando el lead está bloqueado definitivamente a un agente (tras intento 6)",
  })
  isPermanentlyAssigned: boolean;

  // Tipificación actual y histórico
  @Column({ nullable: true })
  lastTipificationId?: number;

  @ManyToOne(() => Tipification, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "lastTipificationId" })
  lastTipification?: Tipification;

  @OneToMany(() => LeadTipificationHistory, (history) => history.lead)
  tipificationHistory: LeadTipificationHistory[];

  // Geographic zone of the lead, used by the auto-assignment rules engine (PRES-018 B2a).
  @Column("varchar", {
    length: 100,
    nullable: true,
  })
  zona?: string;

  @Column({ nullable: true })
  leadStateId?: number;

  @Column({ nullable: true })
  campaignId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => LeadState, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "leadStateId" })
  leadState?: LeadState;

  @ManyToOne(() => Campaign, { onDelete: "SET NULL" })
  @JoinColumn({ name: "campaignId" })
  campaign: Campaign;

  @OneToMany(() => LeadLog, (leadLogs) => leadLogs.lead)
  leadLogs: LeadLog[];

  @OneToMany(() => LeadDocument, (document) => document.lead)
  documents: LeadDocument[];

  @OneToMany(() => LeadCall, (leadCalls) => leadCalls.lead)
  leadCalls: LeadCall[];

  @OneToMany(() => LeadQueue, (leadQueue) => leadQueue.lead)
  leadQueues: LeadQueue[];

  @OneToOne(() => User, (user) => user.lead, {
    nullable: true,
    onDelete: "SET NULL",
  })
  user?: User;

  @OneToOne(() => LeadSheet, (leadSheet) => leadSheet.lead)
  leadSheet: LeadSheet;
}

// Entidad para el histórico de tipificaciones (se define aquí para evitar circular)
@Entity()
export class LeadTipificationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @Column()
  tipificationId: number;

  @Column()
  userId: number;

  @Column({ type: "text", nullable: true })
  observation?: string;

  @Column({
    type: "int",
    comment: "Número de intentos en el momento de tipificar",
  })
  attemptCountAtTipification: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Lead, (lead) => lead.tipificationHistory, { onDelete: "CASCADE" })
  @JoinColumn({ name: "leadId" })
  lead: Lead;

  @ManyToOne(() => Tipification, { onDelete: "SET NULL" })
  @JoinColumn({ name: "tipificationId" })
  tipification: Tipification;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;
}
