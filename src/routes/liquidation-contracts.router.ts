import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { LiquidationContractsController } from "../controllers/liquidation-contracts.controller";

const router = Router();

router.post("/", authenticateJWT, LiquidationContractsController.create);

router.get("/:uuid", authenticateJWT, LiquidationContractsController.getByUuid);

router.patch("/:uuid", authenticateJWT, LiquidationContractsController.update);

router.delete("/:uuid", authenticateJWT, LiquidationContractsController.remove);

router.get("/by-liquidation/:liquidationUuid", authenticateJWT, LiquidationContractsController.listByLiquidation);


export default router;