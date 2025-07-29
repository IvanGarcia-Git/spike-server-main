import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { LiquidationsController } from "../controllers/liquidations.controller";

const router = Router();

router.get("/", authenticateJWT, LiquidationsController.listUserLiquidations);

router.post("/", authenticateJWT, LiquidationsController.create);

router.get("/:uuid", authenticateJWT, LiquidationsController.getByUuid);

router.patch("/:uuid", authenticateJWT, LiquidationsController.update);

router.delete("/:uuid", authenticateJWT, LiquidationsController.remove);

export default router;