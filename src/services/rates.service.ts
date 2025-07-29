import { Rate } from "../models/rate.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere, In } from "typeorm";

export module RatesService {
  export const create = async (rateData: Partial<Rate>): Promise<Rate> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      const newRate = rateRepository.create(rateData);

      return await rateRepository.save(newRate);
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<Rate>,
    relations: FindOptionsRelations<Rate> = {}
  ): Promise<Rate> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      const rateFound = await rateRepository.findOne({
        where,
        relations,
      });

      if (!rateFound) {
        throw new Error("rate-not-found");
      }

      return rateFound;
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<Rate>,
    relations: FindOptionsRelations<Rate> = {}
  ): Promise<Rate[]> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      return await rateRepository.find({
        where,
        relations,
      });
    } catch (error) {
      throw error;
    }
  };

  export const getManyGroupedByCompanyName = async (
    where: FindOptionsWhere<Rate>,
    relations: FindOptionsRelations<Rate> = {}
  ): Promise<{ [companyName: string]: Rate[] }> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      const rates = await rateRepository.find({
        where,
        relations,
      });

      const groupedRates = rates.reduce((acc, rate) => {
        const companyName = rate.company?.name || "Unknown";
        if (!acc[companyName]) {
          acc[companyName] = [];
        }
        acc[companyName].push(rate);
        return acc;
      }, {});

      return groupedRates;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    id: number,
    rateData: Partial<Rate>
  ): Promise<Rate> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      const rate = await rateRepository.findOne({ where: { id } });

      if (!rate) {
        throw new Error("rate-not-found");
      }

      Object.assign(rate, rateData);

      const updatedRate = await rateRepository.save(rate);

      return updatedRate;
    } catch (error) {
      throw error;
    }
  };

  export const updateChannelForRates = async (
    rateIds: number[],
    channelId: number
  ): Promise<Rate[]> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      const rates = await rateRepository.find({ where: { id: In(rateIds) } });

      if (rates.length === 0) {
        throw new Error("rates-not-found");
      }

      rates.forEach((rate) => {
        rate.channelId = channelId;
      });

      const updatedRates = await rateRepository.save(rates);

      return updatedRates;
    } catch (error) {
      throw error;
    }
  };

  export const deleteRate = async (id: number): Promise<boolean> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      const rate = await rateRepository.findOne({ where: { id } });

      if (!rate) {
        throw new Error("rate-not-found");
      }

      await rateRepository.remove(rate);

      return true;
    } catch (error) {
      throw error;
    }
  };
}
