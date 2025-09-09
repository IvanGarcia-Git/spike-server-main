import { Request, Response, NextFunction } from "express";
import { NoteService } from "../services/note.service";

export module NoteController {
  export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const notes = await NoteService.getAll(userId);
      res.json(notes);
    } catch (err) {
      next(err);
    }
  };

  export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const noteId = parseInt(req.params.id);
      const note = await NoteService.getById(noteId, userId);
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      res.json(note);
    } catch (err) {
      next(err);
    }
  };

  export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const note = await NoteService.create(req.body, userId);
      res.status(201).json(note);
    } catch (err) {
      next(err);
    }
  };

  export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const noteId = parseInt(req.params.id);
      const note = await NoteService.update(noteId, req.body, userId);
      res.json(note);
    } catch (err) {
      next(err);
    }
  };

  export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const noteId = parseInt(req.params.id);
      await NoteService.deleteNote(noteId, userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  export const bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const notes = await NoteService.bulkCreate(req.body.notes, userId);
      res.status(201).json(notes);
    } catch (err) {
      next(err);
    }
  };

  export const deleteAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      await NoteService.deleteAll(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}