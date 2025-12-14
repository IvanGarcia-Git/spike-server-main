import { dataSource } from "../../app-data-source";
import { Absence } from "../models/absence.entity";
import {
  FindOptionsWhere,
  FindOptionsRelations,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
  IsNull,
  In,
} from "typeorm";
import { NotificationsService } from "./notifications.service";
import { EventType } from "../models/notification.entity";
import { NotificationContents } from "../enums/notification-contents.enum";
import { NotificationPreference, User } from "../models/user.entity";

export module AbsencesService {
  export const create = async (
    dto: Omit<Absence, "id" | "uuid" | "createdAt" | "updatedAt" | "user">
  ): Promise<Absence> => {
    const absenceRepo = dataSource.getRepository(Absence);
    const userRepo = dataSource.getRepository(User);

    const newAbsence = absenceRepo.create(dto);
    const savedAbsence = await absenceRepo.save(newAbsence);

    const applicant = await userRepo.findOne({
      where: { id: dto.userId },
      select: ["id", "name", "firstSurname"],
    });

    if (!applicant) throw new Error("Usuario solicitante no encontrado");

    const applicantFullName = `${applicant.name} ${applicant.firstSurname}`;

    const admins = await userRepo.find({
      where: { parentGroupId: IsNull() },
      select: ["id"],
    });

    await Promise.all(
      admins.map((admin) =>
        NotificationsService.create(
          {
            eventType: EventType.OTHER,
            subject: NotificationContents.VacationRequest(applicantFullName),
            content: NotificationContents.VacationRequest(applicantFullName),
            userId: admin.id,
            startDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          },
          NotificationPreference.VACATION_REQUEST
        )
      )
    );

    return savedAbsence;
  };

  export const getManyByUserId = async (
    userId: number,
    relations: FindOptionsRelations<Absence> = {}
  ): Promise<Absence[]> => {
    const records = await getManyBy({ userId }, relations);
    return records.sort((a, b) => a.startDate.localeCompare(b.startDate));
  };

  export const getManyByUserIds = async (
    userIds: number[],
    relations: FindOptionsRelations<Absence> = {}
  ): Promise<Absence[]> => {
    const records = await getManyBy({ userId: In(userIds) }, { ...relations, user: true });
    return records.sort((a, b) => a.startDate.localeCompare(b.startDate));
  };

  export const getManyBy = async (
    where: FindOptionsWhere<Absence>,
    relations: FindOptionsRelations<Absence> = {}
  ): Promise<Absence[]> => {
    const repo = dataSource.getRepository(Absence);
    return repo.find({ where, relations });
  };

  export const getOneBy = async (
    where: FindOptionsWhere<Absence>,
    relations: FindOptionsRelations<Absence> = {}
  ): Promise<Absence | null> => {
    const repo = dataSource.getRepository(Absence);
    return repo.findOne({ where, relations });
  };

  export const update = async (
    uuid: string,
    data: Partial<Omit<Absence, "id" | "uuid" | "createdAt" | "updatedAt" | "user" | "userId">>
  ): Promise<Absence> => {
    const absence = await getOneBy({ uuid });
    if (!absence) throw new Error("absence-not-found");
    Object.assign(absence, data);
    return await dataSource.getRepository(Absence).save(absence);
  };

  export const remove = async (uuid: string): Promise<boolean> => {
    const absence = await getOneBy({ uuid });
    if (!absence) throw new Error("absence-not-found");
    await dataSource.getRepository(Absence).remove(absence);
    return true;
  };

  export const getAbsencesInYearForUser = async (
    userId: number,
    year: number,
    relations: FindOptionsRelations<Absence> = {}
  ): Promise<Absence[]> => {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    return dataSource.getRepository(Absence).find({
      where: [
        {
          userId,
          startDate: Between(yearStart, yearEnd),
        },
        {
          userId,
          endDate: Between(yearStart, yearEnd),
        },
        {
          userId,
          startDate: LessThanOrEqual(yearStart),
          endDate: MoreThanOrEqual(yearEnd),
        },
      ],
      relations,
      order: {
        startDate: "ASC",
      },
    });
  };
}
