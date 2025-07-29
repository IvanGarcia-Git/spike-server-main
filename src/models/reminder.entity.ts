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

@Entity()
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("uuid")
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 255 })
  subject: string;

  @Column("varchar", { length: 255, nullable: true })
  description?: string;

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

  @ManyToOne(() => User, (user) => user.reminders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
