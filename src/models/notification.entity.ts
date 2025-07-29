import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

export enum EventType {
  TASK = "task",
  REMINDER = "reminder",
  LEAD_CALL = "leadCall",
  COMMUNICATION = "communication",
  OTHER = "other",
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Index()
  @Column("varchar", {
    length: 36,
  })
  batchId: string;

  @Column({
    type: "enum",
    enum: EventType,
  })
  eventType: EventType;

  @Column("varchar", {
    length: 120,
    nullable: true,
  })
  subject?: string;

  @Column("varchar", {
    length: 255,
  })
  content: string;

  @Column("boolean", {
    default: false,
  })
  read: boolean;

  @Column("boolean", {
    default: false,
  })
  notified: boolean;

  @Column("varchar", { length: 255, nullable: true })
  documentUri?: string;

  @Column("varchar", { length: 255, nullable: true })
  sourceUrl?: string;

  @Column()
  userId: number;

  @Column("datetime")
  startDate: Date;

  @Column({ type: "int", nullable: true })
  creatorId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "creatorId" })
  creator?: User;
}
