import { Roles } from "../enums/roles.enum";
import { ContractStatesService } from "../services/contract-states.service";

export module ContractStatesController {
  const SUPER_ADMIN_GROUP_ID = 1;
  export const create = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const contractStateData = req.body;

      const contractState = await ContractStatesService.create(
        contractStateData
      );
      res.json(contractState);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const { id } = req.params;
      const contractState = await ContractStatesService.get({
        id: Number(id),
      });
      res.json(contractState);
    } catch (error) {
      next(error);
    }
  };

  export const getAll = async (req, res, next) => {
    try {
      const contractStates = await ContractStatesService.getAll();

      res.json(contractStates);
    } catch (error) {
      next(error);
    }
  };

  export const deleteContractState = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const { id } = req.params;

      const deleted = await ContractStatesService.deleteContractState(
        Number(id)
      );
      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const { id } = req.params;
      const stateBody = req.body;

      const updated = await ContractStatesService.updateDefault(id, stateBody);
      res.json({ updated });
    } catch (error) {
      next(error);
    }
  };
}
