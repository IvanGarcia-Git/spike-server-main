import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
} from "typeorm";
import { TimeEntry } from "./time-entry.entity";
import { User } from "./user.entity";

export enum AuditAction {
  CLOCK_IN = "clock_in",
  CLOCK_OUT = "clock_out",
  BREAK_START = "break_start",
  BREAK_END = "break_end",
  EDIT_CLOCK_IN = "edit_clock_in",
  EDIT_CLOCK_OUT = "edit_clock_out",
  EDIT_BREAK = "edit_break",
  DELETE = "delete",
}

@Entity("time_entry_audits")
export class TimeEntryAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", unique: true })
  @Generated("uuid")
  uuid: string;

  @Column()
  timeEntryId: number;

  @ManyToOne(() => TimeEntry, (timeEntry) => timeEntry.audits, { onDelete: "CASCADE" })
  @JoinColumn({ name: "timeEntryId" })
  timeEntry: TimeEntry;

  @Column()
  modifiedByUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "modifiedByUserId" })
  modifiedByUser: User;

  @Column({ type: "varchar" })
  action: AuditAction;

  @Column({ type: "varchar", nullable: true })
  fieldName: string | null;

  @Column({ type: "text", nullable: true })
  oldValue: string | null;

  @Column({ type: "text", nullable: true })
  newValue: string | null;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
