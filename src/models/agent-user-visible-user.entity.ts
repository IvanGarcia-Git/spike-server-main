import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class AgentUserVisibleUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  agentId: number;

  @Column()
  visibleUserId: number;

  @ManyToOne(() => User, (user) => user.visibleUsers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "visibleUserId" })
  visibleUser: User;
}
