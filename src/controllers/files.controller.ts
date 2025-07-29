import { FindOptionsWhere, IsNull } from "typeorm";
import { FilesService } from "../services/files.service";
import { File } from "../models/file.entity";

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
        message: deleted ? "File deleted successfully" : "File not found",
      });
    } catch (error) {
      next(error);
    }
  };
}
