import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  BeforeInsert,
} from "typeorm";
import { Lead } from "./lead.entity";
import { dataSource } from "../../app-data-source";
import { User } from "./user.entity";

@Entity()
export class LeadQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @Column()
  userId: number;

  @Column({ type: "int", unsigned: true })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.leadQueues, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Lead, (lead) => lead.leadQueues, { onDelete: "CASCADE" })
  @JoinColumn({ name: "leadId" })
  lead: Lead;

  @BeforeInsert()
  async setPosition() {
    const leadQueueRepository = dataSource.getRepository(LeadQueue);

    const lastPosition = await leadQueueRepository
      .createQueryBuilder("leadQueue")
      .where("leadQueue.userId = :userId", { userId: this.userId })
      .select("MAX(leadQueue.position)", "max")
      .getRawOne();

    this.position = lastPosition?.max ? parseInt(lastPosition.max) + 1 : 1;
  }
}
