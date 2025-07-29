import { ContractState } from "../models/contract-state.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsWhere } from "typeorm";

export module ContractStatesService {
  export const create = async (
    contractStateData: Partial<ContractState>
  ): Promise<ContractState> => {
    try {
      const contractStateRepository = dataSource.getRepository(ContractState);

      const newContractState =
        contractStateRepository.create(contractStateData);

      return await contractStateRepository.save(newContractState);
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<ContractState>
  ): Promise<ContractState> => {
    try {
      const contractStateRepository = dataSource.getRepository(ContractState);

      const contractStateFound = await contractStateRepository.findOne({
        where,
      });

      if (!contractStateFound) {
        throw new Error("contract-state-not-found");
      }

      return contractStateFound;
    } catch (error) {
      throw error;
    }
  };

  export const updateDefault = async (
    id: number,
    stateBody: Partial<ContractState>
  ): Promise<ContractState> => {
    try {
      const contractStateRepository = dataSource.getRepository(ContractState);

      const defaultStateFound = await contractStateRepository.findOne({
        where: { id },
      });

      if (!defaultStateFound) {
        throw new Error("contract-state-not-found");
      }

      await contractStateRepository.update(
        { default: true },
        { default: false }
      );

      Object.assign(defaultStateFound, stateBody);

      const updatedState = await contractStateRepository.save(
        defaultStateFound
      );

      return updatedState;
    } catch (error) {
      throw error;
    }
  };

  export const getAll = async (): Promise<ContractState[]> => {
    try {
      const contractStateRepository = dataSource.getRepository(ContractState);

      return await contractStateRepository.find();
    } catch (error) {
      throw error;
    }
  };

  export const deleteContractState = async (id: number): Promise<boolean> => {
    try {
      const contractStateRepository = dataSource.getRepository(ContractState);

      const contractStateFound = await contractStateRepository.findOne({
        where: { id },
      });

      if (!contractStateFound) {
        throw new Error("contract-state-not-found");
      }

      await contractStateRepository.remove(contractStateFound);

      return true;
    } catch (error) {
      throw error;
    }
  };
}
