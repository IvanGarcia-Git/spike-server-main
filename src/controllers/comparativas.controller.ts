import { Request, Response, NextFunction } from "express";
import { ComparativasService } from "../services/comparativas.service";

export module ComparativasController {
  export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const comparativas = await ComparativasService.getAll(userId);
      res.json(comparativas);
    } catch (err) {
      next(err);
    }
  };

  export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const comparativaId = parseInt(req.params.id);
      const comparativa = await ComparativasService.getById(comparativaId, userId);
      
      if (!comparativa) {
        return res.status(404).json({ error: "Comparativa not found" });
      }
      
      res.json(comparativa);
    } catch (err) {
      next(err);
    }
  };

  export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const comparativa = await ComparativasService.create(req.body, userId);
      res.status(201).json(comparativa);
    } catch (err) {
      next(err);
    }
  };

  export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const comparativaId = parseInt(req.params.id);
      const comparativa = await ComparativasService.update(comparativaId, req.body, userId);
      res.json(comparativa);
    } catch (err) {
      next(err);
    }
  };

  export const deleteComparativa = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const comparativaId = parseInt(req.params.id);
      await ComparativasService.deleteComparativa(comparativaId, userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  export const getRecent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const comparativas = await ComparativasService.getRecent(userId, limit);
      res.json(comparativas);
    } catch (err) {
      next(err);
    }
  };
}