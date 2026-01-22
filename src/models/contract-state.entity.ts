import { Contract } from "./contract.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity()
export class ContractState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 50,
  })
  name: string;

  @Column("varchar", {
    length: 10,
  })
  colorHex: string;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  extraInfo?: string;

  @Column("boolean", {
    default: false,
  })
  default: boolean;

  @Column("int", {
    default: 0,
  })
  displayOrder: number;

  @OneToMany(() => Contract, (contract) => contract.contractState)
  contracts: Contract[];
}
