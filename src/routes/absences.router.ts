import { Router } from "express";
import { AbsencesController } from "../controllers/absences.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.post("/", authenticateJWT, AbsencesController.create);
router.get("/user/:userId", authenticateJWT, AbsencesController.getAllByUserId);
router.patch("/:uuid", authenticateJWT, AbsencesController.updateAbsence);
router.delete("/:uuid", authenticateJWT, AbsencesController.deleteAbsence);

export default router;