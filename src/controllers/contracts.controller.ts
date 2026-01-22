import { ContractsService } from "../services/contracts.service";
import { AwsHelper } from "../helpers/aws.helper";

export module ContractsController {
  const SUPER_ADMIN_GROUP_ID = 1;
  export const count = async (req, res, next) => {
    try {
      const count = await ContractsService.count();
      res.json({ count });
    } catch (error) {
      next(error);
    }
  };

  export const create = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const contractData = req.body;

      const newContract = await ContractsService.create({
        ...contractData,
        userId,
      });

      res.status(201).json(newContract);
    } catch (error) {
      next(error);
    }
  };

  //TODO: Ensure user permission to see
  export const get = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const contract = await ContractsService.getOne({ uuid }, { comments: { user: true } });

      if (contract.comments.length > 0) {
        for (const comment of contract.comments) {
          if (comment?.documentUri) {
            comment.documentUri = AwsHelper.getPresignedUrl(
              comment.documentUri
            );
          }
        }
      }

      res.json(contract);
    } catch (error) {
      next(error);
    }
  };

  export const getVisibleContracts = async (req, res, next) => {
    try {
      const { userId, isManager, groupId } = req.user;

      const { page = 1, limit = 10, liquidacion } = req.query;

      const contracts = await ContractsService.getVisibleContracts(
        userId,
        isManager,
        groupId,
        { page: Number(page), limit: Number(limit) },
        {
          user: true,
          rate: { channel: true },
          channel: true,
          company: true,
          customer: true,
          contractState: true,
          telephonyData: { rates: true },
        },
        liquidacion as string | undefined
      );

      res.json(contracts);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { isManager, userId: updatedByUserId, groupId } = req.user;
      const { uuid } = req.params;
      const contractData = req.body;

      const contract = await ContractsService.getOne({ uuid });

      // Solo Supervisores (isManager) o Admin (groupId === 1) pueden actualizar contratos no borrador
      const canUpdateContract = isManager || groupId === 1;

      if (!contract.isDraft && !canUpdateContract) {
        res.status(403).send("Solo Supervisores o Admin pueden actualizar un contrato que no es borrador.");
        return;
      }

      // Solo Supervisores o Admin pueden cambiar el estado de un contrato
      if (contractData.contractStateId !== undefined && !canUpdateContract) {
        res.status(403).send("Solo Supervisores o Admin pueden cambiar el estado de un contrato.");
        return;
      }

      const updatedContract = await ContractsService.update(uuid, contractData, updatedByUserId);
      res.json(updatedContract);
    } catch (error) {
      next(error);
    }
  };

  export const renew = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const { rateId } = req.body;

      const updatedContract = await ContractsService.renew(uuid, rateId);
      res.json(updatedContract);
    } catch (error) {
      next(error);
    }
  };

  export const deleteContract = async (req, res, next) => {
    try {
      const { isManager, groupId } = req.user;
      const { uuid } = req.params;

      // Solo Supervisores (isManager) o Admin (groupId === 1) pueden eliminar contratos
      const canDeleteContract = isManager || groupId === SUPER_ADMIN_GROUP_ID;

      if (!canDeleteContract) {
        res.status(403).send("Solo Supervisores o Admin pueden eliminar contratos.");
        return;
      }

      const contract = await ContractsService.getOne({ uuid });

      // Solo Super Admin puede borrar contratos no borrador
      if (!contract.isDraft && groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("Solo Super Admin puede eliminar contratos que no están en modo borrador.");
        return;
      }

      const deleted = await ContractsService.remove(uuid);
      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };

  export const getHistory = async (req, res, next) => {
    const { uuid: contractUuid } = req.params;

    try {
      const contractFound = await ContractsService.getOne(
        {
          uuid: contractUuid,
        },
        { history: true }
      );

      res.json(contractFound?.history);
    } catch (error) {
      next(error);
    }
  };

  export const getVisibleCups = async (req, res, next) => {
    try {
      const { userId, isManager, groupId } = req.user;

      //TODO: Refactor pagination
      const contracts = await ContractsService.getVisibleContracts(
        userId,
        isManager,
        groupId,
        { page: 1, limit: 200 },
        {
          customer: true,
        }
      );

      res.json(contracts);
    } catch (error) {
      next(error);
    }
  };

  export const searchByCups = async (req, res, next) => {
    try {
      const { userId, isManager, groupId } = req.user;
      const { search, excludeLiquidation, limit } = req.query;

      const contracts = await ContractsService.searchByCups(
        userId,
        isManager,
        groupId,
        search as string,
        excludeLiquidation as string,
        limit ? parseInt(limit as string) : 20
      );

      res.json(contracts);
    } catch (error) {
      next(error);
    }
  };

  export const updateBatch = async (req, res, next) => {
    const { contractsUuids, dataToUpdate } = req.body;
    const { userId: updatedByUserId, isManager, groupId } = req.user;

    try {
      // Solo Supervisores (isManager) o Admin (groupId === 1) pueden usar updateBatch
      const canUpdateContract = isManager || groupId === SUPER_ADMIN_GROUP_ID;

      // Si se intenta cambiar el estado, verificar permisos
      if (dataToUpdate.contractStateId !== undefined && !canUpdateContract) {
        res.status(403).send("Solo Supervisores o Admin pueden cambiar el estado de un contrato.");
        return;
      }

      const contractsUpdated = [];
      for (const uuid of contractsUuids) {
        const contract = await ContractsService.getOne({ uuid });

        // Verificar permisos para contratos no borrador
        if (!contract.isDraft && !canUpdateContract) {
          res.status(403).send("Solo Supervisores o Admin pueden actualizar un contrato que no es borrador.");
          return;
        }

        contractsUpdated.push(await ContractsService.update(uuid, dataToUpdate, updatedByUserId));
      }

      res.status(201).json(contractsUpdated);
    } catch (error) {
      next(error);
    }
  };

  export const deleteBatch = async (req, res, next) => {
    const { contractsUuids } = req.body;
    const { isManager, groupId } = req.user;

    try {
      // Solo Supervisores (isManager) o Admin (groupId === 1) pueden eliminar contratos
      const canDeleteContract = isManager || groupId === SUPER_ADMIN_GROUP_ID;

      if (!canDeleteContract) {
        res.status(403).send("Solo Supervisores o Admin pueden eliminar contratos.");
        return;
      }

      const contractsDeleted = [];
      for (const uuid of contractsUuids) {
        const contract = await ContractsService.getOne({ uuid });

        // Solo Super Admin puede borrar contratos no borrador
        if (!contract.isDraft && groupId !== SUPER_ADMIN_GROUP_ID) {
          res.status(403).send("Solo Super Admin puede eliminar contratos que no están en modo borrador.");
          return;
        }

        contractsDeleted.push(await ContractsService.remove(uuid));
      }

      res.status(201).json(contractsDeleted);
    } catch (error) {
      next(error);
    }
  };

  export const cloneContract = async (req, res, next) => {
    try {
      const { contractUuid, userId } = req.body;
      if (!contractUuid || !userId) {
        return res.status(400).json({ error: 'contractUuid and userId are required' });
      }
      const cloned = await ContractsService.cloneContract(contractUuid, userId);
      res.status(201).json(cloned);
    } catch (error) {
      next(error);
    }
  };

  export const renewContract = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const renewedContract = await ContractsService.renewContract(uuid);
      res.status(201).json(renewedContract);
    } catch (error) {
      next(error);
    }
  };
}
