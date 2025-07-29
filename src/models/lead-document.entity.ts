// src/entities/lead-document.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Lead } from "./lead.entity";

@Entity()
export class LeadDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column("uuid")
  @Generated("uuid")
  uuid: string;

  @Column()
  leadId: number;

  @Column("varchar", { length: 255 })
  documentUri: string;

  @Column("varchar", { length: 255 })
  originalName: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Lead, (lead) => lead.documents, {
    onDelete: "CASCADE", // Si se borra el lead, se borran sus documentos.
  })
  @JoinColumn({ name: "leadId" })
  lead: Lead;
}
