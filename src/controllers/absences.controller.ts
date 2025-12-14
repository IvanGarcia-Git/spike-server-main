import { NextFunction, Request, Response } from "express";
import { AbsencesService } from "../services/absences.service";
import { Absence } from "../models/absence.entity";
import { AbsenceType } from "../enums/absence-type.enum";
import { AbsenceStatus } from "../enums/absence-status.enum";

interface CreateAbsenceRequestBody {
  userId: number;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  description?: string;
  status?: AbsenceStatus;
}

interface UpdateAbsenceRequestBody {
  startDate?: string;
  endDate?: string;
  type?: AbsenceType;
  description?: string;
  status?: AbsenceStatus;
}

export module AbsencesController {
  export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const {
      userId,
      startDate,
      endDate,
      type,
      description,
    }: CreateAbsenceRequestBody = req.body;

    if (!userId || !startDate || !endDate || !type) {
      return res
        .status(400)
        .json({
          message: "userId, startDate, endDate, and type are required.",
        });
    }

    try {
      const newAbsence = await AbsencesService.create({
        userId,
        startDate,
        endDate,
        type,
        description,
        status: AbsenceStatus.Pendiente,
      });
      res.status(201).json(newAbsence);
    } catch (error) {
      if (error.message && error.message.includes("foreign key constraint")) {
        return res
          .status(400)
          .json({ message: `User with ID ${userId} not found.` });
      }
      console.error("Error creating absence:", error);
      next(error);
    }
  };

  export const getAllByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.params.userId;
    if (!userId || isNaN(Number(userId))) {
      return res
        .status(400)
        .json({ message: "Valid numeric userId parameter is required." });
    }

    try {
      const absences = await AbsencesService.getManyByUserId(Number(userId));
      res.status(200).json(absences);
    } catch (error) {
      console.error("Error fetching absences by user ID:", error);
      next(error);
    }
  };

  export const getAllByUserIds = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "userIds array is required and must not be empty." });
    }

    const validUserIds = userIds.filter((id) => typeof id === "number" && !isNaN(id));
    if (validUserIds.length === 0) {
      return res
        .status(400)
        .json({ message: "userIds must contain valid numeric values." });
    }

    try {
      const absences = await AbsencesService.getManyByUserIds(validUserIds);
      res.status(200).json(absences);
    } catch (error) {
      console.error("Error fetching absences by user IDs:", error);
      next(error);
    }
  };

  export const updateAbsence = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const uuid = req.params.uuid;
    const dataToUpdate: UpdateAbsenceRequestBody = req.body;

    if (!uuid) return res.status(400).json({ message: "UUID is required." });
    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: "No data provided for update." });
    }

    try {
      const updatedAbsence = await AbsencesService.update(uuid, dataToUpdate);
      res.status(200).json(updatedAbsence);
    } catch (error) {
      if (error.message === "absence-not-found") {
        return res.status(404).json({ message: "Absence not found." });
      }
      console.error("Error updating absence:", error);
      next(error);
    }
  };

  export const deleteAbsence = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const uuid = req.params.uuid;
    if (!uuid) return res.status(400).json({ message: "UUID is required." });

    try {
      await AbsencesService.remove(uuid);
      res.status(204).send();
    } catch (error) {
      if (error.message === "absence-not-found") {
        return res.status(404).json({ message: "Absence not found." });
      }
      console.error("Error deleting absence:", error);
      next(error);
    }
  };
}
