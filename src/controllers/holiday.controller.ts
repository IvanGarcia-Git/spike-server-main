import { Request, Response, NextFunction } from "express";
import {
  HolidayService,
  CreateHolidayDTO,
  UpdateHolidayDTO,
} from "../services/holiday.service";
import { HolidayScope } from "../enums/holiday-scope.enum";

export namespace HolidayController {
  export const getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const holidays = await HolidayService.getAll();
      res.status(200).json(holidays);
    } catch (err) {
      console.error("Error fetching holidays:", err);
      next(err);
    }
  };

  export const getForCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, groupId } = (req as any).user;
      const holidays = await HolidayService.getHolidaysForUser(userId, groupId);
      res.status(200).json(holidays);
    } catch (err) {
      console.error("Error fetching user holidays:", err);
      next(err);
    }
  };

  export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // RBAC: Only managers can create holidays
    const { isManager } = (req as any).user;
    if (!isManager) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para crear festivos." });
    }

    try {
      const { name, date, scope, userId, groupId } = req.body;

      if (!name || !date) {
        return res
          .status(400)
          .json({ message: "name and date are required." });
      }

      // Validate scope-specific requirements
      if (scope === HolidayScope.User && !userId) {
        return res
          .status(400)
          .json({ message: "userId is required for user-scoped holidays." });
      }
      if (scope === HolidayScope.Group && !groupId) {
        return res
          .status(400)
          .json({ message: "groupId is required for group-scoped holidays." });
      }

      const dto: CreateHolidayDTO = {
        name,
        date,
        scope: scope || HolidayScope.Global,
        userId: scope === HolidayScope.User ? userId : null,
        groupId: scope === HolidayScope.Group ? groupId : null,
      };

      const holiday = await HolidayService.create(dto);
      res.status(201).json(holiday);
    } catch (err) {
      console.error("Error creating holiday:", err);
      next(err);
    }
  };

  export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // RBAC: Only managers can update holidays
    const { isManager } = (req as any).user;
    if (!isManager) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para actualizar festivos." });
    }

    try {
      const { uuid } = req.params;
      const { name, date, scope, userId, groupId } = req.body;

      if (!uuid) {
        return res.status(400).json({ message: "UUID is required." });
      }

      // Validate scope-specific requirements if scope is being changed
      if (scope === HolidayScope.User && !userId) {
        return res
          .status(400)
          .json({ message: "userId is required for user-scoped holidays." });
      }
      if (scope === HolidayScope.Group && !groupId) {
        return res
          .status(400)
          .json({ message: "groupId is required for group-scoped holidays." });
      }

      const dto: UpdateHolidayDTO = {};
      if (name !== undefined) dto.name = name;
      if (date !== undefined) dto.date = date;
      if (scope !== undefined) {
        dto.scope = scope;
        dto.userId = scope === HolidayScope.User ? userId : null;
        dto.groupId = scope === HolidayScope.Group ? groupId : null;
      }

      const holiday = await HolidayService.update(uuid, dto);
      res.status(200).json(holiday);
    } catch (err) {
      if (err.message === "holiday-not-found") {
        return res.status(404).json({ message: "Holiday not found." });
      }
      console.error("Error updating holiday:", err);
      next(err);
    }
  };

  export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // RBAC: Only managers can delete holidays
    const { isManager } = (req as any).user;
    if (!isManager) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para eliminar festivos." });
    }

    try {
      const { uuid } = req.params;

      if (!uuid) {
        return res.status(400).json({ message: "UUID is required." });
      }

      await HolidayService.remove(uuid);
      res.status(204).send();
    } catch (err) {
      if (err.message === "holiday-not-found") {
        return res.status(404).json({ message: "Holiday not found." });
      }
      console.error("Error deleting holiday:", err);
      next(err);
    }
  };
}
