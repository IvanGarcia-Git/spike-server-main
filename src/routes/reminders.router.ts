import { authenticateJWT } from "../middlewares/auth";
import { RemindersController } from "../controllers/reminders.controller";
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
  upload.single("reminderFile"),
  RemindersController.create
);

router.post("/get-by-date", authenticateJWT, RemindersController.getManyByDate);

router.get("/", authenticateJWT, RemindersController.getMany);

router.get("/:reminderUuid", authenticateJWT, RemindersController.get);

router.patch("/:reminderUuid", authenticateJWT, RemindersController.update);

router.delete("/:reminderUuid", authenticateJWT, RemindersController.deleteReminder);

export default router;
