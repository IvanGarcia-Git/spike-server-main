import { Comparativa } from "../models/comparativa.entity";
import { dataSource } from "../../app-data-source";

const comparativaRepository = dataSource.getRepository(Comparativa);

export module ComparativasService {
  export const getAll = async (userId: number) => {
    return await comparativaRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      relations: ["user"]
    });
  };

  export const getById = async (id: number, userId: number) => {
    return await comparativaRepository.findOne({
      where: { id, userId },
      relations: ["user"]
    });
  };

  export const create = async (data: any, userId: number) => {
    const comparativa = comparativaRepository.create({
      ...data,
      userId
    });
    return await comparativaRepository.save(comparativa);
  };

  export const update = async (id: number, data: any, userId: number) => {
    const comparativa = await comparativaRepository.findOne({
      where: { id, userId }
    });
    
    if (!comparativa) {
      throw new Error("Comparativa not found");
    }

    Object.assign(comparativa, data);
    return await comparativaRepository.save(comparativa);
  };

  export const deleteComparativa = async (id: number, userId: number) => {
    const comparativa = await comparativaRepository.findOne({
      where: { id, userId }
    });

    if (!comparativa) {
      throw new Error("Comparativa not found");
    }

    return await comparativaRepository.remove(comparativa);
  };

  export const getRecent = async (userId: number, limit: number = 10) => {
    return await comparativaRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      relations: ["user"]
    });
  };
}