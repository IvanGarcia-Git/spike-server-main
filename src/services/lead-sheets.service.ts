import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { LeadSheet } from "../models/lead-sheet.entity";

export module LeadSheetsService {
  export const create = async (
    leadSheetData: Partial<LeadSheet>
  ): Promise<LeadSheet> => {
    try {
      const leadSheetRepository = dataSource.getRepository(LeadSheet);

      const leadSheet = leadSheetRepository.create(leadSheetData);

      return await leadSheetRepository.save(leadSheet);
    } catch (error) {
      throw error;
    }
  };

  export const getOne = async (
    where: FindOptionsWhere<LeadSheet>,
    relations: FindOptionsRelations<LeadSheet> = {}
  ): Promise<LeadSheet | null> => {
    try {
      const leadSheetRepository = dataSource.getRepository(LeadSheet);

      return await leadSheetRepository.findOne({ where, relations });
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    uuid: string,
    leadSheetData: Partial<LeadSheet>
  ): Promise<LeadSheet> => {
    try {
      const leadSheetRepository = dataSource.getRepository(LeadSheet);
      const leadSheetToUpdate = await leadSheetRepository.findOne({
        where: { uuid },
      });

      if (!leadSheetToUpdate) {
        throw new Error("Lead Sheet not found");
      }

      Object.assign(leadSheetToUpdate, leadSheetData);
      return await leadSheetRepository.save(leadSheetToUpdate);
    } catch (error) {
      throw error;
    }
  };
}
