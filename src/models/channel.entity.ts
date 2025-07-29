import { Entity, PrimaryGeneratedColumn, Column, Generated, OneToMany } from "typeorm";
import { Rate } from "./rate.entity";
import { Contract } from "./contract.entity";
import { CommissionAssignment } from "./commission-assignment.entity";

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  imageUri?: string;

  @Column("varchar", {
    length: 50,
  })
  name: string;

  @Column("varchar", {
    length: 100,
  })
  representativeName: string;

  @Column("varchar", {
    length: 15,
  })
  representativePhone: string;

  @Column("varchar", {
    length: 100,
  })
  representativeEmail: string;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  address?: string;

  @Column("varchar", {
    length: 50,
    nullable: true,
  })
  cif?: string;

  @Column("varchar", {
    length: 50,
    nullable: true,
  })
  iban?: string;

  //TODO: Delete
  @Column("json", { nullable: true })
  companies?: { companyId: number; companyName: string }[];

  @OneToMany(() => Rate, (rate) => rate.channel)
  rates: Rate[];

  @OneToMany(() => Contract, (contract) => contract.channel)
  contracts: Contract[];

  @OneToMany(() => CommissionAssignment, (ca) => ca.channel)
  commissionAssignments: CommissionAssignment[];
}
