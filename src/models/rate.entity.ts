import { Channel } from "./channel.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany } from "typeorm";
import { Company } from "./company.entity";
import { Contract } from "./contract.entity";
import { TelephonyData } from "./telephony-data.entity";
import { CommissionAssignment } from "./commission-assignment.entity";
import { CommissionTier } from "./commission-tier.entity";

export enum RateTypes {
  TWO = "2.0",
  THREE = "3.0",
  SIX = "6.1",
}

export enum ServiceType {
  LUZ = "Luz",
  GAS = "Gas",
  TELEFONIA = "Telefonía",
}

// Categoría de peaje (RL) de las tarifas de gas. Permite que las comparativas
// solo enfrenten tarifas de la misma categoría (RL.1 con RL.1, etc.).
export enum RlCategory {
  RL1 = "RL.1",
  RL2 = "RL.2",
  RL3 = "RL.3",
  RL4 = "RL.4",
  RL5 = "RL.5",
  RL6 = "RL.6",
}

export enum Documentation {
  dni = "DNI",
  cif = "CIF",
  bill = "Factura",
  deeds = "Escrituras",
  recording = "Grabación",
  cie = "CIE",
  other = "Otro",
}

@Entity()
export class Rate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 50,
  })
  name: string;

  @Column("int")
  renewDays: number;

  @Column("int", { nullable: true })
  paymentDay?: number;

  @Column("float", { nullable: true })
  paymentMoney?: number;

  @Column("float", { nullable: true })
  paymentPoints?: number;

  @Column("float", { nullable: true })
  powerSlot1?: number;

  @Column("float", { nullable: true })
  powerSlot2?: number;

  @Column("float", { nullable: true })
  powerSlot3?: number;

  @Column("float", { nullable: true })
  powerSlot4?: number;

  @Column("float", { nullable: true })
  powerSlot5?: number;

  @Column("float", { nullable: true })
  powerSlot6?: number;

  @Column("float", { nullable: true })
  energySlot1?: number;

  @Column("float", { nullable: true })
  energySlot2?: number;

  @Column("float", { nullable: true })
  energySlot3?: number;

  @Column("float", { nullable: true })
  energySlot4?: number;

  @Column("float", { nullable: true })
  energySlot5?: number;

  @Column("float", { nullable: true })
  energySlot6?: number;

  @Column("float", { nullable: true })
  surplusSlot1?: number;

  @Column("simple-json", { nullable: true })
  documentation?: Documentation[];

  @Column("boolean", { default: false })
  renewable: boolean;

  @Column({
    type: "varchar", nullable: true,
  })
  type?: RateTypes;

  @Column({
    type: "varchar",
    nullable: true,
  })
  serviceType?: ServiceType;

  // Categoría RL (solo aplica a tarifas de gas). Nullable para no romper
  // tarifas históricas; las comparativas filtran por este valor.
  @Column({
    type: "varchar",
    nullable: true,
  })
  rlCategory?: RlCategory;

  @Column("int", { nullable: true })
  channelId?: number;

  @Column("int")
  companyId: number;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  products?: string;

  @Column("float", { nullable: true })
  finalPrice?: number;

  @ManyToOne(() => Channel, (channel) => channel.rates, {
    onDelete: "SET NULL",
  })
  channel: Channel;

  @ManyToOne(() => Company, (company) => company.rates)
  company: Company;

  @OneToMany(() => Contract, (contract) => contract.rate)
  contracts: Contract[];

  @OneToMany(() => CommissionAssignment, (ca) => ca.rate)
  commissionAssignments: CommissionAssignment[];

  @OneToMany(() => CommissionTier, (tier) => tier.rate)
  commissionTiers: CommissionTier[];

  @ManyToMany(() => TelephonyData, (telephonyData) => telephonyData.rates)
  telephonyData: TelephonyData[];
}
