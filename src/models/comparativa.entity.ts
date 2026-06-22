import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum ComparisonType {
  LUZ = "luz",
  GAS = "gas",
}

export enum CustomerType {
  PARTICULAR = "particular",
  EMPRESA = "empresa",
}

@Entity()
export class Comparativa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", {
    length: 255,
  })
  clientName: string;

  @Column({
    type: "varchar",
    length: 20,
  })
  comparisonType: ComparisonType;

  @Column({
    type: "varchar",
    length: 20,
  })
  customerType: CustomerType;

  @Column("varchar", {
    length: 50,
  })
  tariffType: string;

  // CUPS del suministro y comercializadora actual del cliente. Los pre-rellena el OCR
  // (ExtractedInvoiceData.cups / .companyName) para mostrarlos en la cabecera del PDF.
  // Nullable: comparativas antiguas no los tienen y el alta manual puede omitirlos.
  @Column("varchar", {
    length: 50,
    nullable: true,
  })
  cups?: string;

  @Column("varchar", {
    length: 120,
    nullable: true,
  })
  comercializadora?: string;

  // Autoconsumo / placas solares. El OCR (ExtractedInvoiceData.hasSolarPanels) pre-rellena este
  // checkbox en el wizard; el agente puede corregirlo antes de guardar (PRES-018 "Comparativas 6").
  @Column("boolean", {
    default: false,
  })
  solarPanelActive: boolean;

  // kWh de excedentes vertidos a red. Lo pre-rellena el OCR (ExtractedInvoiceData.surplusCount).
  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  excedentes?: number;

  @Column("simple-json", {
    nullable: true,
  })
  potencias?: number[];

  @Column("simple-json", {
    nullable: true,
  })
  energias?: number[];

  @Column("int", {
    nullable: true,
  })
  numDias?: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  currentBillAmount: number;

  @Column("boolean", {
    default: false,
  })
  hasMainServices: boolean;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  mainMaintenanceCost?: number;

  @Column("boolean", {
    default: false,
  })
  hasClientServices: boolean;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  clientMaintenanceCost?: number;

  @Column("simple-json", {
    nullable: true,
  })
  clientPowerPrices?: number[];

  @Column("simple-json", {
    nullable: true,
  })
  clientEnergyPrices?: number[];

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  clientSurplusPrice?: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  clientFixedPrice?: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  clientGasEnergyPrice?: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  calculatedOldPrice: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  calculatedNewPrice: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  savings: number;

  @Column("text", {
    nullable: true,
  })
  calculationDetails?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: number;
}