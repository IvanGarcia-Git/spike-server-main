import { TaskCommentsService } from "../services/task-comments.service";

export module TasksCommentsController {
  export const create = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { taskUuid } = req.params;

      const taskCommentData = req.body;
      taskCommentData.userId = userId;

      const commentFile: Express.Multer.File = req.file;

      const newTaskComment = await TaskCommentsService.create(
        taskCommentData,
        taskUuid,
        commentFile
      );

      res.status(201).json(newTaskComment);
    } catch (error) {
      next(error);
    }
  };
}
