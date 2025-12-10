import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
} from "typeorm";
import { TimeEntry } from "./time-entry.entity";

export enum BreakStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
}

@Entity("time_breaks")
export class TimeBreak {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", unique: true })
  @Generated("uuid")
  uuid: string;

  @Column()
  timeEntryId: number;

  @ManyToOne(() => TimeEntry, (timeEntry) => timeEntry.breaks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "timeEntryId" })
  timeEntry: TimeEntry;

  @Column({ type: "datetime" })
  startTime: Date;

  @Column({ type: "datetime", nullable: true })
  endTime: Date | null;

  @Column({
    type: "varchar",
    default: BreakStatus.ACTIVE,
  })
  status: BreakStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
