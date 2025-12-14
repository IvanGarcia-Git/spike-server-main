import { dataSource } from "../../app-data-source";
import { Task } from "../models/task.entity";
import { AwsHelper } from "../helpers/aws.helper";
import { TaskComment } from "../models/task-comment.entity";
import {
  Between,
  FindOptionsRelations,
  FindOptionsWhere,
  Like,
  MoreThanOrEqual,
} from "typeorm";
import { TaskSearchDTO } from "../dto/task-search.dto";
import { NotificationContents } from "../enums/notification-contents.enum";
import { NotificationsService } from "./notifications.service";
import { EventType } from "../models/notification.entity";
import { NotificationPreference } from "../models/user.entity";
import { ValidationService } from "./validation.service";
import { NotFoundError, ValidationError } from "../errors/app-errors";
import { ErrorMessages } from "../errors/error-messages";

export module TasksService {
  /**
   * Valida los datos de una tarea antes de crear/actualizar
   */
  const validateTaskData = async (
    taskData: Partial<Task>,
    isCreate: boolean = true
  ): Promise<void> => {
    // Validaciones obligatorias en creación
    if (isCreate) {
      ValidationService.required(taskData.subject, "subject", "Asunto");
      ValidationService.required(taskData.assigneeUserId, "assigneeUserId", "Usuario asignado");
    }

    // Validaciones de formato
    if (taskData.subject) {
      ValidationService.length(taskData.subject, "subject", { min: 3, max: 255 }, "Asunto");
    }

    // Validar que el usuario asignado exista
    if (taskData.assigneeUserId) {
      await ValidationService.userExists(taskData.assigneeUserId, "Tarea");
    }

    // Validar que el usuario creador exista
    if (taskData.creatorUserId) {
      await ValidationService.userExists(taskData.creatorUserId, "Tarea");
    }
  };

  export const create = async (
    taskData: Partial<Task>,
    initialComment?: { text: string; document?: Express.Multer.File }
  ): Promise<Task> => {
    //TODO: Refactor to Transaction
    const taskRepository = dataSource.getRepository(Task);

    // Validar datos de la tarea
    await validateTaskData(taskData, true);

    const newTask = taskRepository.create(taskData);
    const savedTask = await taskRepository.save(newTask);

    if (initialComment) {
      const commentRepository = dataSource.getRepository(TaskComment);

      let documentUri: string;
      if (initialComment.document) {
        const { documentUri: awsKeyPath } =
          await AwsHelper.uploadTaskCommentDocumentToS3(
            newTask.uuid,
            initialComment.document
          );

        documentUri = awsKeyPath;
      }

      const newComment = commentRepository.create({
        text: initialComment.text,
        documentUri,
        taskId: savedTask.id,
        userId: savedTask.creatorUserId,
      });

      await commentRepository.save(newComment);
    }

    await NotificationsService.create(
      {
        sourceUrl: savedTask?.contractUrl,
        eventType: EventType.TASK,
        content: NotificationContents.TaskAssigned(savedTask.subject),
        userId: taskData.assigneeUserId,
        startDate: savedTask.startDate || new Date(),
      },
      NotificationPreference.TASK
    );

    return savedTask;
  };

  export const getOne = async (
    where: FindOptionsWhere<Task>,
    relations: FindOptionsRelations<Task> = {}
  ): Promise<Task> => {
    const taskRepository = dataSource.getRepository(Task);

    const taskFound = await taskRepository.findOne({
      where,
      relations,
    });

    if (!taskFound) {
      const identifier = where.uuid || where.id;
      throw new NotFoundError("Tarea", identifier?.toString());
    }

    return taskFound;
  };

  export const getMany = async (
    where: FindOptionsWhere<Task>,
    relations: FindOptionsRelations<Task> = {}
  ): Promise<Task[]> => {
    const taskRepository = dataSource.getRepository(Task);

    const tasks = await taskRepository.find({
      where,
      relations,
      order: { createdAt: "DESC" },
    });

    // Sort tasks: those with startDate first (by startDate DESC), then those without (by createdAt DESC)
    return tasks.sort((a, b) => {
      if (a.startDate && b.startDate) {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
      if (a.startDate && !b.startDate) return -1;
      if (!a.startDate && b.startDate) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  export const search = async (
    searchParams: TaskSearchDTO,
    userId: number
  ): Promise<Task[]> => {
    const taskRepository = dataSource.getRepository(Task);

    let whereCondition: FindOptionsWhere<Task> = {};

    //Only visible tasks
    whereCondition.creatorUserId = userId;

    if (searchParams.from && searchParams.to) {
      const fromDate = new Date(searchParams.from);
      fromDate.setDate(fromDate.getDate() - 1);
      fromDate.setUTCHours(0, 0, 0, 0);

      const toDate = new Date(searchParams.to);
      toDate.setUTCHours(0, 0, 0, 0);

      whereCondition.startDate = Between(fromDate, toDate);
    } else if (searchParams.from) {
      const fromDate = new Date(searchParams.from);
      fromDate.setDate(fromDate.getDate() - 1);
      fromDate.setUTCHours(0, 0, 0, 0);

      whereCondition.startDate = MoreThanOrEqual(fromDate);
    } else if (searchParams.to) {
      const toDate = new Date(searchParams.to);
      toDate.setUTCHours(0, 0, 0, 0);

      whereCondition.startDate = Between(new Date(0), toDate);
    }

    if (searchParams.subject) {
      whereCondition.subject = Like(`%${searchParams.subject}%`);
    }

    if (searchParams.assigneeUserId) {
      whereCondition.assigneeUserId = searchParams.assigneeUserId;
    }

    if (searchParams.taskStateId) {
      whereCondition.taskStateId = searchParams.taskStateId;
    }

    const tasks = await taskRepository.find({
      where: whereCondition,
      relations: { assigneeUser: true, taskState: true },
    });

    return tasks;
  };

  export const update = async (
    uuid: string,
    taskData: Partial<Task>
  ): Promise<Task> => {
    const taskRepository = dataSource.getRepository(Task);
    const taskToUpdate = await taskRepository.findOne({
      where: { uuid },
    });

    if (!taskToUpdate) {
      throw new NotFoundError("Tarea", uuid);
    }

    // Validar datos de la tarea (formato solamente)
    await validateTaskData(taskData, false);

    //TODO: Create enum for Task States
    //3 == "Hecho"
    if (taskData?.taskStateId && taskData.taskStateId == 3) {
      await NotificationsService.create(
        {
          sourceUrl: taskToUpdate?.contractUrl,
          eventType: EventType.TASK,
          content: NotificationContents.TaskDone(taskToUpdate.subject),
          userId: taskToUpdate.creatorUserId,
          startDate: new Date(),
        },
        NotificationPreference.TASK
      );
    }

    Object.assign(taskToUpdate, taskData);
    return await taskRepository.save(taskToUpdate);
  };

  export const deleteTask = async (uuid: string): Promise<void> => {
    const taskRepository = dataSource.getRepository(Task);
    const taskToDelete = await taskRepository.findOne({
      where: { uuid },
    });

    if (!taskToDelete) {
      throw new NotFoundError("Tarea", uuid);
    }

    await taskRepository.delete(taskToDelete.id);
  };
}