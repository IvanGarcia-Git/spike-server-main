import { LeadSheetsService } from "../services/lead-sheets.service";

export module LeadSheetsController {
  export const create = async (req, res, next) => {
    try {
      const leadSheetData = req.body;

      const newLeadSheet = await LeadSheetsService.create(leadSheetData);

      res.status(201).json(newLeadSheet);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const leadSheet = await LeadSheetsService.getOne({ uuid });

      res.json(leadSheet);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const leadSheetData = req.body;

      const updatedLeadSheet = await LeadSheetsService.update(
        uuid,
        leadSheetData
      );

      res.json(updatedLeadSheet);
    } catch (error) {
      next(error);
    }
  };
}
