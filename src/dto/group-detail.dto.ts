import { Group } from "../models/group.entity";

export interface GroupStats {
  porContactar: number;
  porContactarPercent: number;
  venta: number;
  ventaPercent: number;
  agendado: number;
  agendadoPercent: number;
  ilocalizable: number;
  ilocalizablePercent: number;
  noInteresa: number;
  noInteresaPercent: number;
  contactedPercent: number;
  leadsCount: number;
  contactedLeadsCount: number;
}
export interface GroupDetailDTO {
  stats: GroupStats;
  usersCount: number;
  group: Group;
}
