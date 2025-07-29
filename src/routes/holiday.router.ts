import { Router } from "express";
import { HolidayController } from "../controllers/holiday.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();
router.get("/", authenticateJWT, HolidayController.getAll);
router.post("/", authenticateJWT, HolidayController.create);
export default router;
