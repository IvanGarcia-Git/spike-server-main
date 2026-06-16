import { Router } from "express";
import { LeadStatsController } from "../controllers/lead-stats.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.use(authenticateJWT);

router.get("/", LeadStatsController.getStats);

export default router;
