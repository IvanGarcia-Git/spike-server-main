import { ContractLog } from "../models/contract-log.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";

export module ContractLogsService {
  export const create = async (
    contractData: Partial<ContractLog>
  ): Promise<ContractLog> => {
    try {
      const contractLogRepository = dataSource.getRepository(ContractLog);

      const newContractLog = contractLogRepository.create(contractData);
      return await contractLogRepository.save(newContractLog);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<ContractLog>,
    relations: FindOptionsRelations<ContractLog> = {}
  ): Promise<ContractLog[]> => {
    try {
      const contractLogRepository = dataSource.getRepository(ContractLog);

      return await contractLogRepository.find({
        where,
        relations,
        order: { id: "DESC" },
      });
    } catch (error) {
      throw error;
    }
  };
}
