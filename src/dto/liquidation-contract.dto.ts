export interface CreateLiquidationContractDTO {
  liquidationUuid: string;
  contractUuids: string[];
  overrideCommission?: number | null;
}

export interface UpdateLiquidationContractDTO {
  overrideCommission?: number | null;
}