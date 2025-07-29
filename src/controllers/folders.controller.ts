import { FindOptionsWhere, IsNull } from "typeorm";
import { FoldersService } from "../services/folders.service";
import { Folder } from "../models/folder.entity";

export module FoldersController {
  export const create = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const folderData = req.body;

      const newFolder = await FoldersService.create({
        ...folderData,
        ownerUserId: userId,
      });

      res.status(201).json(newFolder);
    } catch (error) {
      next(error);
    }
  };

  export const getPrivate = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { parentFolderId } = req.query;

      const whereCondition: FindOptionsWhere<Folder> = {
        ownerUserId: userId,
        type: "private",
      };

      if (!parentFolderId) {
        whereCondition.parentFolderId = IsNull();
      } else {
        whereCondition.parentFolderId = parentFolderId;
      }

      const folders = await FoldersService.getMany(whereCondition);

      if (!folders) {
        return res.status(404).json({ message: "Folders not found" });
      }

      res.json(folders);
    } catch (error) {
      next(error);
    }
  };

  export const getShared = async (req, res, next) => {
    try {
      const { parentFolderId } = req.query;

      const whereCondition: FindOptionsWhere<Folder> = {
        type: "shared",
      };

      if (!parentFolderId) {
        whereCondition.parentFolderId = IsNull();
      } else {
        whereCondition.parentFolderId = parentFolderId;
      }

      const folders = await FoldersService.getMany(whereCondition, {
        ownerUser: true,
      });

      if (!folders) {
        return res.status(404).json({ message: "Folders not found" });
      }

      const sharedFoldersFormatted = folders.map((folder) => ({
        id: folder.id,
        uuid: folder.uuid,
        name: folder.name,
        type: folder.type,
        locked: folder.locked,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        ownerEmail: folder.ownerUser.email,
      }));

      res.json(sharedFoldersFormatted);
    } catch (error) {
      next(error);
    }
  };

  export const getRecent = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const folders = await FoldersService.getRecent(userId);

      res.json(folders);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const folderData = req.body;

      const folders = await FoldersService.update(uuid, folderData);

      res.json(folders);
    } catch (error) {
      next(error);
    }
  };

  export const remove = async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const deleted = await FoldersService.remove(uuid);

      res.status(deleted ? 200 : 404).json({
        message: deleted ? "Folder deleted successfully" : "Folder not found",
      });
    } catch (error) {
      next(error);
    }
  };
}
