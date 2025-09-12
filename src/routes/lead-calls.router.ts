import { authenticateJWT } from "../middlewares/auth";
import { LeadCallsController } from "../controllers/lead-calls.controller";
import multer from "multer";
import { Router } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
});

const router = Router();

router.post(
  "/",
  authenticateJWT,
  upload.single("leadCallFile"),
  LeadCallsController.create
);

router.post("/get-by-date", authenticateJWT, LeadCallsController.getManyByDate);

router.get("/", authenticateJWT, LeadCallsController.getMany);

router.get("/:leadCallUuid", authenticateJWT, LeadCallsController.get);

router.patch("/:leadCallUuid", authenticateJWT, LeadCallsController.update);

router.delete("/:leadCallUuid", authenticateJWT, LeadCallsController.deleteLeadCall);

export default router;
