import { ContractsService } from "../services/contracts.service";
import { Roles } from "../enums/roles.enum";
import { AwsHelper } from "../helpers/aws.helper";

export module ContractsController {
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

      const { page = 1, limit = 10 } = req.query;

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
        }
      );

      res.json(contracts);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { isManager, userId: updatedByUserId } = req.user;
      const { uuid } = req.params;
      const contractData = req.body;

      const contract = await ContractsService.getOne({ uuid });

      if (!contract.isDraft && !isManager) {
        res.status(403).send("Only Admin can update a contract that is not in draft mode.");
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
      const { groupId } = req.user;
      const { uuid } = req.params;

      const contract = await ContractsService.getOne({ uuid });

      if (!contract.isDraft && groupId != Roles.Admin) {
        res.status(403).send("Only SuperAdmin can delete a contract that is not in draft mode.");
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

  export const updateBatch = async (req, res, next) => {
    const { contractsUuids, dataToUpdate } = req.body;
    const { userId: updatedByUserId } = req.user;

    try {
      const contractsUpdated = [];
      for (const uuid of contractsUuids) {
        contractsUpdated.push(await ContractsService.update(uuid, dataToUpdate, updatedByUserId));
      }

      res.status(201).json(contractsUpdated);
    } catch (error) {
      next(error);
    }
  };

  export const deleteBatch = async (req, res, next) => {
    const { contractsUuids } = req.body;

    try {
      const contractsDeleted = [];
      for (const uuid of contractsUuids) {
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
}
