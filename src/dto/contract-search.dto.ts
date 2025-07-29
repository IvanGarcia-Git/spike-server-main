import { ContractType } from "../models/contract.entity";
import { CustomerType } from "../models/customer.entity";
import { RateTypes } from "../models/rate.entity";

export interface ContractSearchDTO {
  channelId?: number;
  companyIds?: number[];
  rateId?: number;
  contractPowerFrom?: number;
  contractPowerTo?: number;
  contractStateIds?: number[];
  includeDrafts?: boolean;
  contractUserIds?: number[];
  payed?: boolean;
  type?: ContractType;
  solarPlates?: boolean;
  product?: string;
  from?: Date;
  to?: Date;
  order?: "updatedAt" | "createdAt";
  customerType?: CustomerType;
  customerProvince?: string;
  customerIds: number[];
  rateType?: RateTypes;
}
