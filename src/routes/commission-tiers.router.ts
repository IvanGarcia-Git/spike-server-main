import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { CommissionTiersController } from "../controllers/commission-tiers.controller";

const router = Router();

// GET /commission-tiers?rateId=...
router.get("/", authenticateJWT, CommissionTiersController.listByRate);

// GET /commission-tiers/calculate?rateId=...&consumo=...&isRenewal=...
router.get("/calculate", authenticateJWT, CommissionTiersController.calculate);

// POST /commission-tiers
router.post("/", authenticateJWT, CommissionTiersController.create);

// POST /commission-tiers/bulk
router.post("/bulk", authenticateJWT, CommissionTiersController.bulkUpsert);

// PATCH /commission-tiers/:id
router.patch("/:id", authenticateJWT, CommissionTiersController.update);

// DELETE /commission-tiers/:id
router.delete("/:id", authenticateJWT, CommissionTiersController.remove);

export default router;
