import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { TaskState } from "./task-state.entity";
import { TaskComment } from "./task-comment.entity";

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("uuid")
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 255 })
  subject: string;

  @Column("timestamp")
  startDate: Date;

  @Column()
  assigneeUserId: number;

  @Column()
  creatorUserId: number;

  @Column({ default: 1 })
  taskStateId: number;

  @Column("varchar", { length: 255, nullable: true })
  contractUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.assignedTasks, { onDelete: "CASCADE" })
  assigneeUser: User;

  @ManyToOne(() => User, (user) => user.createdTasks, { onDelete: "CASCADE" })
  creatorUser: User;

  @ManyToOne(() => TaskState, (taskState) => taskState.tasks)
  taskState: TaskState;

  @OneToMany(() => TaskComment, (taskComment) => taskComment.task)
  comments: TaskComment[];
}
