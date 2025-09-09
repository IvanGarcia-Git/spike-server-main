import { NoteFolder } from "../models/note-folder.entity";
import { dataSource } from "../../app-data-source";

const noteFolderRepository = dataSource.getRepository(NoteFolder);

export module NoteFolderService {
  export const getAll = async (userId: number) => {
    return await noteFolderRepository.find({
      where: { userId },
      order: { name: "ASC" }
    });
  };

  export const getById = async (id: number, userId: number) => {
    return await noteFolderRepository.findOne({
      where: { id, userId }
    });
  };

  export const getByFolderId = async (folderId: string, userId: number) => {
    return await noteFolderRepository.findOne({
      where: { folderId, userId }
    });
  };

  export const create = async (data: any, userId: number) => {
    const folder = noteFolderRepository.create({
      ...data,
      userId
    });
    return await noteFolderRepository.save(folder);
  };

  export const update = async (id: number, data: any, userId: number) => {
    const folder = await noteFolderRepository.findOne({
      where: { id, userId }
    });
    
    if (!folder) {
      throw new Error("Folder not found");
    }

    Object.assign(folder, data);
    return await noteFolderRepository.save(folder);
  };

  export const updateByFolderId = async (folderId: string, data: any, userId: number) => {
    const folder = await noteFolderRepository.findOne({
      where: { folderId, userId }
    });
    
    if (!folder) {
      throw new Error("Folder not found");
    }

    Object.assign(folder, data);
    return await noteFolderRepository.save(folder);
  };

  export const deleteFolder = async (id: number, userId: number) => {
    const folder = await noteFolderRepository.findOne({
      where: { id, userId }
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    return await noteFolderRepository.remove(folder);
  };

  export const deleteByFolderId = async (folderId: string, userId: number) => {
    const folder = await noteFolderRepository.findOne({
      where: { folderId, userId }
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    return await noteFolderRepository.remove(folder);
  };

  export const bulkCreate = async (folders: any[], userId: number) => {
    const folderEntities = folders.map(folder => ({
      ...folder,
      userId
    }));
    return await noteFolderRepository.save(folderEntities);
  };

  export const deleteAll = async (userId: number) => {
    return await noteFolderRepository.delete({ userId });
  };
}