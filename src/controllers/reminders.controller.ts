import { RemindersService } from "../services/reminders.service";

export module RemindersController {
  export const create = async (req, res, next) => {
    const { userId } = req.user;
    const reminderData = req.body;
    const reminderFile = req.file;

    reminderData.userId = userId;

    try {
      const reminderCreated = await RemindersService.create(
        reminderData,
        reminderFile
      );

      res.status(201).json(reminderCreated);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    const { reminderUuid } = req.params;

    try {
      const reminder = await RemindersService.get({ uuid: reminderUuid });

      res.json(reminder);
    } catch (error) {
      next(error);
    }
  };

  export const getMany = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const userReminders = await RemindersService.getMany({ userId });

      res.json(userReminders);
    } catch (error) {
      next(error);
    }
  };

  export const getManyByDate = async (req, res, next) => {
    const { userId } = req.user;
    const { reminderDate } = req.body;

    try {
      const userReminders = await RemindersService.getManyByDate(reminderDate, {
        userId,
      });

      res.json(userReminders);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    const { reminderUuid } = req.params;
    const { completed } = req.body;

    try {
      const updatedReminder = await RemindersService.update(
        reminderUuid,
        completed
      );

      res.json(updatedReminder);
    } catch (error) {
      next(error);
    }
  };

  export const deleteReminder = async (req, res, next) => {
      try {
        const { reminderUuid } = req.params;
        await RemindersService.deleteReminder(reminderUuid);
        res.json({ message: "Reminder deleted successfully" });
      } catch (error) {
        next(error);
      }
    };
}
