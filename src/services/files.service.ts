import { AwsHelper } from "../helpers/aws.helper";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { File } from "../models/file.entity";
import { v4 as uuidv4 } from "uuid";

export module FilesService {
  export const create = async (
    fileData: Partial<File>,
    file: Express.Multer.File
  ): Promise<File> => {
    try {
      const fileUuid: string = uuidv4();
      const fileRepository = dataSource.getRepository(File);
      const newFile = fileRepository.create(fileData);

      if (!file) {
        throw new Error("no-file-sent");
      }

      const fileUri = await AwsHelper.uploadFileToS3(`drive/${fileUuid}`, file);

      const fileSaved = await fileRepository.save({
        ...newFile,
        uuid: fileUuid,
        uri: fileUri,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });

      fileSaved.uri = AwsHelper.getPresignedUrl(fileSaved.uri);

      return fileSaved;
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<File>,
    relations: FindOptionsRelations<File> = {}
  ): Promise<File[]> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      const filesFound = await fileRepository.find({
        where,
        relations,
        order: { createdAt: "DESC" },
      });

      for (const file of filesFound) {
        file.uri = AwsHelper.getPresignedUrl(file.uri);
      }

      return filesFound;
    } catch (error) {
      throw error;
    }
  };

  export const getRecent = async (userId: number): Promise<File[]> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      const files = await fileRepository.find({
        where: [{ ownerUserId: userId, type: "private" }, { type: "shared" }],
        relations: { ownerUser: true },
        order: { createdAt: "DESC" },
        take: 10,
      });

      for (const file of files) {
        file.uri = AwsHelper.getPresignedUrl(file.uri);
      }

      return files;
    } catch (error) {
      throw error;
    }
  };

  export const remove = async (where: FindOptionsWhere<File>): Promise<boolean> => {
    try {
      console.log(where);

      const fileRepository = dataSource.getRepository(File);

      const filesToDelete = await fileRepository.find({ where });

      if (filesToDelete.length === 0) {
        return;
      }

      const fileUris = filesToDelete.map((file) => file.uri);

      await Promise.all(fileUris.map((uri) => AwsHelper.deleteFileFromS3(uri)));

      await fileRepository.delete(where);

      return true;
    } catch (error) {
      throw error;
    }
  };
}
