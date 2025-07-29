import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Task } from "./task.entity";

@Entity()
export class TaskComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  text: string;

  @Column("varchar", { length: 255, nullable: true })
  documentUri?: string;

  @Column()
  taskId: number;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Task, (task) => task.comments, { onDelete: "CASCADE" })
  task: Task;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: "CASCADE" })
  user: User;
}
