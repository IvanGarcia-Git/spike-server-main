import { authenticateJWT } from "../middlewares/auth";
import { GlobalSearchController } from "../controllers/global-search.controller";
import { Router } from "express";

const router = Router();

router.post("/", authenticateJWT, GlobalSearchController.performGlobalSearch);

router.post("/calendar", authenticateJWT, GlobalSearchController.performCalendarSearch);

export default router;
