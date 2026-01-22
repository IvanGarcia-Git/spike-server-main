import { FindOptionsWhere, IsNull } from "typeorm";
import { FilesService } from "../services/files.service";
import { File } from "../models/file.entity";
import { SharePermission } from "../models/file-share.entity";

export module FilesController {
  export const create = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const fileData = req.body;
      const file: Express.Multer.File = req.file;

      const newFile = await FilesService.create(
        { ...fileData, ownerUserId: userId },
        file
      );

      res.status(201).json(newFile);
    } catch (error) {
      next(error);
    }
  };

  export const getPrivate = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { folderId } = req.query;

      const whereCondition: FindOptionsWhere<File> = {
        type: "private",
        ownerUserId: userId,
      };

      if (!folderId) {
        whereCondition.folderId = IsNull();
      } else {
        whereCondition.folderId = folderId;
      }

      const files = await FilesService.getMany(whereCondition, {
        ownerUser: true,
      });

      if (!files) {
        return res.status(404).json({ message: "Files not found" });
      }

      const privateFilesFormatted = files.map((file) => ({
        id: file.id,
        uuid: file.uuid,
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimetype: file.mimeType,
        type: file.type,
        createdAt: file.createdAt,
        ownerEmail: file.ownerUser.email,
      }));

      res.json(privateFilesFormatted);
    } catch (error) {
      next(error);
    }
  };

  export const getShared = async (req, res, next) => {
    try {
      const { folderId } = req.query;

      const whereCondition: FindOptionsWhere<File> = {
        type: "shared",
      };

      if (!folderId) {
        whereCondition.folderId = IsNull();
      } else {
        whereCondition.folderId = folderId;
      }

      const files = await FilesService.getMany(whereCondition, {
        ownerUser: true,
      });

      if (!files) {
        return res.status(404).json({ message: "Files not found" });
      }

      const sharedFilesFormatted = files.map((file) => ({
        id: file.id,
        uuid: file.uuid,
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimetype: file.mimeType,
        type: file.type,
        createdAt: file.createdAt,
        ownerEmail: file.ownerUser.email,
      }));

      res.json(sharedFilesFormatted);
    } catch (error) {
      next(error);
    }
  };

  export const getRecent = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const files = await FilesService.getRecent(userId);

      const recentFilesFormatted = files.map((file) => ({
        id: file.id,
        uuid: file.uuid,
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimetype: file.mimeType,
        type: file.type,
        createdAt: file.createdAt,
        ownerEmail: file.ownerUser.email,
      }));

      res.json(recentFilesFormatted);
    } catch (error) {
      next(error);
    }
  };

  export const remove = async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const deleted = await FilesService.remove({ uuid });

      res.status(deleted ? 200 : 404).json({
        message: deleted ? "File moved to trash" : "File not found",
      });
    } catch (error) {
      next(error);
    }
  };

  // Obtener archivos en papelera
  export const getTrash = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const files = await FilesService.getDeleted(userId);

      const trashFilesFormatted = files.map((file) => ({
        id: file.id,
        uuid: file.uuid,
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimetype: file.mimeType,
        type: file.type,
        createdAt: file.createdAt,
        deletedAt: file.deletedAt,
        ownerEmail: file.ownerUser?.email,
      }));

      res.json(trashFilesFormatted);
    } catch (error) {
      next(error);
    }
  };

  // Restaurar archivo de la papelera
  export const restore = async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const restored = await FilesService.restore({ uuid });

      res.status(restored ? 200 : 404).json({
        message: restored ? "File restored successfully" : "File not found",
      });
    } catch (error) {
      next(error);
    }
  };

  // Vaciar papelera
  export const emptyTrash = async (req, res, next) => {
    try {
      const { userId } = req.user;

      await FilesService.emptyTrash(userId);

      res.json({ message: "Trash emptied successfully" });
    } catch (error) {
      next(error);
    }
  };

  // Actualizar archivo (destacado, etc.)
  export const update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const updatedFile = await FilesService.update(Number(id), data);

      if (!updatedFile) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json(updatedFile);
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // ENDPOINTS DE COMPARTIR ARCHIVOS
  // ============================================

  // Compartir archivo con usuarios
  export const shareFile = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { fileId, userIds, permission } = req.body;

      if (!fileId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "fileId and userIds are required" });
      }

      const shares = await FilesService.shareFile(
        fileId,
        userId,
        userIds,
        permission || SharePermission.READ
      );

      res.status(201).json({
        message: "File shared successfully",
        shares,
      });
    } catch (error) {
      if (error.message === "file-not-found-or-not-owner") {
        return res.status(404).json({ message: "File not found or you are not the owner" });
      }
      next(error);
    }
  };

  // Quitar compartición
  export const unshareFile = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { fileId, sharedWithUserId } = req.body;

      if (!fileId || !sharedWithUserId) {
        return res.status(400).json({ message: "fileId and sharedWithUserId are required" });
      }

      const removed = await FilesService.unshareFile(fileId, userId, sharedWithUserId);

      res.json({
        message: removed ? "Share removed successfully" : "Share not found",
        success: removed,
      });
    } catch (error) {
      next(error);
    }
  };

  // Obtener archivos compartidos conmigo
  export const getSharedWithMe = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const files = await FilesService.getSharedWithMe(userId);

      res.json(files);
    } catch (error) {
      next(error);
    }
  };

  // Obtener archivos que compartí
  export const getSharedByMe = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const files = await FilesService.getSharedByMe(userId);

      res.json(files);
    } catch (error) {
      next(error);
    }
  };

  // Obtener comparticiones de un archivo específico
  export const getFileShares = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { fileId } = req.params;

      const shares = await FilesService.getFileShares(Number(fileId), userId);

      res.json(shares);
    } catch (error) {
      if (error.message === "file-not-found-or-not-owner") {
        return res.status(404).json({ message: "File not found or you are not the owner" });
      }
      next(error);
    }
  };

  // Obtener usuarios disponibles para compartir
  export const getUsersForSharing = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const users = await FilesService.getUsersForSharing(userId);

      res.json(users);
    } catch (error) {
      next(error);
    }
  };
}
