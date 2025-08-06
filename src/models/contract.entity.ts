import { Channel } from "./channel.entity";
import { Company } from "./company.entity";
import { ContractComment } from "./contract-comment.entity";
import { ContractDocument } from "./contract-document.entity";
import { ContractHistory } from "./contract-history.entity";
import { ContractLog } from "./contract-log.entity";
import { ContractState } from "./contract-state.entity";
import { Customer } from "./customer.entity";
import { Rate } from "./rate.entity";
import { TelephonyData } from "./telephony-data.entity";
import { User } from "./user.entity";
import { LiquidationContract } from "./liquidation-contract.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  OneToMany,
  OneToOne,
} from "typeorm";

export enum ContractType {
  LUZ = "Luz",
  GAS = "Gas",
  TELEFONIA = "Telefonía",
}

@Entity()
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column({ nullable: true })
  companyId?: number;

  @Column()
  customerId: number;

  @Column("varchar", { length: 30, nullable: true })
  cups?: string;

  @Column("boolean", { default: false })
  maintenance: boolean;

  @Column("boolean", { default: false })
  electronicBill: boolean;

  @Column("boolean", { default: false })
  payed: boolean;

  @Column("boolean", { default: true })
  isDraft: boolean;

  @Column({
    type: "varchar"
  })
  type: ContractType;

  @Column({ nullable: true })
  contractStateId?: number;

  @Column({ nullable: true })
  channelId?: number;

  @Column({ nullable: true })
  rateId?: number;

  @Column()
  userId: number;

  @Column("varchar", { length: 255, nullable: true })
  extraInfo?: string;

  @Column("boolean", { default: false })
  virtualBat: boolean;

  @Column("boolean", { default: false })
  solarPlates: boolean;

  @Column("json", { nullable: true })
  contractedPowers?: number[];

  @Column("varchar", { length: 10, nullable: true })
  product?: string;

  @Column("date", { nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Channel, (channel) => channel.contracts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "channelId" })
  channel?: Channel;

  @Column({ nullable: true })
  telephonyDataId?: number;

  @ManyToOne(() => ContractState, (contractState) => contractState.contracts)
  @JoinColumn({ name: "contractStateId" })
  contractState: ContractState;

  //TODO: Remove relation
  @ManyToOne(() => Company, (company) => company.contracts)
  @JoinColumn({ name: "companyId" })
  company: Company;

  @ManyToOne(() => Customer, (customer) => customer.contracts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "customerId" })
  customer: Customer;

  @ManyToOne(() => Rate, (rate) => rate.contracts)
  @JoinColumn({ name: "rateId" })
  rate: Rate;

  @ManyToOne(() => User, (user) => user.contracts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => ContractLog, (contractLog) => contractLog.contract)
  logs: ContractLog[];

  @OneToMany(() => ContractHistory, (contractHistory) => contractHistory.contract)
  history: ContractHistory[];

  @OneToMany(() => ContractDocument, (contractDocument) => contractDocument.contract)
  documents: ContractDocument[];

  @OneToOne(() => TelephonyData, { cascade: true, onDelete: "CASCADE" })
  @JoinColumn()
  telephonyData: TelephonyData;

  @OneToMany(() => ContractComment, (contractComment) => contractComment.contract)
  comments: ContractComment[];

  @OneToMany(() => LiquidationContract, (liquidationContract) => liquidationContract.contract)
  liquidationContracts: LiquidationContract[];
}
