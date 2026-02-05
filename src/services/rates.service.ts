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

  /**
   * Obtiene tarifas agrupadas por nombre de compañía, con soporte mejorado
   * para buscar por serviceType de la tarifa O por tipo de compañía
   */
  export const getManyGroupedByCompanyNameWithFallback = async (
    serviceType: string | undefined,
    relations: FindOptionsRelations<Rate> = {}
  ): Promise<{ [companyName: string]: Rate[] }> => {
    try {
      const rateRepository = dataSource.getRepository(Rate);

      let rates: Rate[];

      if (serviceType) {
        // Primero buscar tarifas con serviceType explícito
        rates = await rateRepository.find({
          where: { serviceType: serviceType as any },
          relations,
        });

        // Si no hay resultados, buscar tarifas de compañías del tipo correspondiente
        // que no tengan serviceType configurado
        if (rates.length === 0) {
          // Buscar todas las tarifas con su compañía
          const allRates = await rateRepository.find({
            relations: { ...relations, company: true },
          });

          // Filtrar por tipo de compañía
          rates = allRates.filter(
            (rate) => rate.company?.type === serviceType && !rate.serviceType
          );
        }
      } else {
        rates = await rateRepository.find({
          relations,
        });
      }

      const groupedRates = rates.reduce((acc, rate) => {
        const companyName = rate.company?.name || "Unknown";
        if (!acc[companyName]) {
          acc[companyName] = [];
        }
        acc[companyName].push(rate);
        return acc;
      }, {} as { [companyName: string]: Rate[] });

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
