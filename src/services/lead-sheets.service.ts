import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { LeadSheet } from "../models/lead-sheet.entity";
import { Lead } from "../models/lead.entity";
import { zonaFromPostalCode } from "../helpers/spanish-provinces.helper";
import { LeadAssignmentRulesService } from "./lead-assignment-rules.service";

export module LeadSheetsService {
  // PRES-018 B2a — mantiene la zona del lead derivada del CP de su ficha.
  // Devuelve true si se derivó (y guardó) una zona.
  const syncLeadZona = async (leadSheet: LeadSheet): Promise<boolean> => {
    if (!leadSheet?.leadId) return false;
    const zona = zonaFromPostalCode(leadSheet.zipCode);
    if (!zona) return false;
    const leadRepository = dataSource.getRepository(Lead);
    await leadRepository.update({ id: leadSheet.leadId }, { zona });
    return true;
  };

  export const create = async (
    leadSheetData: Partial<LeadSheet>
  ): Promise<LeadSheet> => {
    try {
      const leadSheetRepository = dataSource.getRepository(LeadSheet);

      const leadSheet = leadSheetRepository.create(leadSheetData);

      const saved = await leadSheetRepository.save(leadSheet);
      const zonaSet = await syncLeadZona(saved);
      // Ahora que conocemos la zona, intentamos asignar por reglas (zona/sector/…).
      // applyToLead es idempotente y no toca leads ya encolados o en curso.
      if (zonaSet && saved.leadId) {
        await LeadAssignmentRulesService.applyToLead(saved.leadId);
      }
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
      const zonaSet = await syncLeadZona(saved);
      // Misma lógica que en create: si ahora conocemos la zona, intentamos asignar
      // por reglas (idempotente; no toca leads ya encolados o en curso).
      if (zonaSet && saved.leadId) {
        await LeadAssignmentRulesService.applyToLead(saved.leadId);
      }
      return saved;
    } catch (error) {
      throw error;
    }
  };
}
