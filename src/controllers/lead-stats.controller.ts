import { Request, Response, NextFunction } from "express";
import { LeadStatsService } from "../services/lead-stats.service";

const SUPER_ADMIN_GROUP_ID = 1;

interface AuthenticatedRequest extends Request {
  user?: { userId: number; groupId: number; isManager: boolean };
}

export module LeadStatsController {
  // Estadísticas de gestor de leads: managers / super-admin (PRES-018 B3).
  const canView = (req: AuthenticatedRequest): boolean =>
    !!req.user && (req.user.isManager || req.user.groupId === SUPER_ADMIN_GROUP_ID);

  export const getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!canView(req)) return res.status(403).json({ error: "only-admin-or-manager" });

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
