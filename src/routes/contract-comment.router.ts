import { authenticateJWT } from "../middlewares/auth";
import { ContractCommentsController } from "../controllers/contract-comment.controller";
import multer from "multer";
import { Router } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router();

router.post(
  "/:contractUuid",
  authenticateJWT,
  upload.single("contractCommentFile"),
  ContractCommentsController.create
);

export default router;
