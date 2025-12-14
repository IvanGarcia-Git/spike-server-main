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
import { Channel } from "./channel.entity";

// Tipo de factura: COBRO (ingreso) o PAGO (gasto)
export enum InvoiceType {
  COBRO = "COBRO",
  PAGO = "PAGO",
}

@Entity("invoices")
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
    unique: true,
  })
  @Generated("uuid")
  uuid: string;

  // Número de factura (ej: F00025)
  @Column("varchar", {
    length: 50,
  })
  invoiceNumber: string;

  // Tipo: COBRO o PAGO
  @Column({
    type: "varchar",
    default: InvoiceType.COBRO,
  })
  type: InvoiceType;

  // Nombre del cliente/proveedor
  @Column("varchar", {
    length: 255,
  })
  clientName: string;

  // CIF/DNI del cliente (opcional)
  @Column("varchar", {
    length: 50,
    nullable: true,
  })
  clientNationalId: string | null;

  // Dirección del cliente (opcional)
  @Column("varchar", {
    length: 500,
    nullable: true,
  })
  clientAddress: string | null;

  // Concepto principal de la factura
  @Column("varchar", {
    length: 500,
  })
  concept: string;

  // Fecha de emisión
  @Column("date")
  invoiceDate: string;

  // Fecha de vencimiento
  @Column("date", { nullable: true })
  dueDate: string | null;

  // Método de pago
  @Column("varchar", {
    length: 50,
    nullable: true,
  })
  paymentMethod: string | null;

  // IBAN (opcional)
  @Column("varchar", {
    length: 50,
    nullable: true,
  })
  iban: string | null;

  // Subtotal (base imponible)
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  subtotal: number;

  // Porcentaje de IVA aplicado
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
  })
  ivaPercentage: number;

  // Importe de IVA
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  ivaAmount: number;

  // Porcentaje de IRPF aplicado
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
  })
  irpfPercentage: number;

  // Importe de IRPF
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  irpfAmount: number;

  // Total de la factura
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  total: number;

  // Items de la factura en JSON
  @Column("text", { nullable: true })
  items: string | null;

  // Notas adicionales
  @Column("text", { nullable: true })
  notes: string | null;

  // Nombre del archivo PDF generado
  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  pdfFilename: string | null;

  // Usuario que creó la factura
  @Column({ nullable: true })
  userId: number | null;

  // Canal asociado (si aplica)
  @Column({ nullable: true })
  channelId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.invoices, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "userId" })
  user: User | null;

  @ManyToOne(() => Channel, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "channelId" })
  channel: Channel | null;
}
