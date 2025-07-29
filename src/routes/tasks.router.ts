import { authenticateJWT } from "../middlewares/auth";
import { TasksController } from "../controllers/tasks.controller";
import multer from "multer";
import { Router } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router();

router.post(
  "/",
  authenticateJWT,
  upload.single("taskCommentFile"),
  TasksController.create
);

router.post("/search", authenticateJWT, TasksController.search);

router.get("/", authenticateJWT, TasksController.getCreatedTasks);

router.get("/assigned/tasks", authenticateJWT, TasksController.getAssignedTasks);

router.get("/:taskUuid", authenticateJWT, TasksController.getTaskDetail);

router.patch("/:taskUuid", authenticateJWT, TasksController.update);

router.delete("/:taskUuid", authenticateJWT, TasksController.deleteTask);


export default router;
