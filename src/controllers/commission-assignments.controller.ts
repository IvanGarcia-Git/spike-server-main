import { Request, Response, NextFunction } from "express";
import { CommissionAssignmentsService } from "../services/commission-assignments.service";

export module CommissionAssignmentsController {
  // GET /commission-assignments?channelId=…
  export const listByChannel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const channelId = Number(req.query.channelId);
      if (!channelId) {
        return res.status(400).json({ message: "channelId is required" });
      }
      const assignments = await CommissionAssignmentsService.listByChannel(
        channelId
      );
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  };

  // PATCH /commission-assignments
  // { channelId, rateId, userId, amount }
  export const upsert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { channelId, rateId, userId, amount } = req.body;
      if (
        [channelId, rateId, userId, amount].some((v) => v === undefined)
      ) {
        return res
          .status(400)
          .json({ message: "channelId, rateId, userId and amount are required" });
      }

      const result = await CommissionAssignmentsService.upsert({
        channelId: Number(channelId),
        rateId: Number(rateId),
        userId: Number(userId),
        amount: Number(amount),
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
