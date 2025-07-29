import { dataSource } from "../../app-data-source";
import { Payroll } from "../models/payroll.entity";
import { FindOptionsRelations, FindOptionsWhere, Between } from "typeorm";

export module PayrollsService {
  export const create = async (
    dto: Omit<Payroll, "id" | "uuid" | "createdAt" | "updatedAt" | "user">
  ): Promise<Payroll> => {
    try {
      const newPayroll = dataSource.getRepository(Payroll).create(dto);
      return await dataSource.getRepository(Payroll).save(newPayroll);
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<Payroll>,
    relations: FindOptionsRelations<Payroll> = {}
  ): Promise<Payroll> => {
    try {
      return await dataSource.getRepository(Payroll).findOneOrFail({
        where,
        relations,
      });
    } catch {
      throw new Error("payroll-not-found");
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<Payroll> = {},
    relations: FindOptionsRelations<Payroll> = {}
  ): Promise<Payroll[]> =>
    dataSource.getRepository(Payroll).find({ where, relations });

  export const getByUuid = async (
    uuid: string,
    relations: FindOptionsRelations<Payroll> = {}
  ): Promise<Payroll> => {
    try {
      return await dataSource.getRepository(Payroll).findOneOrFail({
        where: { uuid },
        relations,
      });
    } catch {
      throw new Error("payroll-not-found");
    }
  };

  export const getForUserBetween = async (
    userId: number,
    from: string,
    to: string,
    relations: FindOptionsRelations<Payroll> = {}
  ): Promise<Payroll[]> =>
    dataSource.getRepository(Payroll).find({
      where: {
        userId,
        date: Between(from, to),
      },
      relations,
    });

  export const update = async (
    uuid: string,
    data: Partial<Payroll>
  ): Promise<Payroll> => {
    try {
      const payroll = await get({ uuid });
      if (!payroll) throw new Error("Payroll not found");
      Object.assign(payroll, data);
      return await dataSource.getRepository(Payroll).save(payroll);
    } catch (error) {
      throw error;
    }
  };

  export const remove = async (uuid: string): Promise<boolean> => {
    try {
      const payroll = await get({ uuid });
      await dataSource.getRepository(Payroll).remove(payroll);
      return true;
    } catch (error) {
      throw error;
    }
  };
}
