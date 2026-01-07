import { dataSource } from "../../app-data-source";
import { Liquidation, LiquidationStatus, LiquidationType } from "../models/liquidation.entity";
import { LiquidationContract } from "../models/liquidation-contract.entity";
import { User } from "../models/user.entity";
import { CreateLiquidationDTO, UpdateLiquidationDTO } from "../dto/liquidation.dto";
import { CommissionAssignment } from "../models/commission-assignment.entity";
import { CommissionTiersService } from "./commission-tiers.service";
import { ValidationService } from "./validation.service";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  DuplicateError,
} from "../errors/app-errors";
import { ErrorMessages } from "../errors/error-messages";
import { EmailService } from "./email.service";

export module LiquidationsService {
  const liquidationRepository = dataSource.getRepository(Liquidation);
  const liquidationContractRepository = dataSource.getRepository(LiquidationContract);
  const commissionAssignmentRepository = dataSource.getRepository(CommissionAssignment);
  const userRepository = dataSource.getRepository(User);

  export const create = async (dto: CreateLiquidationDTO): Promise<Liquidation> => {
    // Validar nombre obligatorio
    ValidationService.notEmpty(dto.name, "name", "Nombre");

    // Validar fecha obligatoria y formato
    ValidationService.required(dto.date, "date", "Fecha");
    ValidationService.dateFormat(dto.date, "date", "Fecha");

    // Validar tipo obligatorio
    if (!dto.type || !Object.values(LiquidationType).includes(dto.type)) {
      throw new ValidationError(ErrorMessages.Liquidation.TYPE_INVALID, {
        field: "type",
        allowedValues: Object.values(LiquidationType),
      });
    }

    // Validar monto si se proporciona
    if (dto.amount !== undefined && dto.amount !== null) {
      ValidationService.nonNegative(dto.amount, "amount", "Monto");
    }

    // Si se proporciona userId, verificar que el usuario exista
    if (dto.userId !== undefined && dto.userId !== null) {
      await ValidationService.userExists(dto.userId, "Liquidación");
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
      const savedLiquidation = await liquidationRepository.save(newLiquidation);

      // Send email notification if user is assigned
      if (savedLiquidation.userId) {
        try {
          const user = await userRepository.findOne({ where: { id: savedLiquidation.userId } });
          if (user?.email) {
            await EmailService.sendLiquidationNotificationEmail(
              user.email,
              user.name + ' ' + user.firstSurname,
              savedLiquidation.name,
              savedLiquidation.amount || 0,
              0, // Contract count will be 0 on creation
              savedLiquidation.status,
              savedLiquidation.uuid
            );
          }
        } catch (emailError) {
          console.error('Error sending liquidation notification email:', emailError);
        }
      }

      return savedLiquidation;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new DuplicateError("Liquidación", "nombre", dto.name);
      }
      throw error;
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
      throw new NotFoundError("Liquidación", uuid);
    }

    // Permission check: Owner or Manager (si no tiene userId asignado, solo managers pueden editar)
    if (liquidation.userId !== null && liquidation.userId !== requestingUserId && !isManager) {
      throw new ForbiddenError("editar esta liquidación", "Solo el propietario o un manager pueden editarla");
    }
    if (liquidation.userId === null && !isManager) {
      throw new ForbiddenError("editar esta liquidación", "Solo los managers pueden editar liquidaciones sin usuario asignado");
    }

    // Validar datos si se proporcionan
    if (dto.name !== undefined) {
      ValidationService.notEmpty(dto.name, "name", "Nombre");
      liquidation.name = dto.name;
    }
    if (dto.date !== undefined) {
      ValidationService.dateFormat(dto.date, "date", "Fecha");
      liquidation.date = dto.date;
    }
    if (dto.type !== undefined) {
      ValidationService.oneOf(
        dto.type,
        Object.values(LiquidationType) as LiquidationType[],
        "type",
        "Tipo"
      );
      liquidation.type = dto.type;
    }
    if (dto.amount !== undefined) {
      ValidationService.nonNegative(dto.amount, "amount", "Monto");
      liquidation.amount = dto.amount;
    }
    if (dto.status !== undefined) liquidation.status = dto.status;

    try {
      const updatedLiquidation = await liquidationRepository.save(liquidation);

      // Send email notification if status changed and user is assigned
      if (dto.status !== undefined && updatedLiquidation.userId) {
        try {
          const user = await userRepository.findOne({ where: { id: updatedLiquidation.userId } });
          if (user?.email) {
            await EmailService.sendLiquidationNotificationEmail(
              user.email,
              user.name + ' ' + user.firstSurname,
              updatedLiquidation.name,
              updatedLiquidation.amount || 0,
              updatedLiquidation.liquidationContracts?.length || 0,
              updatedLiquidation.status,
              updatedLiquidation.uuid
            );
          }
        } catch (emailError) {
          console.error('Error sending liquidation status update email:', emailError);
        }
      }

      return updatedLiquidation;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" && dto.name) {
        throw new DuplicateError("Liquidación", "nombre", dto.name);
      }
      throw error;
    }
  };

  export const remove = async (
    uuid: string,
    requestingUserId: number,
    isManager: boolean
  ): Promise<void> => {
    // Cargar liquidación
    const liquidation = await liquidationRepository.findOne({
      where: { uuid },
    });

    if (!liquidation) {
      throw new NotFoundError("Liquidación", uuid);
    }

    // Permission check: Owner or Manager (si no tiene userId asignado, solo managers pueden eliminar)
    if (liquidation.userId !== null && liquidation.userId !== requestingUserId && !isManager) {
      throw new ForbiddenError("eliminar esta liquidación", "Solo el propietario o un manager pueden eliminarla");
    }
    if (liquidation.userId === null && !isManager) {
      throw new ForbiddenError("eliminar esta liquidación", "Solo los managers pueden eliminar liquidaciones sin usuario asignado");
    }

    // Usar transacción para eliminar primero los contratos asociados y luego la liquidación
    await dataSource.transaction(async (transactionalEntityManager) => {
      // Eliminar todos los liquidationContracts asociados
      await transactionalEntityManager.delete(LiquidationContract, {
        liquidationId: liquidation.id,
      });

      // Eliminar la liquidación
      await transactionalEntityManager.delete(Liquidation, {
        id: liquidation.id,
      });
    });
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
