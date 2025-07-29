import { LeadCall } from "../models/lead-call.entity";
import { dataSource } from "../../app-data-source";
import { Between, FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { AwsHelper } from "../helpers/aws.helper";
import { NotificationsService } from "./notifications.service";
import { EventType } from "../models/notification.entity";
import { NotificationContents } from "../enums/notfication-contents.enum";
import { NotificationPreference } from "../models/user.entity";

export module LeadCallsService {
  export const create = async (
    leadCallData: Partial<LeadCall>,
    documentFile?: Express.Multer.File
  ): Promise<LeadCall> => {
    try {
      const leadCallRepository = dataSource.getRepository(LeadCall);

      if (documentFile) {
        leadCallData.documentUri = await AwsHelper.uploadGenericCommentDocumentToS3(
          "leadCalls",
          documentFile
        );
      }

      const newLeadCall = leadCallRepository.create(leadCallData);

      await NotificationsService.create(
        {
          sourceUrl: newLeadCall?.contractUrl,
          eventType: EventType.LEAD_CALL,
          content: NotificationContents.LeadCallPending(leadCallData.subject),
          userId: leadCallData.userId,
          startDate: leadCallData.startDate,
        },
        NotificationPreference.LEAD_CALL
      );

      return await leadCallRepository.save(newLeadCall);
    } catch (error) {
      throw error;
    }
  };

  export const get = async (where: FindOptionsWhere<LeadCall>): Promise<LeadCall> => {
    try {
      const leadCallRepository = dataSource.getRepository(LeadCall);

      return await leadCallRepository.findOneBy(where);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<LeadCall>,
    relations: FindOptionsRelations<LeadCall> = {}
  ): Promise<LeadCall[]> => {
    try {
      const leadCallRepository = dataSource.getRepository(LeadCall);

      return await leadCallRepository.find({
        where,
        relations,
      });
    } catch (error) {
      throw error;
    }
  };

  export const getManyByDate = async (
    date: Date,
    where: FindOptionsWhere<LeadCall>,
    relations: FindOptionsRelations<LeadCall> = {}
  ): Promise<LeadCall[]> => {
    try {
      const leadCallRepository = dataSource.getRepository(LeadCall);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dateCondition: FindOptionsWhere<LeadCall> = {
        ...where,
        startDate: Between(startOfDay, endOfDay),
      };

      const leadCallsFound = await leadCallRepository.find({
        where: dateCondition,
        relations,
      });

      for (const leadCallFound of leadCallsFound) {
        if (leadCallFound?.documentUri) {
          leadCallFound.documentUri = AwsHelper.getPresignedUrl(leadCallFound.documentUri);
        }
      }

      return leadCallsFound;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (uuid: string, completed: boolean): Promise<LeadCall> => {
    try {
      const leadCallRepository = dataSource.getRepository(LeadCall);
      const reminderToUpdate = await leadCallRepository.findOne({
        where: { uuid },
      });

      if (!reminderToUpdate) {
        throw new Error("Lead Call not found");
      }
      return await leadCallRepository.save({
        ...reminderToUpdate,
        completed,
      });
    } catch (error) {
      throw error;
    }
  };

  export const deleteLeadCall = async (uuid: string): Promise<void> => {
    try {
      const leadCallRepository = dataSource.getRepository(LeadCall);
      const leadCallToDelete = await leadCallRepository.findOne({
        where: { uuid },
      });

      if (!leadCallToDelete) {
        throw new Error("Lead Call not found");
      }

      await leadCallRepository.delete(leadCallToDelete.id);
    } catch (error) {
      throw error;
    }
  };
}
