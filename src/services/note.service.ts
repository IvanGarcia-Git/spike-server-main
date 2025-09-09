import { Note } from "../models/note.entity";
import { dataSource } from "../../app-data-source";

const noteRepository = dataSource.getRepository(Note);

export module NoteService {
  export const getAll = async (userId: number) => {
    return await noteRepository.find({
      where: { userId },
      order: { updatedAt: "DESC" }
    });
  };

  export const getById = async (id: number, userId: number) => {
    return await noteRepository.findOne({
      where: { id, userId }
    });
  };

  export const create = async (data: any, userId: number) => {
    const note = noteRepository.create({
      ...data,
      userId
    });
    return await noteRepository.save(note);
  };

  export const update = async (id: number, data: any, userId: number) => {
    const note = await noteRepository.findOne({
      where: { id, userId }
    });
    
    if (!note) {
      throw new Error("Note not found");
    }

    Object.assign(note, data);
    return await noteRepository.save(note);
  };

  export const deleteNote = async (id: number, userId: number) => {
    const note = await noteRepository.findOne({
      where: { id, userId }
    });

    if (!note) {
      throw new Error("Note not found");
    }

    return await noteRepository.remove(note);
  };

  export const bulkCreate = async (notes: any[], userId: number) => {
    const noteEntities = notes.map(note => ({
      ...note,
      userId
    }));
    return await noteRepository.save(noteEntities);
  };

  export const deleteAll = async (userId: number) => {
    return await noteRepository.delete({ userId });
  };
}