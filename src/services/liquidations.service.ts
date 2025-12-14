import { dataSource } from "../../app-data-source";
import { Liquidation, LiquidationStatus, LiquidationType } from "../models/liquidation.entity";
import { User } from "../models/user.entity";
import { CreateLiquidationDTO, UpdateLiquidationDTO } from "../dto/liquidation.dto";
import { CommissionAssignment } from "../models/commission-assignment.entity";
import { CommissionTiersService } from "./commission-tiers.service";

export module LiquidationsService {
  const liquidationRepository = dataSource.getRepository(Liquidation);
  const commissionAssignmentRepository = dataSource.getRepository(CommissionAssignment);
  const userRepository = dataSource.getRepository(User);

  export const create = async (dto: CreateLiquidationDTO): Promise<Liquidation> => {
    // Validar tipo obligatorio
    if (!dto.type || !Object.values(LiquidationType).includes(dto.type)) {
      throw new Error("El tipo de liquidación es obligatorio (INGRESO o GASTO).");
    }

    // Si se proporciona userId, verificar que el usuario exista
    let targetUser = null;
    if (dto.userId !== undefined && dto.userId !== null) {
      targetUser = await userRepository.findOneBy({ id: dto.userId });
      if (!targetUser) {
        throw new Error(`User with ID ${dto.userId} not found. Cannot create liquidation.`);
      }
    }

    const newLiquidation = liquidationRepository.create({
      name: dto.name,
      date: dto.date,
      status: dto.status || LiquidationStatus.PENDIENTE,
      type: dto.type,
      amount: dto.amount !== undefined ? dto.amount : null,
      userId: dto.userId !== undefined ? dto.userId : null,
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
      // Si hay consumo definido, calcular por tramos
      if (lc.consumo !== null && lc.consumo !== undefined && lc.contract?.rateId) {
        const tierCommission = await CommissionTiersService.calculateCommission(
          lc.contract.rateId,
          lc.consumo,
          lc.isRenewal || false
        );
        (lc as any).assignedCommissionAmount = tierCommission ?? 0;
        (lc as any).calculatedByTier = true;
      }
      // Fallback a CommissionAssignment
      else if (lc.contract && (lc.contract.channelId || lc.contract.rate?.channelId) && lc.contract.rateId && lc.contract.userId) {
        const assignment = await commissionAssignmentRepository.findOne({
          where: {
            channel: { id: (lc.contract.channelId || lc.contract.rate?.channelId) },
            rate: { id: lc.contract.rateId },
            user: { id: lc.contract.userId },
          },
        });

        (lc as any).assignedCommissionAmount = assignment ? assignment.amount : null;
        (lc as any).calculatedByTier = false;
      } else {
        (lc as any).assignedCommissionAmount = null;
        (lc as any).calculatedByTier = false;
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

    // Permission check: Owner or Manager (si no tiene userId asignado, solo managers pueden editar)
    if (liquidation.userId !== null && liquidation.userId !== requestingUserId && !isManager) {
      throw new Error("Not permission");
    }
    if (liquidation.userId === null && !isManager) {
      throw new Error("Not permission");
    }

    if (dto.name !== undefined) liquidation.name = dto.name;
    if (dto.status !== undefined) liquidation.status = dto.status;
    if (dto.date !== undefined) liquidation.date = dto.date;
    if (dto.type !== undefined) liquidation.type = dto.type;
    if (dto.amount !== undefined) liquidation.amount = dto.amount;

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

    // Permission check: Owner or Manager (si no tiene userId asignado, solo managers pueden eliminar)
    if (liquidation.userId !== null && liquidation.userId !== requestingUserId && !isManager) {
      throw new Error("Not permission");
    }
    if (liquidation.userId === null && !isManager) {
      throw new Error("Not permission");
    }

    await liquidationRepository.remove(liquidation);
  };

  const calculateAndAssignTotalCommission = async (liquidation: Liquidation): Promise<void> => {
    let totalCommission = 0;
    if (liquidation.liquidationContracts && liquidation.liquidationContracts.length > 0) {
      for (const lc of liquidation.liquidationContracts) {
        let effectiveCommission = 0;

        // 1. Si hay override manual, usarlo directamente
        if (lc.overrideCommission !== null && lc.overrideCommission !== undefined) {
          effectiveCommission = parseFloat(String(lc.overrideCommission));
        }
        // 2. Si hay consumo definido, calcular por tramos
        else if (lc.consumo !== null && lc.consumo !== undefined && lc.contract?.rateId) {
          const tierCommission = await CommissionTiersService.calculateCommission(
            lc.contract.rateId,
            lc.consumo,
            lc.isRenewal || false
          );
          effectiveCommission = tierCommission ?? 0;
        }
        // 3. Fallback: usar CommissionAssignment existente
        else if (
          lc.contract &&
          (lc.contract.channelId || lc.contract.rate?.channelId) &&
          lc.contract.rateId &&
          lc.contract.userId
        ) {
          const assignment = await commissionAssignmentRepository.findOne({
            where: {
              channel: { id: lc.contract.channelId || lc.contract.rate?.channelId },
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
