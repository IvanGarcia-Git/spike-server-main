import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Lead } from "./lead.entity";

export enum CustomerType {
  B2C = "B2C",
  B2B = "B2B",
}

@Entity()
export class LeadSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 100 })
  name: string;

  @Column("varchar", { length: 100 })
  surnames: string;

  @Column("varchar", { length: 20 })
  nationalId: string;

  @Column("varchar", { length: 100 })
  email: string;

  @Column("varchar", { length: 255 })
  address: string;

  @Column("varchar", { length: 20 })
  zipCode: string;

  @Column("varchar", { length: 100 })
  province: string;

  @Column("varchar", { length: 100 })
  populace: string;

  @Column("varchar", { length: 15 })
  phoneNumber: string;

  @Column("varchar", { length: 40 })
  iban: string;

  @Column("boolean", { default: false })
  holderChange: boolean;

  @Column("boolean", { default: false })
  newCreation: boolean;

  @Column({
    type: "enum",
    enum: CustomerType,
  })
  type: CustomerType;

  @Column("varchar", { length: 20, nullable: true })
  cif?: string;

  @Column("varchar", { length: 100, nullable: true })
  tradeName?: string;

  @Column({ nullable: true })
  leadId?: number;

  @OneToOne(() => Lead, { onDelete: "CASCADE" })
  @JoinColumn({ name: "leadId" })
  lead: Lead;
}
