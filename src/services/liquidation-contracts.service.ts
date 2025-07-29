import { dataSource } from "../../app-data-source";
import { LiquidationContract } from "../models/liquidation-contract.entity";
import { Liquidation } from "../models/liquidation.entity";
import { Contract } from "../models/contract.entity";
import {
  CreateLiquidationContractDTO,
  UpdateLiquidationContractDTO,
} from "../dto/liquidation-contract.dto";
import { In } from "typeorm";

export module LiquidationContractsService {
  const lcRepository = dataSource.getRepository(LiquidationContract);
  const liquidationRepository = dataSource.getRepository(Liquidation);
  const contractRepository = dataSource.getRepository(Contract);

  export const create = async (
    dto: CreateLiquidationContractDTO,
    requestingUserId: number,
    isManager: boolean
  ): Promise<LiquidationContract[]> => {
    const liquidation = await liquidationRepository.findOneBy({ uuid: dto.liquidationUuid });
    if (!liquidation) {
      throw new Error("Parent liquidation not found");
    }

    if (liquidation.userId !== requestingUserId && !isManager) {
      throw new Error("Not permission on parent liquidation");
    }

    if (!dto.contractUuids || dto.contractUuids.length === 0) {
      throw new Error("At least one contractUuid must be provided.");
    }

    const contractsToLink = await contractRepository.find({
      where: { uuid: In(dto.contractUuids) },
    });

    // 2. Check if all provided UUIDs were found
    if (contractsToLink.length !== dto.contractUuids.length) {
      const foundUuids = contractsToLink.map(c => c.uuid);
      const notFoundUuids = dto.contractUuids.filter(uuid => !foundUuids.includes(uuid));
      throw new Error(`Contracts not found for UUIDs: ${notFoundUuids.join(', ')}`);
    }

    // 3. Check for existing links for these contracts with this liquidation
    const existingLinks = await lcRepository.find({
      where: {
        liquidationId: liquidation.id,
        contractId: In(contractsToLink.map(c => c.id)),
      },
    });

    const newLiquidationContracts: LiquidationContract[] = [];
    const errors: string[] = [];

    for (const contract of contractsToLink) {
      const isAlreadyLinked = existingLinks.some(link => link.contractId === contract.id);
      if (isAlreadyLinked) {
        // Throw an error if any are already linked
        throw new Error(`Contract ${contract.uuid} (ID: ${contract.id}) is already linked to liquidation ${liquidation.uuid} (ID: ${liquidation.id}).`);
      }

      const newLc = lcRepository.create({
        liquidationId: liquidation.id,
        contractId: contract.id,
        overrideCommission: dto.overrideCommission,
      });
      newLiquidationContracts.push(newLc);
    }

    if (newLiquidationContracts.length === 0) {
        throw new Error("No new contract links were created. This could be due to all contracts already being linked or an internal error.");
    }

    // 4. Save
    try {
      const savedLinks = await lcRepository.save(newLiquidationContracts);
      return savedLinks;
    } catch (dbError) {
        console.error("Database error while saving liquidation contracts:", dbError);
        throw new Error("Failed to save contract links to the database.");
    }
  };

  export const getByUuid = async (
    uuid: string,
    relations: string[] = []
  ): Promise<LiquidationContract | null> => {
    return lcRepository.findOne({ where: { uuid }, relations });
  };

  export const update = async (
    uuid: string,
    dto: UpdateLiquidationContractDTO,
    requestingUserId: number,
    isManager: boolean
  ): Promise<LiquidationContract> => {
    const lc = await getByUuid(uuid, ["liquidation"]);
    if (!lc) {
      throw new Error("Liquidation contract not found");
    }
    if (!lc.liquidation) {
      throw new Error("Parent liquidation data missing");
    }

    // Permission check on parent liquidation
    if (lc.liquidation.userId !== requestingUserId && !isManager) {
      throw new Error("Not permission on parent liquidation");
    }

    // Only overrideCommission is updatable
    if (dto.overrideCommission !== undefined) {
      lc.overrideCommission = dto.overrideCommission;
    }

    return lcRepository.save(lc);
  };

  export const remove = async (
    uuid: string,
    requestingUserId: number,
    isManager: boolean
  ): Promise<void> => {
    const lc = await getByUuid(uuid, ["liquidation"]);
    if (!lc) {
      throw new Error("Liquidation contract not found");
    }
    if (!lc.liquidation) {
      throw new Error("Parent liquidation data missing");
    }

    // Permission check on parent liquidation
    if (lc.liquidation.userId !== requestingUserId && !isManager) {
      throw new Error("Not permission on parent liquidation");
    }

    await lcRepository.remove(lc);
  };

  export const findByLiquidationUuid = async (
    liquidationUuid: string
  ): Promise<LiquidationContract[]> => {
    const liquidation = await liquidationRepository.findOneBy({ uuid: liquidationUuid });
    if (!liquidation) {
      throw new Error("Parent liquidation not found");
    }
    return lcRepository.find({
      where: { liquidationId: liquidation.id },
      relations: ["contract", "contract.rate", "contract.channel", "contract.company"],
    });
  };
}
