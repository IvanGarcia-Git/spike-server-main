import { Router } from "express";
import { HolidayController } from "../controllers/holiday.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.get("/", authenticateJWT, HolidayController.getAll);
router.get("/my", authenticateJWT, HolidayController.getForCurrentUser);
router.post("/", authenticateJWT, HolidayController.create);
router.patch("/:uuid", authenticateJWT, HolidayController.update);
router.delete("/:uuid", authenticateJWT, HolidayController.remove);

export default router;
