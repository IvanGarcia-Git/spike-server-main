import { LiquidationStatus, LiquidationType } from "../models/liquidation.entity";

export interface CreateLiquidationDTO {
  name: string;
  date: string; // Expected format: YYYY-MM-DD
  userId?: number | null; // Ahora opcional
  status?: LiquidationStatus;
  type: LiquidationType; // Obligatorio: INGRESO o GASTO
  amount?: number | null; // Monto manual opcional
}

export interface UpdateLiquidationDTO {
  name?: string;
  status?: LiquidationStatus;
  date?: string;
  type?: LiquidationType;
  amount?: number | null;
}
