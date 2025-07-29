import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere, In } from "typeorm";
import { TelephonyData } from "../models/telephony-data.entity";

export module TelephonyDataService {
  export const create = async (telephonyData: Partial<TelephonyData>): Promise<number> => {
    try {
      const telephonyRepository = dataSource.getRepository(TelephonyData);

      const { id: createdId } = await telephonyRepository.save(
        telephonyRepository.create(telephonyData)
      );

      return createdId;
    } catch (error) {
      throw error;
    }
  };
}
