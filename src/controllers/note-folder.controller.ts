import { Request, Response, NextFunction } from "express";
import { NoteFolderService } from "../services/note-folder.service";

export module NoteFolderController {
  export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const folders = await NoteFolderService.getAll(userId);
      res.json(folders);
    } catch (err) {
      next(err);
    }
  };

  export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const folderId = parseInt(req.params.id);
      const folder = await NoteFolderService.getById(folderId, userId);
      
      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
      
      res.json(folder);
    } catch (err) {
      next(err);
    }
  };

  export const getByFolderId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { folderId } = req.params;
      const folder = await NoteFolderService.getByFolderId(folderId, userId);
      
      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
      
      res.json(folder);
    } catch (err) {
      next(err);
    }
  };

  export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const folder = await NoteFolderService.create(req.body, userId);
      res.status(201).json(folder);
    } catch (err) {
      next(err);
    }
  };

  export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const folderId = parseInt(req.params.id);
      const folder = await NoteFolderService.update(folderId, req.body, userId);
      res.json(folder);
    } catch (err) {
      next(err);
    }
  };

  export const updateByFolderId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { folderId } = req.params;
      const folder = await NoteFolderService.updateByFolderId(folderId, req.body, userId);
      res.json(folder);
    } catch (err) {
      next(err);
    }
  };

  export const deleteFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const folderId = parseInt(req.params.id);
      await NoteFolderService.deleteFolder(folderId, userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  export const deleteByFolderId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { folderId } = req.params;
      await NoteFolderService.deleteByFolderId(folderId, userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  export const bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const folders = await NoteFolderService.bulkCreate(req.body.folders, userId);
      res.status(201).json(folders);
    } catch (err) {
      next(err);
    }
  };

  export const deleteAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      await NoteFolderService.deleteAll(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}