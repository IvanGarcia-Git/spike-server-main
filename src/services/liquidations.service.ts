import { dataSource } from "../../app-data-source";
import { Liquidation, LiquidationStatus } from "../models/liquidation.entity";
import { User } from "../models/user.entity";
import { CreateLiquidationDTO, UpdateLiquidationDTO } from "../dto/liquidation.dto";
import { CommissionAssignment } from "../models/commission-assignment.entity";

export module LiquidationsService {
  const liquidationRepository = dataSource.getRepository(Liquidation);
  const commissionAssignmentRepository = dataSource.getRepository(CommissionAssignment);
  const userRepository = dataSource.getRepository(User);

  export const create = async (dto: CreateLiquidationDTO): Promise<Liquidation> => {
    const targetUser = await userRepository.findOneBy({ id: dto.userId });
    if (!targetUser) {
      throw new Error(`User with ID ${dto.userId} not found. Cannot create liquidation.`);
    }

    const newLiquidation = liquidationRepository.create({
      name: dto.name,
      date: dto.date,
      status: dto.status || LiquidationStatus.PENDIENTE,
      userId: dto.userId,
    });

    try {
      return await liquidationRepository.save(newLiquidation);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("A liquidation with this name or other unique constraint already exists.");
      }
      console.error("Error saving liquidation:", error);
      throw new Error("Failed to save liquidation to the database.");
    }
  };

  export const getByUuid = async (
    uuid: string,
    relationsConfig: {
      user?: boolean;
      liquidationContracts?:
        | boolean
        | {
            contract?:
              | boolean
              | {
                  user?: boolean;
                  rate?: boolean;
                  customer?: boolean;
                  company?: boolean;
                  channel?: boolean;
                  contractState?: boolean;
                };
          };
    } = {}
  ): Promise<Liquidation | null> => {
    const relationsToLoad: string[] = [];

    if (relationsConfig.user) {
      relationsToLoad.push("user");
    }
    if (relationsConfig.liquidationContracts) {
      relationsToLoad.push("liquidationContracts");

      if (
        typeof relationsConfig.liquidationContracts === "object" &&
        relationsConfig.liquidationContracts.contract
      ) {
        relationsToLoad.push("liquidationContracts.contract");

        if (typeof relationsConfig.liquidationContracts.contract === "object") {
          const contractRelations = relationsConfig.liquidationContracts.contract;
          if (contractRelations.user) relationsToLoad.push("liquidationContracts.contract.user");
          if (contractRelations.rate) relationsToLoad.push("liquidationContracts.contract.rate");
          if (contractRelations.customer)
            relationsToLoad.push("liquidationContracts.contract.customer");
          if (contractRelations.company)
            relationsToLoad.push("liquidationContracts.contract.company");
          if (contractRelations.channel)
            relationsToLoad.push("liquidationContracts.contract.channel");
          if (contractRelations.contractState)
            relationsToLoad.push("liquidationContracts.contract.contractState");
        }
      }
    }

    const liquidation = await liquidationRepository.findOne({
      where: { uuid },
      relations: relationsToLoad,
    });

    if (!liquidation || !liquidation.liquidationContracts) {
      return liquidation;
    }

    for (const lc of liquidation.liquidationContracts) {
      if (lc.contract && (lc.contract.channelId || lc.contract.rate.channelId) && lc.contract.rateId && lc.contract.userId) {
        const assignment = await commissionAssignmentRepository.findOne({
          where: {
            channel: { id: (lc.contract.channelId || lc.contract.rate.channelId) },
            rate: { id: lc.contract.rateId },
            user: { id: lc.contract.userId },
          },
        });

        (lc as any).assignedCommissionAmount = assignment ? assignment.amount : null;
      } else {
        (lc as any).assignedCommissionAmount = null;
      }
    }

    return liquidation;
  };

  export const update = async (
    uuid: string,
    dto: UpdateLiquidationDTO,
    requestingUserId: number,
    isManager: boolean
  ): Promise<Liquidation> => {
    const liquidation = await getByUuid(uuid);
    if (!liquidation) {
      throw new Error("Liquidation not found");
    }

    // Permission check: Owner or Manager
    if (liquidation.userId !== requestingUserId && !isManager) {
      throw new Error("Not permission");
    }

    if (dto.name !== undefined) liquidation.name = dto.name;
    if (dto.status !== undefined) liquidation.status = dto.status;
    if (dto.date !== undefined) liquidation.date = dto.date;

    try {
      return await liquidationRepository.save(liquidation);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" && dto.name) {
        throw new Error("Duplicate liquidation name");
      }
      throw error;
    }
  };

  export const remove = async (
    uuid: string,
    requestingUserId: number,
    isManager: boolean
  ): Promise<void> => {
    const liquidation = await getByUuid(uuid);
    if (!liquidation) {
      throw new Error("Liquidation not found");
    }

    // Permission check: Owner or Manager
    if (liquidation.userId !== requestingUserId && !isManager) {
      throw new Error("Not permission");
    }

    await liquidationRepository.remove(liquidation);
  };

  const calculateAndAssignTotalCommission = async (liquidation: Liquidation): Promise<void> => {
    let totalCommission = 0;
    if (liquidation.liquidationContracts && liquidation.liquidationContracts.length > 0) {
      for (const lc of liquidation.liquidationContracts) {
        let effectiveCommission = 0;
        if (lc.overrideCommission !== null && lc.overrideCommission !== undefined) {
          effectiveCommission = parseFloat(String(lc.overrideCommission));
        } else if (
          lc.contract &&
          (lc.contract.channelId || lc.contract.rate.channelId)&&
          lc.contract.rateId &&
          lc.contract.userId
        ) {
          const assignment = await commissionAssignmentRepository.findOne({
            where: {
              channel: { id: lc.contract.channelId },
              rate: { id: lc.contract.rateId },
              user: { id: lc.contract.userId },
            },
          });
          if (assignment) {
            effectiveCommission = parseFloat(String(assignment.amount));
          }
        }
        totalCommission += effectiveCommission;
      }
    }
    (liquidation as any).totalCommission = totalCommission;
  };

  const relationsForList: string[] = [
    "user",
    "liquidationContracts",
    "liquidationContracts.contract",
    "liquidationContracts.contract.channel",
    "liquidationContracts.contract.rate",
    "liquidationContracts.contract.user",
  ];

  export const findByUser = async (userId: number): Promise<Liquidation[]> => {
    const liquidations = await liquidationRepository.find({
      where: { userId },
      relations: relationsForList,
      order: { date: "DESC", name: "ASC" },
    });

    for (const liquidation of liquidations) {
      await calculateAndAssignTotalCommission(liquidation);
    }
    return liquidations;
  };

  export const findAll = async (): Promise<Liquidation[]> => {
    const liquidations = await liquidationRepository.find({
      relations: relationsForList,
      order: { date: "DESC", name: "ASC" },
    });

    for (const liquidation of liquidations) {
      await calculateAndAssignTotalCommission(liquidation);
    }
    return liquidations;
  };
}
