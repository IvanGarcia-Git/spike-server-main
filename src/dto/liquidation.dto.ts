import { LiquidationStatus } from "../models/liquidation.entity";

export interface CreateLiquidationDTO {
  name: string;
  date: string; // Expected format: YYYY-MM-DD
  userId: number;
  status?: LiquidationStatus;
}

export interface UpdateLiquidationDTO {
  name?: string;
  status?: LiquidationStatus;
  date?: string;
}
