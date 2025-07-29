import { Contract } from "./contract.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Generated,
} from "typeorm";

@Entity()
export class ContractDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 255 })
  fileName: string;

  @Column()
  contractId: number;

  @Column("varchar", { length: 255 })
  documentUri: string;

  @ManyToOne(() => Contract, (contract) => contract.documents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId" })
  contract: Contract;

  @CreateDateColumn()
  createdAt: Date;
}
