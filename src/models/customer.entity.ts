import { Contract } from "./contract.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Origin } from "./origin.entity";

export enum CustomerType {
  B2C = "B2C",
  B2B = "B2B",
}

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 100, nullable: true })
  name?: string;

  @Column("varchar", { length: 100, nullable: true })
  surnames?: string;

  @Column("varchar", { length: 20, nullable: true })
  nationalId?: string;

  @Column("varchar", { length: 100, nullable: true })
  nationality?: string;

  @Column("varchar", { length: 100, nullable: true })
  email: string;

  @Column("varchar", { length: 255, nullable: true })
  address?: string;

  @Column("varchar", { length: 20, nullable: true })
  zipCode?: string;

  @Column("varchar", { length: 100, nullable: true })
  province?: string;

  @Column("varchar", { length: 100, nullable: true })
  populace?: string;

  @Column("varchar", { length: 15, nullable: true })
  phoneNumber?: string;

  @Column("varchar", { length: 40, nullable: true })
  iban?: string;

  @Column("boolean", { default: false })
  holderChange?: boolean;

  @Column("boolean", { default: false })
  newCreation?: boolean;

  @Column("boolean", { default: false })
  powerChange?: boolean;

  @Column({
    type: "varchar", nullable: true,
  })
  type?: CustomerType;

  @Column("varchar", { length: 20, nullable: true })
  cif?: string;

  @Column("varchar", { length: 100, nullable: true })
  tradeName?: string;

  @Column({ nullable: true })
  originId?: number;

  @OneToMany(() => Contract, (contract) => contract.customer)
  contracts: Contract[];

  @ManyToOne(() => Origin, (origin) => origin.customers, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "originId" })
  origin?: Origin;
}
