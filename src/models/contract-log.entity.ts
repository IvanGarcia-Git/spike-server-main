import { Contract } from "./contract.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class ContractLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 255 })
  log: string;

  @Column()
  contractId: number;

  @ManyToOne(() => Contract, (contract) => contract.logs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId" })
  contract: Contract;

  @CreateDateColumn()
  createdAt: Date;
}
