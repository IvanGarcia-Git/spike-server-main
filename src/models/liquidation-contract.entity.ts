import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Liquidation } from "./liquidation.entity";
import { Contract } from "./contract.entity";

@Entity("liquidation_contracts")
@Unique(["liquidationId", "contractId"])
export class LiquidationContract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
    unique: true,
  })
  @Generated("uuid")
  uuid: string;

  @Column()
  liquidationId: number;

  @Column()
  contractId: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  overrideCommission?: number;

  @Column("float", { nullable: true })
  consumo?: number;

  @Column("boolean", { default: false })
  isRenewal: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Liquidation, (liquidation) => liquidation.liquidationContracts, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "liquidationId" })
  liquidation: Liquidation;

  @ManyToOne(() => Contract, (contract) => contract.liquidationContracts, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "contractId" })
  contract: Contract;
}