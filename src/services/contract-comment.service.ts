import { AwsHelper } from "../helpers/aws.helper";
import { dataSource } from "../../app-data-source";
import { ContractComment } from "../models/contract-comment.entity";
import { ContractsService } from "./contracts.service";
import { NotificationsService } from "./notifications.service";
import { EventType } from "../models/notification.entity";
import { NotificationContents } from "../enums/notfication-contents.enum";
import { NotificationPreference } from "../models/user.entity";

export module ContractCommentService {
  export const create = async (
    commentData: Partial<ContractComment>,
    contractUuid: string,
    documentFile?: Express.Multer.File
  ): Promise<ContractComment> => {
    try {
      const contractCommentRepository = dataSource.getRepository(ContractComment);

      let documentUri: string = null;
      let presignedUrl: string = null;

      if (documentFile) {
        const { documentUri: awsKeyPath, presignedUrl: generatedUrl } =
          await AwsHelper.uploadContractCommentDocumentToS3(contractUuid, documentFile);

        documentUri = awsKeyPath;
        presignedUrl = generatedUrl;
      }

      const contractFound = await ContractsService.getOne(
        { uuid: contractUuid },
        { customer: true }
      );

      const newComment = contractCommentRepository.create({
        text: commentData.text,
        documentUri,
        contractId: contractFound.id,
        userId: commentData.userId,
      });

      const savedContractComment = await contractCommentRepository.save(newComment);

      const contractUrl = `${process.env.API_URL_CONTRACT}/contratos/${contractFound.customer.uuid}/${contractFound.uuid}`;

      await NotificationsService.create(
        {
          sourceUrl: contractUrl,
          eventType: EventType.OTHER,
          content: NotificationContents.ContractCommented(contractFound?.cups || "Sin Cups"),
          userId: contractFound.userId,
          startDate: new Date(),
        },
        NotificationPreference.CONTRACT_COMMENTED
      );

      return { ...savedContractComment, documentUri: presignedUrl };
    } catch (error) {
      throw error;
    }
  };
}
