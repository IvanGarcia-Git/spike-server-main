import { Request, Response, NextFunction } from "express";
import { LeadAssignmentRulesService } from "../services/lead-assignment-rules.service";

const SUPER_ADMIN_GROUP_ID = 1;

interface AuthenticatedRequest extends Request {
  user?: { userId: number; groupId: number; isManager: boolean };
}

export module LeadAssignmentRulesController {
  // Solo managers / super-admin gestionan las reglas (PRES-018 B2a).
  const canManage = (req: AuthenticatedRequest): boolean =>
    !!req.user && (req.user.isManager || req.user.groupId === SUPER_ADMIN_GROUP_ID);

  export const list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!canManage(req)) return res.status(403).json({ error: "only-admin-or-manager" });
      res.json(await LeadAssignmentRulesService.findAll());
    } catch (error) {
      next(error);
    }
  };

  export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!canManage(req)) return res.status(403).json({ error: "only-admin-or-manager" });
      if (!req.body?.name) return res.status(400).json({ error: "name-required" });
      res.status(201).json(await LeadAssignmentRulesService.create(req.body));
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!canManage(req)) return res.status(403).json({ error: "only-admin-or-manager" });
      res.json(await LeadAssignmentRulesService.update(req.params.uuid, req.body));
    } catch (error: any) {
      if (error.message === "LeadAssignmentRule not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };

  // Acción puntual: deriva la zona de los leads existentes desde el CP de su ficha.
  export const backfillZonas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!canManage(req)) return res.status(403).json({ error: "only-admin-or-manager" });
      res.json(await LeadAssignmentRulesService.backfillZonas());
    } catch (error) {
      next(error);
    }
  };

  export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!canManage(req)) return res.status(403).json({ error: "only-admin-or-manager" });
      res.json(await LeadAssignmentRulesService.remove(req.params.uuid));
    } catch (error: any) {
      if (error.message === "LeadAssignmentRule not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };
}
