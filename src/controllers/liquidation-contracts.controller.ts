import { LiquidationContractsService } from "../services/liquidation-contracts.service";
import {
  CreateLiquidationContractDTO,
  UpdateLiquidationContractDTO,
} from "../dto/liquidation-contract.dto";

export module LiquidationContractsController {
  export const create = async (req, res, next) => {
    const dto: CreateLiquidationContractDTO = req.body;
    const { userId: requestingUserId, isManager } = req.user;

    try {
      if (
        !dto.liquidationUuid ||
        !Array.isArray(dto.contractUuids) ||
        dto.contractUuids.length === 0
      ) {
        return res
          .status(400)
          .json({
            message: "liquidationUuid and a non-empty array of contractUuids are required.",
          });
      }

      const createdLinks = await LiquidationContractsService.create(dto, requestingUserId, isManager);
      res.status(201).json(createdLinks);
    } catch (err) {
      next(err);
    }
  };

  export const getByUuid = async (req, res, next) => {
    const { uuid } = req.params;
    try {
      const lc = await LiquidationContractsService.getByUuid(uuid, ["liquidation", "contract"]);
      if (!lc) {
        return res.status(404).json({ message: "LiquidationContract not found" });
      }

      res.json(lc);
    } catch (err) {
      next(err);
    }
  };

  export const update = async (req, res, next) => {
    const { uuid } = req.params;
    const dto: UpdateLiquidationContractDTO = req.body;
    const { userId: requestingUserId, isManager } = req.user;

    try {
      const updatedLc = await LiquidationContractsService.update(
        uuid,
        dto,
        requestingUserId,
        isManager
      );
      res.json(updatedLc);
    } catch (err) {
      next(err);
    }
  };

  export const remove = async (req, res, next) => {
    const { uuid } = req.params;
    const { userId: requestingUserId, isManager } = req.user;

    try {
      await LiquidationContractsService.remove(uuid, requestingUserId, isManager);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  export const listByLiquidation = async (req, res, next) => {
    const { liquidationUuid } = req.params;
    try {
      const lcs = await LiquidationContractsService.findByLiquidationUuid(liquidationUuid);
      res.json(lcs);
    } catch (err) {
      next(err);
    }
  };
}
