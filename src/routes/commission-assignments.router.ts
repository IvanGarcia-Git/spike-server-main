import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { CommissionAssignmentsController } from "../controllers/commission-assignments.controller";

const router = Router();

router.get(
  "/",
  authenticateJWT,
  CommissionAssignmentsController.listByChannel
);

router.patch(
  "/",
  authenticateJWT,
  CommissionAssignmentsController.upsert
);

export default router;
