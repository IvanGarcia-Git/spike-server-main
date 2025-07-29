import { dataSource } from "../../app-data-source";
import { CreateHolidayDTO } from "../controllers/holiday.controller";
import { Holiday } from "../models/holiday.entity";

export namespace HolidayService {
  export const getAll = async (): Promise<Holiday[]> => {
    return dataSource.getRepository(Holiday).find({ order: { date: "ASC" } });
  };

  export const create = async (dto: CreateHolidayDTO): Promise<Holiday> => {
    const holiday = dataSource.getRepository(Holiday).create(dto);
    return dataSource.getRepository(Holiday).save(holiday);
  };
}
