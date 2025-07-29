import { authenticateJWT } from "../middlewares/auth";
import { UserContractPreferencesController } from "../controllers/user-contract-preferences.controller";
import { Router } from "express";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  UserContractPreferencesController.setUserContractPreferences
);

router.get(
  "/:userId",
  authenticateJWT,
  UserContractPreferencesController.getUserContractPreferences
);

export default router;
