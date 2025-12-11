import { LiquidationsService } from "../services/liquidations.service";
import { CreateLiquidationDTO, UpdateLiquidationDTO } from "../dto/liquidation.dto";
import { LiquidationType } from "../models/liquidation.entity";

export module LiquidationsController {
  export const create = async (req, res, next) => {
    const dto: CreateLiquidationDTO = req.body;

    try {
      // Validaciones básicas
      if (!dto.name || !dto.name.trim()) {
        return res.status(400).json({ message: "El nombre de la liquidación es obligatorio." });
      }

      if (!dto.date) {
        return res.status(400).json({ message: "La fecha es obligatoria." });
      }

      // Validar formato de fecha YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dto.date)) {
        return res.status(400).json({ message: "La fecha debe tener formato YYYY-MM-DD." });
      }

      // Validar tipo obligatorio
      if (!dto.type || !Object.values(LiquidationType).includes(dto.type)) {
        return res.status(400).json({ message: "El tipo de liquidación es obligatorio (INGRESO o GASTO)." });
      }

      // userId ahora es opcional (puede ser null o undefined)
      const liquidation = await LiquidationsService.create(dto);
      res.status(201).json(liquidation);
    } catch (err) {
      console.error(`Error in LiquidationsController.create: ${err.message}`, err.stack);
      next(err);
    }
  };

  export const getByUuid = async (req, res, next) => {
    const { uuid } = req.params;
    try {
      const liquidation = await LiquidationsService.getByUuid(uuid, {
        user: true,
        liquidationContracts: {
          contract: {
            user: true,
            rate: true,
            customer: true,
            company: true,
            channel: true,
            contractState: true,
          },
        },
      });
      if (!liquidation) {
        return res.status(404).json({ message: "Liquidation not found" });
      }

      res.json(liquidation);
    } catch (err) {
      next(err);
    }
  };

  export const update = async (req, res, next) => {
    const { uuid } = req.params;
    const dto: UpdateLiquidationDTO = req.body;
    const { userId: requestingUserId, isManager } = req.user;

    try {
      const updatedLiquidation = await LiquidationsService.update(
        uuid,
        dto,
        requestingUserId,
        isManager
      );
      res.json(updatedLiquidation);
    } catch (err) {
      next(err);
    }
  };

  export const remove = async (req, res, next) => {
    const { uuid } = req.params;
    const { userId: requestingUserId, isManager } = req.user;

    try {
      await LiquidationsService.remove(uuid, requestingUserId, isManager);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  export const listUserLiquidations = async (req, res, next) => {
    const { userId, isManager } = req.user;
    try {
      let liquidations;
      if (isManager) {
        liquidations = await LiquidationsService.findAll();
      } else {
        liquidations = await LiquidationsService.findByUser(userId);
      }
      res.json(liquidations);
    } catch (err) {
      next(err);
    }
  };
}
