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
    type: "enum",
    enum: LiquidationStatus,
    default: LiquidationStatus.PENDIENTE,
  })
  status: LiquidationStatus;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.liquidations, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => LiquidationContract, (liquidationContract) => liquidationContract.liquidation, {
    cascade: true,
  })
  liquidationContracts: LiquidationContract[];
}