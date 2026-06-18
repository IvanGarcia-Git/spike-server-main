import { Request, Response, NextFunction } from "express";
import { LeadStatsService } from "../services/lead-stats.service";

interface AuthenticatedRequest extends Request {
  user?: { userId: number; groupId: number; isManager: boolean };
}

export module LeadStatsController {
  // PRES-018 B3 — pestaña del dashboard. Acceso para cualquier usuario autenticado,
  // igual que el resto de endpoints /dashboard/* (la ruta ya exige JWT).
  export const getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const start = req.query.startDate ? new Date(String(req.query.startDate)) : defaultStart;
      const end = req.query.endDate ? new Date(String(req.query.endDate)) : now;
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "invalid-date-range" });
      }

      res.json(await LeadStatsService.getLeadStats(start, end));
    } catch (error) {
      next(error);
    }
  };
}
