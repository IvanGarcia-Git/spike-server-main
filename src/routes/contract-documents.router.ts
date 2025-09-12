import { authenticateJWT } from "../middlewares/auth";
import { ContractDocumentsController } from "../controllers/contract-documents.controller";
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
  upload.single("contractDocument"),
  ContractDocumentsController.create
);

router.post(
  "/batch",
  authenticateJWT,
  upload.array("contractDocuments", 8),
  ContractDocumentsController.createBatch
);

router.get(
  "/:contractDocumentUuid",
  authenticateJWT,
  ContractDocumentsController.get
);

router.get(
  "/contract/:contractUuid",
  authenticateJWT,
  ContractDocumentsController.getContractDocuments
);

router.delete(
  "/",
  authenticateJWT,
  ContractDocumentsController.deleteContactDocument
);

export default router;
