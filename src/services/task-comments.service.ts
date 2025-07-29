import { AwsHelper } from "../helpers/aws.helper";
import { dataSource } from "../../app-data-source";
import { TaskComment } from "../models/task-comment.entity";
import { TasksService } from "./tasks.service";

export module TaskCommentsService {
  export const create = async (
    commentData: Partial<TaskComment>,
    taskUuid: string,
    documentFile?: Express.Multer.File
  ): Promise<TaskComment> => {
    try {
      const taskCommentRepository = dataSource.getRepository(TaskComment);

      let documentUri: string = null;
      let presignedUrl: string = null;

      if (documentFile) {
        const { documentUri: awsKeyPath, presignedUrl: generatedUrl } =
          await AwsHelper.uploadTaskCommentDocumentToS3(taskUuid, documentFile);

        documentUri = awsKeyPath;
        presignedUrl = generatedUrl;
      }

      const taskFound = await TasksService.getOne({ uuid: taskUuid });

      const newComment = taskCommentRepository.create({
        text: commentData.text,
        documentUri,
        taskId: taskFound.id,
        userId: commentData.userId,
      });

      const savedTaskComment = await taskCommentRepository.save(newComment);

      return { ...savedTaskComment, documentUri: presignedUrl };
    } catch (error) {
      throw error;
    }
  };
}
