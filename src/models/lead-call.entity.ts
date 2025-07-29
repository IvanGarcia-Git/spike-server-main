import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Lead } from "./lead.entity";

@Entity()
export class LeadCall {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("uuid")
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 255 })
  subject: string;

  @Column("varchar", { length: 255, nullable: true })
  observations?: string;

  @Column("varchar", { length: 255, nullable: true })
  documentUri?: string;

  @Column("varchar", { length: 255, nullable: true })
  contractUrl?: string;

  @Column("datetime")
  startDate: Date;

  @Column("boolean", { default: false })
  completed: boolean;

  @Column()
  userId: number;

  @Column({ nullable: true })
  leadId?: number;

  @ManyToOne(() => User, (user) => user.reminders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Lead, (lead) => lead.leadCalls, { onDelete: "CASCADE" })
  @JoinColumn({ name: "leadId" })
  lead: Lead;

  @CreateDateColumn()
  createdAt: Date;
}
