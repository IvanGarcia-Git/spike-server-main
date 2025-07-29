import { ContractHistory } from "../models/contract-history.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";

export module ContractHistoryService {
  export const create = async (
    contractHistoryData: Partial<ContractHistory>
  ): Promise<ContractHistory> => {
    try {
      const contractHistoryRepository =
        dataSource.getRepository(ContractHistory);

      const newContractHistory =
        contractHistoryRepository.create(contractHistoryData);
      return await contractHistoryRepository.save(newContractHistory);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<ContractHistory>,
    relations: FindOptionsRelations<ContractHistory> = {}
  ): Promise<ContractHistory[]> => {
    try {
      const contractHistoryRepository =
        dataSource.getRepository(ContractHistory);

      return await contractHistoryRepository.find({
        where,
        relations,
        order: { id: "DESC" },
      });
    } catch (error) {
      throw error;
    }
  };
}
