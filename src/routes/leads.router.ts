import { authenticateJWT } from "../middlewares/auth";
import { Router } from "express";
import { LeadsController } from "../controllers/leads.controller";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
});

const router = Router();

router.post("/", authenticateJWT, upload.single("billFile"), LeadsController.create);

router.post("/batch", authenticateJWT, LeadsController.createBatch);

router.post("/type", authenticateJWT, LeadsController.typeLead);

router.post("/assign-to-user", authenticateJWT, LeadsController.assignToUser);

router.post("/from-webhook", LeadsController.createFromWebhook);

router.post("/assign-to-queue", authenticateJWT, LeadsController.assignToQueue);

router.get("/count", authenticateJWT, LeadsController.count);

// Ciclo de vida de leads (PRES-018 B2b - rotación y tipificaciones)
// IMPORTANTE: estas rutas GET estáticas deben ir ANTES de "/:leadUuid"
// o Express las captura como un uuid y nunca llegan a su controlador.
router.get("/next-available", authenticateJWT, LeadsController.getNextAvailableLead);
router.get("/tipifications", authenticateJWT, LeadsController.getTipifications);
router.get("/queue-stats", authenticateJWT, LeadsController.getQueueStats);

router.get("/:leadUuid", authenticateJWT, LeadsController.getOne);

router.delete("/:leadUuid", authenticateJWT, LeadsController.deleteLead);

router.get("/user/history", authenticateJWT, LeadsController.getUserLeadsHistory);

router.get("/repeated/entries", authenticateJWT, LeadsController.getRepeatedLeads);

router.patch("/:leadUuid", authenticateJWT, upload.single("billFile"), LeadsController.update);

router.patch("/state/:leadUuid", authenticateJWT, LeadsController.changeState);

// Acciones del ciclo de vida sobre un lead concreto (POST con sub-ruta, no colisionan)
router.post("/:leadUuid/assign", authenticateJWT, LeadsController.assignLeadToAgent);
router.post("/:leadUuid/tipify", authenticateJWT, LeadsController.tipifyLead);

//Lead Document
router.post(
  "/:leadUuid/documents",
  authenticateJWT,
  upload.array("documents", 10),
  LeadsController.uploadDocumentForLead
);

router.get("/:leadUuid/documents", authenticateJWT, LeadsController.getDocumentsForLead);

router.get(
  "/documents/download/:documentUuid",
  authenticateJWT,
  LeadsController.getLeadDocumentDownloadUrl
);

export default router;
