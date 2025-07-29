import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Contract } from "./contract.entity";

export enum ContractHistoryStatus {
  RENOVADO = "Renovado",
  BAJA = "Baja",
}

@Entity()
export class ContractHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 100 })
  companyName: string;

  @Column("varchar", { length: 100 })
  rateName: string;

  @Column({
    type: "enum",
    enum: ContractHistoryStatus,
  })
  status: ContractHistoryStatus;

  @Column()
  contractId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Contract, (contract) => contract.history, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId" })
  contract: Contract;
}
