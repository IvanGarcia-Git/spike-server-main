import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { LiquidationContract } from "./liquidation-contract.entity";

export enum LiquidationStatus {
  PENDIENTE = "PENDIENTE",
  EN_REVISION = "EN REVISION",
  PAGADA = "PAGADA",
  RECHAZADA = "RECHAZADA",
}

// Tipo de liquidación: INGRESO suma al saldo, GASTO resta del saldo
export enum LiquidationType {
  INGRESO = "INGRESO",
  GASTO = "GASTO",
}

@Entity("liquidations")
export class Liquidation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
    unique: true,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", {
    length: 255,
  })
  name: string;

  @Column("date") // Stores (YYYY-MM-DD)
  date: string;

  @Column({
    type: "varchar", default: LiquidationStatus.PENDIENTE,
  })
  status: LiquidationStatus;

  // Tipo de liquidación: INGRESO suma al saldo, GASTO resta del saldo
  @Column({
    type: "varchar",
    default: LiquidationType.INGRESO,
  })
  type: LiquidationType;

  // Monto manual para liquidaciones sin contratos vinculados (opcional)
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
  })
  amount: number | null;

  @Column({ nullable: true })
  userId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.liquidations, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "userId" })
  user: User | null;

  @OneToMany(() => LiquidationContract, (liquidationContract) => liquidationContract.liquidation, {
    cascade: true,
  })
  liquidationContracts: LiquidationContract[];
}