import { dataSource } from "../../app-data-source";
import { Holiday } from "../models/holiday.entity";
import { HolidayScope } from "../enums/holiday-scope.enum";
import { FindOptionsWhere, In, IsNull, Or } from "typeorm";

export interface CreateHolidayDTO {
  name: string;
  date: string;
  scope?: HolidayScope;
  userId?: number | null;
  groupId?: number | null;
}

export interface UpdateHolidayDTO {
  name?: string;
  date?: string;
  scope?: HolidayScope;
  userId?: number | null;
  groupId?: number | null;
}

export namespace HolidayService {
  const repo = () => dataSource.getRepository(Holiday);

  export const getAll = async (): Promise<Holiday[]> => {
    return repo().find({
      order: { date: "ASC" },
      relations: ["user", "group"],
    });
  };

  export const getByUuid = async (uuid: string): Promise<Holiday | null> => {
    return repo().findOne({
      where: { uuid },
      relations: ["user", "group"],
    });
  };

  export const getHolidaysForUser = async (
    userId: number,
    groupId: number | null
  ): Promise<Holiday[]> => {
    const whereConditions: FindOptionsWhere<Holiday>[] = [
      { scope: HolidayScope.Global },
      { scope: HolidayScope.User, userId },
    ];

    if (groupId) {
      whereConditions.push({ scope: HolidayScope.Group, groupId });
    }

    return repo().find({
      where: whereConditions,
      order: { date: "ASC" },
      relations: ["user", "group"],
    });
  };

  export const create = async (dto: CreateHolidayDTO): Promise<Holiday> => {
    const holiday = repo().create({
      ...dto,
      scope: dto.scope || HolidayScope.Global,
    });
    return repo().save(holiday);
  };

  export const update = async (
    uuid: string,
    dto: UpdateHolidayDTO
  ): Promise<Holiday> => {
    const holiday = await getByUuid(uuid);
    if (!holiday) {
      throw new Error("holiday-not-found");
    }

    Object.assign(holiday, dto);
    return repo().save(holiday);
  };

  export const remove = async (uuid: string): Promise<boolean> => {
    const holiday = await getByUuid(uuid);
    if (!holiday) {
      throw new Error("holiday-not-found");
    }

    await repo().remove(holiday);
    return true;
  };
}
