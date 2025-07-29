import { authenticateJWT } from "../middlewares/auth";
import { LeadSheetsController } from "../controllers/lead-sheets.controller";
import { Router } from "express";

const router = Router();

router.post("/", authenticateJWT, LeadSheetsController.create);

router.get("/:uuid", authenticateJWT, LeadSheetsController.get);

router.patch("/:uuid", authenticateJWT, LeadSheetsController.update);

export default router;
