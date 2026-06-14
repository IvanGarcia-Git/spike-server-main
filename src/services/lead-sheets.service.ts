import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { LeadSheet } from "../models/lead-sheet.entity";
import { Lead } from "../models/lead.entity";
import { zonaFromPostalCode } from "../helpers/spanish-provinces.helper";

export module LeadSheetsService {
  // PRES-018 B2a — mantiene la zona del lead derivada del CP de su ficha.
  const syncLeadZona = async (leadSheet: LeadSheet): Promise<void> => {
    if (!leadSheet?.leadId) return;
    const zona = zonaFromPostalCode(leadSheet.zipCode);
    if (!zona) return;
    const leadRepository = dataSource.getRepository(Lead);
    await leadRepository.update({ id: leadSheet.leadId }, { zona });
  };

  export const create = async (
    leadSheetData: Partial<LeadSheet>
  ): Promise<LeadSheet> => {
    try {
      const leadSheetRepository = dataSource.getRepository(LeadSheet);

      const leadSheet = leadSheetRepository.create(leadSheetData);

      const saved = await leadSheetRepository.save(leadSheet);
      await syncLeadZona(saved);
      return saved;
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
      const saved = await leadSheetRepository.save(leadSheetToUpdate);
      await syncLeadZona(saved);
      return saved;
    } catch (error) {
      throw error;
    }
  };
}
