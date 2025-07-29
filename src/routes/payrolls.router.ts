import { Router } from "express";
import { PayrollsController } from "../controllers/payrolls.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  PayrollsController.create
);

router.patch(
  "/:uuid",
  authenticateJWT,
  PayrollsController.updatePayroll
);

router.get("/:id", authenticateJWT, PayrollsController.getAllByUserId);

router.delete(
  "/:uuid",
  authenticateJWT,
  PayrollsController.deletePayroll
);

export default router;