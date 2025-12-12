import { LeadSheetsService } from "../services/lead-sheets.service";
import {
  LeadAuthorizationService,
  LeadAction,
} from "../services/lead-authorization.service";

export module LeadSheetsController {
  export const create = async (req, res, next) => {
    try {
      const leadSheetData = req.body;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Verificar permisos sobre el lead asociado
      if (leadSheetData.leadId) {
        const authResult = await LeadAuthorizationService.canPerformAction(
          userContext,
          leadSheetData.leadId,
          LeadAction.EDIT
        );

        if (!authResult.allowed) {
          return res.status(403).json({ error: authResult.reason || "unauthorized" });
        }
      }

      const newLeadSheet = await LeadSheetsService.create(leadSheetData);

      res.status(201).json(newLeadSheet);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      const leadSheet = await LeadSheetsService.getOne({ uuid }, { lead: true });

      if (!leadSheet) {
        return res.status(404).json({ error: "lead-sheet-not-found" });
      }

      // Verificar permisos sobre el lead asociado
      if (leadSheet.leadId) {
        const authResult = await LeadAuthorizationService.canPerformAction(
          userContext,
          leadSheet.leadId,
          LeadAction.VIEW
        );

        if (!authResult.allowed) {
          return res.status(403).json({ error: authResult.reason || "unauthorized" });
        }
      }

      res.json(leadSheet);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const leadSheetData = req.body;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Obtener el lead sheet para verificar permisos
      const existingLeadSheet = await LeadSheetsService.getOne({ uuid });

      if (!existingLeadSheet) {
        return res.status(404).json({ error: "lead-sheet-not-found" });
      }

      // Verificar permisos sobre el lead asociado
      if (existingLeadSheet.leadId) {
        const authResult = await LeadAuthorizationService.canPerformAction(
          userContext,
          existingLeadSheet.leadId,
          LeadAction.EDIT
        );

        if (!authResult.allowed) {
          return res.status(403).json({ error: authResult.reason || "unauthorized" });
        }
      }

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
