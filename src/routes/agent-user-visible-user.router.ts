import { authenticateJWT } from "../middlewares/auth";
import { Router } from "express";
import { AgentUserVisibleUserController } from "../controllers/agent-user-visible-user.controller";

const router = Router();

router.post("/", authenticateJWT, AgentUserVisibleUserController.createBatch);

export default router;
