import { dataSource } from "../../app-data-source";
import { Comparativa } from "../models/comparativa.entity";
import { User } from "../models/user.entity";

const comparativaRepository = dataSource.getRepository(Comparativa);
const userRepository = dataSource.getRepository(User);

export module ComparativaService {
  export const create = async (data: any, userId: number) => {
    try {
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      const comparativa = comparativaRepository.create({
        ...data,
        userId,
        user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await comparativaRepository.save(comparativa);
    } catch (error) {
      throw error;
    }
  };

  // Listado paginado de comparativas (Comparativas 5). Devuelve { data, total, page, limit }
  // para que el frontend pueda calcular el número de páginas. Orden: más recientes primero.
  export const findAll = async (
    userId?: number,
    page: number = 1,
    limit: number = 5
  ) => {
    try {
      const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
      const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

      const queryBuilder = comparativaRepository.createQueryBuilder("comparativa");
      queryBuilder.leftJoinAndSelect("comparativa.user", "user");

      if (userId) {
        queryBuilder.where("comparativa.userId = :userId", { userId });
      }

      queryBuilder.orderBy("comparativa.createdAt", "DESC");
      queryBuilder.skip((safePage - 1) * safeLimit).take(safeLimit);

      const [data, total] = await queryBuilder.getManyAndCount();

      return { data, total, page: safePage, limit: safeLimit };
    } catch (error) {
      throw error;
    }
  };

  export const findRecent = async (limit: number = 10, userId?: number) => {
    try {
      const queryBuilder = comparativaRepository.createQueryBuilder("comparativa");
      queryBuilder.leftJoinAndSelect("comparativa.user", "user");
      
      if (userId) {
        queryBuilder.where("comparativa.userId = :userId", { userId });
      }
      
      queryBuilder.orderBy("comparativa.createdAt", "DESC");
      queryBuilder.limit(limit);
      
      return await queryBuilder.getMany();
    } catch (error) {
      throw error;
    }
  };

  export const findById = async (id: number) => {
    try {
      const comparativa = await comparativaRepository.findOne({
        where: { id },
        relations: ["user"],
      });

      if (!comparativa) {
        throw new Error("Comparativa not found");
      }

      return comparativa;
    } catch (error) {
      throw error;
    }
  };

  export const findByUuid = async (uuid: string) => {
    try {
      const comparativa = await comparativaRepository.findOne({
        where: { uuid },
        relations: ["user"],
      });

      if (!comparativa) {
        throw new Error("Comparativa not found");
      }

      return comparativa;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (id: number, data: any) => {
    try {
      const comparativa = await comparativaRepository.findOne({ where: { id } });
      
      if (!comparativa) {
        throw new Error("Comparativa not found");
      }

      Object.assign(comparativa, data);
      comparativa.updatedAt = new Date();

      return await comparativaRepository.save(comparativa);
    } catch (error) {
      throw error;
    }
  };

  export const deleteById = async (id: number) => {
    try {
      const comparativa = await comparativaRepository.findOne({ where: { id } });
      
      if (!comparativa) {
        throw new Error("Comparativa not found");
      }

      await comparativaRepository.remove(comparativa);
      
      return { message: "Comparativa deleted successfully" };
    } catch (error) {
      throw error;
    }
  };

  export const deleteByUuid = async (uuid: string) => {
    try {
      const comparativa = await comparativaRepository.findOne({ where: { uuid } });
      
      if (!comparativa) {
        throw new Error("Comparativa not found");
      }

      await comparativaRepository.remove(comparativa);
      
      return { message: "Comparativa deleted successfully" };
    } catch (error) {
      throw error;
    }
  };
}