import { AwsHelper } from "../helpers/aws.helper";
import { ContractDocument } from "../models/contract-document.entity";
import { ContractsService } from "./contracts.service";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";

export module ContractDocumentsService {
  export const create = async (
    contractUuid: string,
    contractDocument: Express.Multer.File
  ): Promise<ContractDocument> => {
    try {
      const contractDocumentRepository =
        dataSource.getRepository(ContractDocument);

      if (!contractDocument) {
        throw new Error("no-document-attached");
      }

      const contractFound = await ContractsService.getOne({
        uuid: contractUuid,
      });

      const { documentOriginalName: fileName, documentUri } =
        await AwsHelper.uploadContractDocumentToS3(
          contractUuid,
          contractDocument
        );

      const newContractDocument = contractDocumentRepository.create({
        documentUri,
        fileName,
        contractId: contractFound.id,
      });

      return await contractDocumentRepository.save(newContractDocument);
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<ContractDocument>
  ): Promise<ContractDocument> => {
    try {
      const contractDocumentRepository =
        dataSource.getRepository(ContractDocument);

      const contractDocumentFound = await contractDocumentRepository.findOne({
        where,
      });

      if (!contractDocumentFound) {
        throw new Error("chancontract-document-not-found");
      }

      contractDocumentFound.documentUri = AwsHelper.getPresignedUrl(
        contractDocumentFound.documentUri
      );

      return contractDocumentFound;
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<ContractDocument>,
    relations: FindOptionsRelations<ContractDocument> = {}
  ): Promise<ContractDocument[]> => {
    try {
      const contractDocumentRepository =
        dataSource.getRepository(ContractDocument);

      const contactDocumentsFound = await contractDocumentRepository.find({
        where,
        relations,
        order: { id: "DESC" },
      });

      for (const contractDocument of contactDocumentsFound) {
        contractDocument.documentUri = AwsHelper.getPresignedUrl(
          contractDocument.documentUri
        );
      }

      return contactDocumentsFound;
    } catch (error) {
      throw error;
    }
  };

  export const deleteContractDocument = async (
    contractDocumentUuid: string
  ): Promise<boolean> => {
    try {
      const contractDocumentRepository =
        dataSource.getRepository(ContractDocument);

      const contractDocument = await contractDocumentRepository.findOne({
        where: { uuid: contractDocumentUuid },
      });

      if (!contractDocument) {
        throw new Error("channel-not-found");
      }

      await AwsHelper.deleteContractDocumentFromS3(
        contractDocument.documentUri
      );

      await contractDocumentRepository.remove(contractDocument);

      return true;
    } catch (error) {
      throw error;
    }
  };
}
