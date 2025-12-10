import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { TimeBreak } from "./time-break.entity";
import { TimeEntryAudit } from "./time-entry-audit.entity";

export enum TimeEntryStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
}

@Entity("time_entries")
export class TimeEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", unique: true })
  @Generated("uuid")
  uuid: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.timeEntries, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "datetime" })
  clockInTime: Date;

  @Column({ type: "datetime", nullable: true })
  clockOutTime: Date | null;

  @Column({
    type: "varchar",
    default: TimeEntryStatus.ACTIVE,
  })
  status: TimeEntryStatus;

  @Column({ type: "int", default: 0 })
  totalBreakMinutes: number;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @OneToMany(() => TimeBreak, (timeBreak) => timeBreak.timeEntry)
  breaks: TimeBreak[];

  @OneToMany(() => TimeEntryAudit, (audit) => audit.timeEntry)
  audits: TimeEntryAudit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
