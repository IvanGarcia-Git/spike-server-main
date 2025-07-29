import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Task } from "./task.entity";

@Entity()
export class TaskState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 100 })
  name: string;

  @Column("varchar", { length: 10 })
  colorHex: string;

  @OneToMany(() => Task, (task) => task.taskState)
  tasks: Task[];
}
