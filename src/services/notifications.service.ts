import { AwsHelper } from "../helpers/aws.helper";
import { dataSource } from "../../app-data-source";
import { In, LessThanOrEqual } from "typeorm";
import { EventType, Notification } from "../models/notification.entity";
import { UsersService } from "./users.service";
import { NotificationPreference } from "../models/user.entity";
import { sendEmail } from "../helpers/resend.helper";
import { EmailHelper } from "../helpers/email.helper";
import { ContractLogs } from "../enums/contract-logs.enum";
import { v4 as uuidv4 } from "uuid";

export module NotificationsService {
  export const create = async (
    notificationData: Partial<Notification> & { specificPreferenceForEmailCheck?: string | null },
    notificationPreference: NotificationPreference,
    notificationDocument?: Express.Multer.File
  ): Promise<Notification> => {
    try {
      const userFound = await UsersService.get({
        id: notificationData.userId,
      });

      if (
        userFound?.notificationsPreferences &&
        !userFound.notificationsPreferences.some((preference) =>
          preference.startsWith(notificationPreference)
        )
      ) {
        return null;
      }

      if (notificationPreference == NotificationPreference.CONTRACT_ACTIVATED) {
        const dynamicPreference = userFound.notificationsPreferences?.find((preference) =>
          preference.startsWith(NotificationPreference.CONTRACT_ACTIVATED)
        );

        const notificationMonthsNumber = dynamicPreference
          ? parseInt(dynamicPreference.split("_").pop(), 10)
          : 0;

        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + notificationMonthsNumber);
        notificationData.startDate = currentDate;
      }

      const notificationRepository = dataSource.getRepository(Notification);

      const newNotification = notificationRepository.create(notificationData);

      if (!newNotification.batchId) {
        newNotification.batchId = uuidv4();
      }

      if (notificationData.creatorId) {
        newNotification.creatorId = Number(notificationData.creatorId);
      }

      if (notificationDocument) {
        newNotification.documentUri = await AwsHelper.uploadGenericCommentDocumentToS3(
          "notifications",
          notificationDocument
        );
      }

      const savedNotification = await notificationRepository.save(newNotification);

      if (notificationDocument) {
        savedNotification.documentUri = AwsHelper.getPresignedUrl(newNotification.documentUri);
      }

      const specificEmailPrefCheck = notificationData.specificPreferenceForEmailCheck;

      if (specificEmailPrefCheck) {
        const userWantsSpecificEmail = userFound?.notificationsEmailPreferences?.some((emailPref) =>
          emailPref.startsWith(specificEmailPrefCheck)
        );

        if (userWantsSpecificEmail) {
          const html = EmailHelper.notificationEmail(savedNotification);
          await sendEmail([userFound.email], "Nueva notificación disponible", html);
        }
      } else if (
        userFound?.notificationsEmailPreferences &&
        userFound.notificationsEmailPreferences.some((preference) =>
          preference.startsWith(notificationPreference)
        )
      ) {
        const html = EmailHelper.notificationEmail(savedNotification);
        await sendEmail([userFound.email], "Nueva notificación disponible", html);
      }
      return savedNotification;
    } catch (error) {
      throw error;
    }
  };

  export const createStateChangeNotification = async (
    userId: number,
    cups: string,
    contractUrl: string,
    oldStateName: string,
    newStateName: string,
    updatedByUser: { name: string; firstSurname: string }
  ) => {
    try {
      const userFound = await UsersService.get({ id: userId });

      if (!userFound || !userFound.notificationsPreferences) {
        return null;
      }

      const requiredPreference = `${NotificationPreference.STATE_CHANGE}_${oldStateName}_${newStateName}`;

      const userHasSpecificPreference = userFound.notificationsPreferences.some(
        (preference) => preference === requiredPreference
      );

      if (!userHasSpecificPreference) {
        return null;
      }

      const logContent = ContractLogs.ContractStateChanged(
        `${updatedByUser.name} ${updatedByUser.firstSurname}`,
        cups || "",
        oldStateName,
        newStateName
      );

      const notification = await NotificationsService.create(
        {
          sourceUrl: contractUrl,
          eventType: EventType.OTHER,
          content: logContent,
          userId: userId,
          startDate: new Date(),
          specificPreferenceForEmailCheck: requiredPreference,
        },
        NotificationPreference.STATE_CHANGE
      );

      return notification;
    } catch (error) {
      console.error("Error creating state change notification:", error);
      throw error;
    }
  };

  export const getVisible = async (userId: number): Promise<Notification[]> => {
    try {
      const notificationRepository = dataSource.getRepository(Notification);

      const notificationsFound = await notificationRepository.find({
        where: { userId, startDate: LessThanOrEqual(new Date()) },
        order: { startDate: "DESC" },
      });

      for (const notification of notificationsFound) {
        if (notification?.documentUri) {
          notification.documentUri = AwsHelper.getPresignedUrl(notification.documentUri);
        }
      }

      return notificationsFound;
    } catch (error) {
      throw error;
    }
  };

  export const getUnnotified = async (userId: number): Promise<Notification[]> => {
    try {
      const notificationRepository = dataSource.getRepository(Notification);

      const notificationsFound = await notificationRepository.find({
        where: { userId, notified: false, startDate: LessThanOrEqual(new Date()) },
        order: { createdAt: "ASC" },
      });

      for (const notification of notificationsFound) {
        if (notification?.documentUri) {
          notification.documentUri = AwsHelper.getPresignedUrl(notification.documentUri);
        }
      }

      return notificationsFound;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    uuid: string,
    notificationData: Partial<Notification>
  ): Promise<Notification> => {
    try {
      const notificationRepository = dataSource.getRepository(Notification);

      const notification = await notificationRepository.findOneBy({ uuid });

      if (!notification) {
        throw new Error("notification-not-found");
      }

      Object.assign(notification, notificationData);

      const updatedNotification = await notificationRepository.save(notification);

      return updatedNotification;
    } catch (error) {
      throw error;
    }
  };

  export const bulkUpdate = async (updates: any[]) => {
    const notificationRepository = dataSource.getRepository(Notification);
    let updatedCount = 0;

    await dataSource.transaction(async (transactionalEntityManager) => {
      const updatePromises = updates.map((update) => {
        const { uuid, data } = update;
        return transactionalEntityManager.update(Notification, { uuid }, data);
      });

      const results = await Promise.all(updatePromises);

      updatedCount = results.reduce((sum, result) => sum + (result.affected || 0), 0);
    });

    return { updatedCount };
  };

  export const bulkDelete = async (uuids: string[]) => {
    const notificationRepository = dataSource.getRepository(Notification);
    await notificationRepository.delete({ uuid: In(uuids) });
  };

  export const readHistory = async (batchId: string) => {
    const notificationRepository = dataSource.getRepository(Notification);
    const notifications = await notificationRepository.find({
      where: { batchId },
      relations: ["user"],
    });
    return notifications.map((n) => ({
      user: {
        id: n.user.id,
        name: n.user.name,
        firstSurname: n.user.firstSurname,
        secondSurname: n.user.secondSurname,
      },
      read: n.read,
    }));
  };

  export const getSent = async (creatorId: number): Promise<Notification[]> => {
    const notificationRepository = dataSource.getRepository(Notification);
    const notificationsFound = await notificationRepository.find({
      where: { creatorId },
      order: { startDate: "DESC" },
    });

    for (const notification of notificationsFound) {
      if (notification?.documentUri) {
        notification.documentUri = AwsHelper.getPresignedUrl(notification.documentUri);
      }
    }

    return notificationsFound;
  };
}
