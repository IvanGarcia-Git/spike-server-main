import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LeadLog } from "./lead-log.entity";

@Entity()
export class LeadState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 100,
    unique: true,
  })
  name: string;

  @Column("varchar", {
    length: 10,
  })
  colorHex: string;

  @OneToMany(() => LeadLog, (leadLog) => leadLog.leadState)
  leadLogs: LeadLog[];
}
