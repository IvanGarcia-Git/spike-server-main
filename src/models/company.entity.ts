import { Contract } from "./contract.entity";
import { Entity, PrimaryGeneratedColumn, Column, Generated, OneToMany } from "typeorm";
import { Rate } from "./rate.entity";

// Definimos un enum para el tipo de compañía
export enum CompanyType {
  LUZ = "Luz",
  GAS = "Gas",
  TELEFONIA = "Telefonía",
}

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", {
    length: 100,
  })
  name: string;

  @Column({
    type: "enum",
    enum: CompanyType,
  })
  type: CompanyType;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  imageUri?: string;

  @OneToMany(() => Rate, (rate) => rate.company)
  rates: Rate[];

  @OneToMany(() => Contract, (contract) => contract.company)
  contracts: Contract[];
}
