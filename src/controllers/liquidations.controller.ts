import { LiquidationsService } from "../services/liquidations.service";
import { CreateLiquidationDTO, UpdateLiquidationDTO } from "../dto/liquidation.dto";

export module LiquidationsController {
  export const create = async (req, res, next) => {
    const dto: CreateLiquidationDTO = req.body;

    try {
      if (!dto.name || !dto.date || dto.userId === undefined || dto.userId === null) {
        return res.status(400).json({ message: "Name, date, and a valid userId are required." });
      }

      // if (dto.userId !== req.user.id && !req.user.isManager) {
      //   return res.status(403).json({ message: "Not permission" });
      // }

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
