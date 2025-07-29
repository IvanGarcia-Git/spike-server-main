import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
} from "typeorm";
import { User } from "./user.entity";
import { AbsenceType } from "../enums/absence-type.enum";
import { AbsenceStatus } from "../enums/absence-status.enum";

@Entity("absences")
export class Absence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", unique: true })
  @Generated("uuid")
  uuid: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.absences, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "date" })
  startDate: string;

  @Column({ type: "date" })
  endDate: string;

  @Column({
    type: "enum",
    enum: AbsenceType,
    default: AbsenceType.Vacaciones,
  })
  type: AbsenceType;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: AbsenceStatus,
    default: AbsenceStatus.Pendiente,
  })
  status: AbsenceStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
