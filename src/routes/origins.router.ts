import { authenticateJWT } from "../middlewares/auth";
import { OriginsController } from "../controllers/origins.controller";
import { Router } from "express";
const router = Router();

router.post("/", authenticateJWT, OriginsController.create);

router.get("/all", authenticateJWT, OriginsController.getAll);

router.delete("/:id", authenticateJWT, OriginsController.deleteOrigin);

export default router;
