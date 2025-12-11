import { Request, Response, NextFunction } from "express";
import { LeadImportService } from "../services/lead-import.service";
import { LeadImportConfirmRequestDTO } from "../dto/lead-import.dto";

export module LeadImportController {
  export const preview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
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
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
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
    req: Request,
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
}
