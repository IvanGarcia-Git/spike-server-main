import { AwsHelper } from "../helpers/aws.helper";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere, IsNull, Not, In } from "typeorm";
import { File } from "../models/file.entity";
import { FileShare, SharePermission } from "../models/file-share.entity";
import { User } from "../models/user.entity";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

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

      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileUuid}${fileExtension}`;
      const fileUri = await AwsHelper.uploadFileToS3(`drive/${fileName}`, file);

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

      // Solo archivos NO eliminados (deletedAt es null)
      const filesFound = await fileRepository.find({
        where: { ...where, deletedAt: IsNull() },
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
        where: [
          { ownerUserId: userId, type: "private", deletedAt: IsNull() },
          { type: "shared", deletedAt: IsNull() }
        ],
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

  // Obtener archivos eliminados (papelera)
  export const getDeleted = async (userId: number): Promise<File[]> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      const files = await fileRepository.find({
        where: { ownerUserId: userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
        relations: { ownerUser: true },
        order: { deletedAt: "DESC" },
      });

      for (const file of files) {
        file.uri = AwsHelper.getPresignedUrl(file.uri);
      }

      return files;
    } catch (error) {
      throw error;
    }
  };

  // Soft delete - mover a papelera
  export const remove = async (where: FindOptionsWhere<File>): Promise<boolean> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      // Soft delete usando TypeORM
      await fileRepository.softDelete(where);

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Restaurar archivo de la papelera
  export const restore = async (where: FindOptionsWhere<File>): Promise<boolean> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      await fileRepository.restore(where);

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Vaciar papelera - hard delete permanente
  export const emptyTrash = async (userId: number): Promise<boolean> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      // Obtener archivos eliminados del usuario
      const filesToDelete = await fileRepository.find({
        where: { ownerUserId: userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });

      if (filesToDelete.length === 0) {
        return true;
      }

      // Eliminar archivos de S3
      const fileUris = filesToDelete.map((file) => file.uri);
      await Promise.all(fileUris.map((uri) => AwsHelper.deleteFileFromS3(uri)));

      // Hard delete de la base de datos
      const ids = filesToDelete.map((file) => file.id);
      await fileRepository
        .createQueryBuilder()
        .delete()
        .where("id IN (:...ids)", { ids })
        .execute();

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Hard delete permanente de un archivo específico
  export const permanentDelete = async (where: FindOptionsWhere<File>): Promise<boolean> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      const filesToDelete = await fileRepository.find({
        where,
        withDeleted: true
      });

      if (filesToDelete.length === 0) {
        return true;
      }

      const fileUris = filesToDelete.map((file) => file.uri);
      await Promise.all(fileUris.map((uri) => AwsHelper.deleteFileFromS3(uri)));

      const ids = filesToDelete.map((file) => file.id);
      await fileRepository
        .createQueryBuilder()
        .delete()
        .where("id IN (:...ids)", { ids })
        .execute();

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Actualizar archivo (para destacado, etc.)
  export const update = async (
    id: number,
    data: Partial<File>
  ): Promise<File> => {
    try {
      const fileRepository = dataSource.getRepository(File);

      await fileRepository.update(id, data);

      const updatedFile = await fileRepository.findOne({ where: { id } });
      if (updatedFile) {
        updatedFile.uri = AwsHelper.getPresignedUrl(updatedFile.uri);
      }

      return updatedFile;
    } catch (error) {
      throw error;
    }
  };

  // ============================================
  // FUNCIONES DE COMPARTIR ARCHIVOS
  // ============================================

  // Compartir archivo con uno o varios usuarios
  export const shareFile = async (
    fileId: number,
    sharedByUserId: number,
    sharedWithUserIds: number[],
    permission: SharePermission = SharePermission.READ
  ): Promise<FileShare[]> => {
    try {
      const fileShareRepository = dataSource.getRepository(FileShare);
      const fileRepository = dataSource.getRepository(File);

      // Verificar que el archivo existe y pertenece al usuario
      const file = await fileRepository.findOne({
        where: { id: fileId, ownerUserId: sharedByUserId },
      });

      if (!file) {
        throw new Error("file-not-found-or-not-owner");
      }

      const shares: FileShare[] = [];

      for (const userId of sharedWithUserIds) {
        // No permitir compartir consigo mismo
        if (userId === sharedByUserId) continue;

        // Verificar si ya existe este share
        const existingShare = await fileShareRepository.findOne({
          where: { fileId, sharedWithUserId: userId },
        });

        if (existingShare) {
          // Actualizar permisos si ya existe
          existingShare.permission = permission;
          await fileShareRepository.save(existingShare);
          shares.push(existingShare);
        } else {
          // Crear nuevo share
          const newShare = fileShareRepository.create({
            fileId,
            sharedByUserId,
            sharedWithUserId: userId,
            permission,
          });
          const savedShare = await fileShareRepository.save(newShare);
          shares.push(savedShare);
        }
      }

      return shares;
    } catch (error) {
      throw error;
    }
  };

  // Quitar compartición de un archivo
  export const unshareFile = async (
    fileId: number,
    sharedByUserId: number,
    sharedWithUserId: number
  ): Promise<boolean> => {
    try {
      const fileShareRepository = dataSource.getRepository(FileShare);

      const result = await fileShareRepository.delete({
        fileId,
        sharedByUserId,
        sharedWithUserId,
      });

      return result.affected > 0;
    } catch (error) {
      throw error;
    }
  };

  // Obtener archivos compartidos conmigo
  export const getSharedWithMe = async (userId: number): Promise<any[]> => {
    try {
      const fileShareRepository = dataSource.getRepository(FileShare);

      const shares = await fileShareRepository.find({
        where: { sharedWithUserId: userId },
        relations: {
          file: { ownerUser: true },
          sharedByUser: true,
        },
        order: { createdAt: "DESC" },
      });

      // Filtrar archivos no eliminados y formatear
      const files = shares
        .filter((share) => share.file && !share.file.deletedAt)
        .map((share) => {
          share.file.uri = AwsHelper.getPresignedUrl(share.file.uri);
          return {
            id: share.file.id,
            uuid: share.file.uuid,
            name: share.file.name,
            uri: share.file.uri,
            size: share.file.size,
            mimetype: share.file.mimeType,
            type: share.file.type,
            createdAt: share.file.createdAt,
            ownerEmail: share.file.ownerUser?.email,
            ownerName: share.file.ownerUser?.name,
            sharedByEmail: share.sharedByUser?.email,
            sharedByName: share.sharedByUser?.name,
            permission: share.permission,
            sharedAt: share.createdAt,
          };
        });

      return files;
    } catch (error) {
      throw error;
    }
  };

  // Obtener archivos compartidos por mí
  export const getSharedByMe = async (userId: number): Promise<any[]> => {
    try {
      const fileShareRepository = dataSource.getRepository(FileShare);

      const shares = await fileShareRepository.find({
        where: { sharedByUserId: userId },
        relations: {
          file: true,
          sharedWithUser: true,
        },
        order: { createdAt: "DESC" },
      });

      // Agrupar por archivo
      const filesMap = new Map<number, any>();

      for (const share of shares) {
        if (!share.file || share.file.deletedAt) continue;

        share.file.uri = AwsHelper.getPresignedUrl(share.file.uri);

        if (!filesMap.has(share.file.id)) {
          filesMap.set(share.file.id, {
            id: share.file.id,
            uuid: share.file.uuid,
            name: share.file.name,
            uri: share.file.uri,
            size: share.file.size,
            mimetype: share.file.mimeType,
            type: share.file.type,
            createdAt: share.file.createdAt,
            sharedWith: [],
          });
        }

        filesMap.get(share.file.id).sharedWith.push({
          userId: share.sharedWithUser?.id,
          email: share.sharedWithUser?.email,
          name: share.sharedWithUser?.name,
          permission: share.permission,
          sharedAt: share.createdAt,
        });
      }

      return Array.from(filesMap.values());
    } catch (error) {
      throw error;
    }
  };

  // Obtener usuarios con los que se compartió un archivo
  export const getFileShares = async (
    fileId: number,
    ownerUserId: number
  ): Promise<any[]> => {
    try {
      const fileShareRepository = dataSource.getRepository(FileShare);
      const fileRepository = dataSource.getRepository(File);

      // Verificar que el archivo pertenece al usuario
      const file = await fileRepository.findOne({
        where: { id: fileId, ownerUserId },
      });

      if (!file) {
        throw new Error("file-not-found-or-not-owner");
      }

      const shares = await fileShareRepository.find({
        where: { fileId },
        relations: { sharedWithUser: true },
      });

      return shares.map((share) => ({
        id: share.id,
        userId: share.sharedWithUser?.id,
        email: share.sharedWithUser?.email,
        name: share.sharedWithUser?.name,
        permission: share.permission,
        sharedAt: share.createdAt,
      }));
    } catch (error) {
      throw error;
    }
  };

  // Obtener usuarios disponibles para compartir (excluyendo el propietario)
  export const getUsersForSharing = async (
    currentUserId: number
  ): Promise<any[]> => {
    try {
      const userRepository = dataSource.getRepository(User);

      const users = await userRepository.find({
        select: ["id", "name", "firstSurname", "email", "imageUri"],
        order: { name: "ASC" },
      });

      // Excluir usuario actual
      return users
        .filter((user) => user.id !== currentUserId)
        .map((user) => ({
          id: user.id,
          name: `${user.name} ${user.firstSurname}`,
          email: user.email,
          imageUri: user.imageUri,
        }));
    } catch (error) {
      throw error;
    }
  };
}
