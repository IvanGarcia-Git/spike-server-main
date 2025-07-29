import { AwsHelper } from "../helpers/aws.helper";
import { dataSource } from "../../app-data-source";
import { Reminder } from "../models/reminder.entity";
import { Between, FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { NotificationContents } from "../enums/notfication-contents.enum";
import { NotificationsService } from "./notifications.service";
import { EventType } from "../models/notification.entity";
import { NotificationPreference } from "../models/user.entity";

export module RemindersService {
  export const create = async (
    reminderData: Partial<Reminder>,
    documentFile?: Express.Multer.File
  ): Promise<Reminder> => {
    try {
      const reminderRepository = dataSource.getRepository(Reminder);

      if (documentFile) {
        reminderData.documentUri =
          await AwsHelper.uploadGenericCommentDocumentToS3(
            "reminders",
            documentFile
          );
      }

      const newReminder = reminderRepository.create(reminderData);

      await NotificationsService.create(
        {
          sourceUrl: newReminder?.contractUrl,
          eventType: EventType.REMINDER,
          content: NotificationContents.ReminderPending(reminderData.subject),
          userId: reminderData.userId,
          startDate: reminderData.startDate,
        },
        NotificationPreference.REMINDER
      );

      return await reminderRepository.save(newReminder);
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<Reminder>
  ): Promise<Reminder> => {
    try {
      const reminderRepository = dataSource.getRepository(Reminder);

      return await reminderRepository.findOneBy(where);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<Reminder>,
    relations: FindOptionsRelations<Reminder> = {}
  ): Promise<Reminder[]> => {
    try {
      const reminderRepository = dataSource.getRepository(Reminder);

      return await reminderRepository.find({
        where,
        relations,
      });
    } catch (error) {
      throw error;
    }
  };

  export const getManyByDate = async (
    date: Date,
    where: FindOptionsWhere<Reminder>,
    relations: FindOptionsRelations<Reminder> = {}
  ): Promise<Reminder[]> => {
    try {
      const reminderRepository = dataSource.getRepository(Reminder);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dateCondition: FindOptionsWhere<Reminder> = {
        ...where,
        startDate: Between(startOfDay, endOfDay),
      };

      const remindersFound = await reminderRepository.find({
        where: dateCondition,
        relations,
      });

      for (const reminderFound of remindersFound) {
        if (reminderFound?.documentUri) {
          reminderFound.documentUri = AwsHelper.getPresignedUrl(
            reminderFound.documentUri
          );
        }
      }

      return remindersFound;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    uuid: string,
    completed: boolean
  ): Promise<Reminder> => {
    try {
      const reminderRepository = dataSource.getRepository(Reminder);
      const reminderToUpdate = await reminderRepository.findOne({
        where: { uuid },
      });

      if (!reminderToUpdate) {
        throw new Error("Reminder not found");
      }
      return await reminderRepository.save({
        ...reminderToUpdate,
        completed,
      });
    } catch (error) {
      throw error;
    }
  };

  export const deleteReminder = async (uuid: string): Promise<void> => {
      try {
        const reminderRepository = dataSource.getRepository(Reminder);
        const reminderToDelete = await reminderRepository.findOne({
          where: { uuid },
        });
  
        if (!reminderToDelete) {
          throw new Error("Reminder not found");
        }
  
        await reminderRepository.delete(reminderToDelete.id);
      } catch (error) {
        throw error;
      }
    };
}
