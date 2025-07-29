import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { LeadState } from "./lead-state.entity";
import { User } from "./user.entity";
import { Lead } from "./lead.entity";

@Entity()
export class LeadLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 255 })
  observations: string;

  @Column()
  leadStateId: number;

  @Column()
  userId: number;

  @Column()
  leadId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => LeadState, (leadState) => leadState.leadLogs)
  @JoinColumn({ name: "leadStateId" })
  leadState: LeadState;

  @ManyToOne(() => User, (user) => user.leadLogs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Lead, (lead) => lead.leadLogs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "leadId" })
  lead: Lead;
}
