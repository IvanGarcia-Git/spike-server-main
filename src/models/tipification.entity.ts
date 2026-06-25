import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { LeadTipificationHistory } from "./lead.entity";

export enum TipificationCategory {
  CONTACTO = "contacto",
  NO_CONTACTO = "no_contacto",
  DESCARTE = "descarte",
}

export enum TipificationAction {
  CERRAR = "cerrar",
  REINTENTO = "reintento",
  CALLBACK = "callback",
  VENTAS = "ventas",
  SEGUIMIENTO = "seguimiento",
  AGENDA = "agenda",
}

@Entity()
export class Tipification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 100 })
  name: string;

  @Column("varchar", {
    length: 50,
    comment: "categoria: contacto/no_contacto/descarte",
  })
  category: TipificationCategory;

  @Column("varchar", {
    length: 50,
    comment: "accion_sistema: cerrar/reintento/callback/ventas/seguimiento",
  })
  action: TipificationAction;

  @Column({
    type: "int",
    nullable: true,
    comment: "Horas de espera para reintento (null si no aplica)",
  })
  retryHours?: number;

  @Column({
    type: "boolean",
    default: false,
  })
  requiresWhatsapp: boolean;

  @Column({
    type: "boolean",
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => LeadTipificationHistory, (history) => history.tipification)
  history: LeadTipificationHistory[];
}
