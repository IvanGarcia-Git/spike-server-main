import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { HolidayScope } from "../enums/holiday-scope.enum";
import { User } from "./user.entity";
import { Group } from "./group.entity";

@Entity("holidays")
export class Holiday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 36, nullable: true, default: null })
  uuid: string;

  @Column({ type: "date" })
  date: string;

  @Column()
  name: string;

  @Column({
    type: "varchar",
    length: 20,
    default: HolidayScope.Global,
  })
  scope: HolidayScope;

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ nullable: true })
  groupId: number | null;

  @ManyToOne(() => Group, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "groupId" })
  group: Group;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
