import { Request, Response, NextFunction } from "express";
import { LeadImportService } from "../services/lead-import.service";
import { LeadImportConfirmRequestDTO } from "../dto/lead-import.dto";
import { dataSource } from "../../app-data-source";
import { Campaign } from "../models/campaign.entity";

const SUPER_ADMIN_GROUP_ID = 1;

// Extender el tipo Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    groupId: number;
    isManager: boolean;
  };
}

export module LeadImportController {
  /**
   * Verifica que el usuario es Admin o Manager para importar leads
   */
  const canImportLeads = (req: AuthenticatedRequest): boolean => {
    if (!req.user) return false;
    return req.user.groupId === SUPER_ADMIN_GROUP_ID || req.user.isManager;
  };

  export const preview = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Solo Admin o Manager pueden importar leads
      if (!canImportLeads(req)) {
        return res.status(403).json({ error: "only-admin-or-manager-can-import-leads" });
      }

      const file = req.file;

      if (!file) {
        res.status(400);
        throw new Error("Debe seleccionar un archivo Excel (.xlsx)");
      }

      const previewResponse = await LeadImportService.processPreview(file);
      res.json(previewResponse);
    } catch (error) {
      next(error);
    }
  };

  export const confirm = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Solo Admin o Manager pueden importar leads
      if (!canImportLeads(req)) {
        return res.status(403).json({ error: "only-admin-or-manager-can-import-leads" });
      }

      const { sessionId, rowsToImport }: LeadImportConfirmRequestDTO = req.body;

      if (!sessionId) {
        res.status(400);
        throw new Error("Se requiere el ID de sesión");
      }

      if (!rowsToImport || !Array.isArray(rowsToImport) || rowsToImport.length === 0) {
        res.status(400);
        throw new Error("Debe seleccionar al menos una fila para importar");
      }

      const confirmResponse = await LeadImportService.confirmImport(
        sessionId,
        rowsToImport
      );

      res.json(confirmResponse);
    } catch (error) {
      next(error);
    }
  };

  export const downloadTemplate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const templateBuffer = LeadImportService.generateTemplate();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=plantilla_leads.xlsx"
      );

      res.send(templateBuffer);
    } catch (error) {
      next(error);
    }
  };

  // ========== Campaign-specific import endpoints ==========

  export const previewForCampaign = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Solo Admin o Manager pueden importar leads
      if (!canImportLeads(req)) {
        return res.status(403).json({ error: "only-admin-or-manager-can-import-leads" });
      }

      const { campaignUuid } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400);
        throw new Error("Debe seleccionar un archivo Excel (.xlsx)");
      }

      // Get campaign by UUID
      const campaignRepository = dataSource.getRepository(Campaign);
      const campaign = await campaignRepository.findOne({
        where: { uuid: campaignUuid },
      });

      if (!campaign) {
        res.status(404);
        throw new Error("Campaña no encontrada");
      }

      const previewResponse = await LeadImportService.processPreviewForCampaign(file, campaign.name);
      res.json(previewResponse);
    } catch (error) {
      next(error);
    }
  };

  export const confirmForCampaign = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Solo Admin o Manager pueden importar leads
      if (!canImportLeads(req)) {
        return res.status(403).json({ error: "only-admin-or-manager-can-import-leads" });
      }

      const { campaignUuid } = req.params;
      const { sessionId, rowsToImport }: LeadImportConfirmRequestDTO = req.body;

      // Verify campaign exists
      const campaignRepository = dataSource.getRepository(Campaign);
      const campaign = await campaignRepository.findOne({
        where: { uuid: campaignUuid },
      });

      if (!campaign) {
        res.status(404);
        throw new Error("Campaña no encontrada");
      }

      if (!sessionId) {
        res.status(400);
        throw new Error("Se requiere el ID de sesión");
      }

      if (!rowsToImport || !Array.isArray(rowsToImport) || rowsToImport.length === 0) {
        res.status(400);
        throw new Error("Debe seleccionar al menos una fila para importar");
      }

      const confirmResponse = await LeadImportService.confirmImport(
        sessionId,
        rowsToImport
      );

      res.json(confirmResponse);
    } catch (error) {
      next(error);
    }
  };

  export const downloadTemplateForCampaign = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { campaignUuid } = req.params;

      // Get campaign by UUID
      const campaignRepository = dataSource.getRepository(Campaign);
      const campaign = await campaignRepository.findOne({
        where: { uuid: campaignUuid },
      });

      if (!campaign) {
        res.status(404);
        throw new Error("Campaña no encontrada");
      }

      const templateBuffer = LeadImportService.generateTemplateForCampaign(campaign.name);

      // Sanitize campaign name for filename
      const sanitizedName = campaign.name.replace(/[^a-zA-Z0-9]/g, "_");

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=plantilla_leads_${sanitizedName}.xlsx`
      );

      res.send(templateBuffer);
    } catch (error) {
      next(error);
    }
  };
}
