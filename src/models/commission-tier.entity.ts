import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Rate } from "./rate.entity";

@Entity("commission_tier")
export class CommissionTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  rateId: number;

  @ManyToOne(() => Rate, (rate) => rate.commissionTiers, {
    onDelete: "CASCADE"
  })
  rate: Rate;

  @Column("float")
  minConsumo: number;

  @Column("float", { nullable: true })
  maxConsumo: number | null;

  @Column("float")
  comision: number;

  @Column("boolean", { default: false })
  appliesToRenewal: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
