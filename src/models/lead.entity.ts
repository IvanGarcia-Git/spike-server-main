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
} from "typeorm";
import { LeadState } from "./lead-state.entity";
import { Campaign } from "./campaign.entity";
import { LeadLog } from "./lead-log.entity";
import { LeadQueue } from "./lead-queue.entity";
import { User } from "./user.entity";
import { LeadCall } from "./lead-call.entity";
import { LeadSheet } from "./lead-sheet.entity";
import { LeadDocument } from "./lead-document.entity";

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
    type: "enum",
    enum: GroupShift,
    nullable: true,
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
