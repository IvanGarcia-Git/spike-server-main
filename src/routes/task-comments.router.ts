import { authenticateJWT } from "../middlewares/auth";
import { TasksCommentsController } from "../controllers/task-comments.controller";
import multer from "multer";
import { Router } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router();

router.post(
  "/:taskUuid",
  authenticateJWT,
  upload.single("taskCommentFile"),
  TasksCommentsController.create
);

export default router;
