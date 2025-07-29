import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  Generated,
  OneToOne,
} from "typeorm";
import { Rate } from "./rate.entity";
import { Contract } from "./contract.entity";

@Entity()
export class TelephonyData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("int", { nullable: true })
  landlinePhone?: number;

  @Column("json", { nullable: true })
  telephoneLines?: number[];

  @Column("json", { nullable: true })
  extraServices?: string[];

  @OneToOne(() => Contract, (contract) => contract.telephonyData)
  contract: Contract;

  @ManyToMany(() => Rate, (rate) => rate.telephonyData)
  @JoinTable()
  rates: Rate[];
}
