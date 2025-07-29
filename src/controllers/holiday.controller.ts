import { Request, Response, NextFunction } from "express";
import { HolidayService } from "../services/holiday.service";

export interface CreateHolidayDTO {
  name: string;
  date: string;
}

export namespace HolidayController {
  export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const holidays = await HolidayService.getAll();
      res.status(200).json(holidays);
    } catch (err) {
      console.error("Error fetching holidays:", err);
      next(err);
    }
  };

  export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CreateHolidayDTO = req.body;

      const holiday = await HolidayService.create(dto);
      res.status(201).json(holiday);
    } catch (err) {
      console.error("Error creating holiday:", err);
      next(err);
    }
  };
}
