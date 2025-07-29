import { Not, MoreThan, In } from "typeorm";
import { AwsHelper } from "../helpers/aws.helper";
import { TasksService } from "../services/tasks.service";

export module TasksController {
  export const create = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const taskData = req.body;
      taskData.creatorUserId = userId;

      if (!taskData?.assigneeUserId) {
        taskData.assigneeUserId = userId;
      }

      const initialComment = req.body.initialComment
        ? { text: req.body.initialComment, document: req.file }
        : undefined;

      const newTask = await TasksService.create(taskData, initialComment);

      res.status(201).json(newTask);
    } catch (error) {
      next(error);
    }
  };

  export const getCreatedTasks = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const tasksFound = await TasksService.getMany(
        {
          creatorUserId: userId,
          assigneeUserId: Not(userId),
        },
        { taskState: true, assigneeUser: true }
      );

      res.status(200).json(tasksFound);
    } catch (error) {
      next(error);
    }
  };

  export const getAssignedTasks = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const tasksFound = await TasksService.getMany(
        { assigneeUserId: userId, taskStateId: In([1, 2, 4]) },
        { taskState: true, comments: true }
      );

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const taskDoneFound = await TasksService.getMany(
        { taskStateId: 3, assigneeUserId: userId, updatedAt: MoreThan(sevenDaysAgo) },
        { taskState: true, comments: true }
      );

      const allTasks = [...tasksFound, ...taskDoneFound];

      res.status(200).json(allTasks);
    } catch (error) {
      next(error);
    }
  };

  export const getTaskDetail = async (req, res, next) => {
    try {
      const { taskUuid } = req.params;

      const taskFound = await TasksService.getOne(
        { uuid: taskUuid },
        { assigneeUser: true, comments: { user: true }, taskState: true }
      );

      if (taskFound.comments.length > 0) {
        for (const comment of taskFound.comments) {
          if (comment?.documentUri) {
            comment.documentUri = AwsHelper.getPresignedUrl(comment.documentUri);
          }
        }
      }

      res.status(200).json(taskFound);
    } catch (error) {
      next(error);
    }
  };

  export const search = async (req, res, next) => {
    const { userId } = req.user;

    const searchParams = req.body;

    try {
      const tasksFound = await TasksService.search(searchParams, userId);

      res.json(tasksFound);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { taskUuid } = req.params;
      const taskData = req.body;

      const updatedTask = await TasksService.update(taskUuid, taskData);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  };

  export const deleteTask = async (req, res, next) => {
    try {
      const { taskUuid } = req.params;
      await TasksService.deleteTask(taskUuid);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
