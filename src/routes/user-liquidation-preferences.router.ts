import { authenticateJWT } from "../middlewares/auth";
import { UserLiquidationPreferencesController } from "../controllers/user-liquidation-preferences.controller";
import { Router } from "express";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  UserLiquidationPreferencesController.setUserLiquidationPreferences
);

router.get(
  "/:userId",
  authenticateJWT,
  UserLiquidationPreferencesController.getUserLiquidationPreferences
);

export default router;
