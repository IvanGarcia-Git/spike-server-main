import { authenticateJWT } from "../middlewares/auth";
import { ContractLogsController } from "../controllers/contract-logs.controller";
import { Router } from "express";

const router = Router();

router.get(
  "/contract/:contractUuid",
  authenticateJWT,
  ContractLogsController.getContractLogs
);

export default router;
