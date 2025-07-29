import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { dataSource } from "../../app-data-source";
import { LeadLog } from "../models/lead-log.entity";

export module LeadLogsService {
  export const create = async (
    leadLogData: Partial<LeadLog>
  ): Promise<LeadLog> => {
    try {
      const leadLogRepository = dataSource.getRepository(LeadLog);

      const newLeadLog = leadLogRepository.create(leadLogData);
      return await leadLogRepository.save(newLeadLog);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<LeadLog>,
    relations: FindOptionsRelations<LeadLog> = {}
  ): Promise<LeadLog[]> => {
    try {
      const leadLogRepository = dataSource.getRepository(LeadLog);

      return await leadLogRepository.find({
        where,
        relations,
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw error;
    }
  };
}
