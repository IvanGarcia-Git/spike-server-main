import { dataSource } from "../../app-data-source";
import { Origin } from "../models/origin.entity";

export module OriginsService {
  export const create = async (
    originData: Partial<Origin>
  ): Promise<Origin> => {
    try {
      const originRepository = dataSource.getRepository(Origin);

      const newOrigin = originRepository.create(originData);
      return await originRepository.save(newOrigin);
    } catch (error) {
      throw new Error(`Error creating origin: ${error.message}`);
    }
  };

  export const getAll = async (): Promise<Origin[]> => {
    try {
      const originRepository = dataSource.getRepository(Origin);

      return await originRepository.find();
    } catch (error) {
      throw new Error(`Error getting origins: ${error.message}`);
    }
  };

  export const getById = async (id: number): Promise<Origin | null> => {
    try {
      const originRepository = dataSource.getRepository(Origin);

      return await originRepository.findOneBy({ id });
    } catch (error) {
      throw new Error(`Error getting origin with ID ${id}: ${error.message}`);
    }
  };

  export const remove = async (id: number): Promise<boolean> => {
    try {
      const originRepository = dataSource.getRepository(Origin);

      const result = await originRepository.delete(id);
      if (result.affected === 0) {
        throw new Error("Origin not found");
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting origin with ID ${id}: ${error.message}`);
    }
  };
}
