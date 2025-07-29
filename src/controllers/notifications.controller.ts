import { NotificationPreference } from "../models/user.entity";
import { NotificationsService } from "../services/notifications.service";

export module NotificationsController {
  export const getVisible = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const notifications = await NotificationsService.getVisible(userId);

      res.json(notifications);
    } catch (error) {
      next(error);
    }
  };

  export const getUnnotified = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const notifications = await NotificationsService.getUnnotified(userId);

      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  export const create = async (req, res, next) => {
    try {
      const notificationData = req.body;
      const notificationFile: Express.Multer.File = req.file;
      if (req.body.creatorId) {
        notificationData.creatorId = req.body.creatorId;
      }

      const notification = await NotificationsService.create(
        notificationData,
        NotificationPreference.COMMUNICATION,
        notificationFile
      );

      res.json(notification);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { uuid: notificationUuid } = req.params;

      const notificationData = req.body;

      const updatedNotification = await NotificationsService.update(
        notificationUuid,
        notificationData
      );

      res.json(updatedNotification);
    } catch (error) {
      next(error);
    }
  };

  export const bulkUpdate = async (req, res, next) => {
  try {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "El body debe ser un array de actualizaciones y no puede estar vacío." });
    }

    const result = await NotificationsService.bulkUpdate(updates);

    res.json({ message: "Notificaciones actualizadas correctamente.", ...result });
  } catch (error) {
    next(error);
  }
};

  export const bulkDelete = async (req, res, next) => {
    try {
      const { uuids } = req.body;
      await NotificationsService.bulkDelete(uuids);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  export const readHistory = async (req, res, next) => {
    try {
      const { batchId } = req.params;
      const history = await NotificationsService.readHistory(batchId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  };

  export const getSent = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const notifications = await NotificationsService.getSent(userId);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  };
}
