import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { FilesService } from "./files.service";
import { Folder } from "../models/folder.entity";

export module FoldersService {
  export const create = async (
    folderData: Partial<Folder>
  ): Promise<Folder> => {
    try {
      const folderRepository = dataSource.getRepository(Folder);

      const newFolder = folderRepository.create(folderData);

      return await folderRepository.save(newFolder);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<Folder>,
    relations: FindOptionsRelations<Folder> = {}
  ): Promise<Folder[]> => {
    try {
      const folderRepository = dataSource.getRepository(Folder);

      return await folderRepository.find({
        where,
        relations,
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw error;
    }
  };

  export const getRecent = async (userId: number): Promise<Folder[]> => {
    try {
      const folderRepository = dataSource.getRepository(Folder);

      const folders = await folderRepository.find({
        where: [{ ownerUserId: userId, type: "private" }, { type: "shared" }],
        order: { updatedAt: "DESC" },
        take: 10,
      });

      return folders;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    uuid: string,
    folderData: Partial<Folder>
  ): Promise<Folder> => {
    try {
      const folderRepository = dataSource.getRepository(Folder);

      const folderToUpdate = await folderRepository.findOne({
        where: { uuid },
      });

      if (!folderToUpdate) {
        throw new Error("Folder not found");
      }

      Object.assign(folderToUpdate, folderData);

      return await folderRepository.save(folderToUpdate);
    } catch (error) {
      throw error;
    }
  };

  export const remove = async (uuid: string): Promise<boolean> => {
    try {
      const folderRepository = dataSource.getRepository(Folder);

      const folderToDelete = await folderRepository.findOne({
        where: { uuid },
        relations: { files: true, subfolders: true },
      });

      if (!folderToDelete) {
        throw new Error("Folder not found");
      }

      if (folderToDelete.locked) {
        throw new Error("Can not delete a locked folder");
      }

      await FilesService.remove({ folderId: folderToDelete.id });

      for (const subfolder of folderToDelete.subfolders) {
        await remove(subfolder.uuid);
      }

      await folderRepository.delete({ uuid });

      return true;
    } catch (error) {
      throw error;
    }
  };
}
