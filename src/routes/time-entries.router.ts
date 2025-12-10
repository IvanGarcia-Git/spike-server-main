import { Router } from "express";
import { TimeEntriesController } from "../controllers/time-entries.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Status and quick actions
router.get("/status", authenticateJWT, TimeEntriesController.getCurrentStatus);
router.post("/clock-in", authenticateJWT, TimeEntriesController.clockIn);
router.post("/clock-out", authenticateJWT, TimeEntriesController.clockOut);
router.post("/break/start", authenticateJWT, TimeEntriesController.startBreak);
router.post("/break/end", authenticateJWT, TimeEntriesController.endBreak);

// Summaries
router.get("/today", authenticateJWT, TimeEntriesController.getTodaySummary);
router.get("/weekly", authenticateJWT, TimeEntriesController.getWeeklySummary);

// History and export
router.get("/history", authenticateJWT, TimeEntriesController.getHistory);
router.get("/export", authenticateJWT, TimeEntriesController.exportEntries);

// Entry management (manager only for update/delete)
router.patch("/:uuid", authenticateJWT, TimeEntriesController.updateEntry);
router.delete("/:uuid", authenticateJWT, TimeEntriesController.deleteEntry);
router.get("/:uuid/audit", authenticateJWT, TimeEntriesController.getAuditTrail);

export default router;
