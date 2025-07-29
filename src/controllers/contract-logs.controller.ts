import { Contract } from "../models/contract.entity";
import { ContractLogsService } from "../services/contract-logs.service";
import { ContractsService } from "../services/contracts.service";

export module ContractLogsController {
  export const getContractLogs = async (req, res, next) => {
    const { contractUuid } = req.params;

    try {
      const contractFound: Contract = await ContractsService.getOne(
        {
          uuid: contractUuid,
        },
        { logs: true }
      );

      res.json(contractFound?.logs);
    } catch (error) {
      next(error);
    }
  };
}
