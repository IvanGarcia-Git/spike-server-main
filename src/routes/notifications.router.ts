import { authenticateJWT } from "../middlewares/auth";
import { NotificationsController } from "../controllers/notifications.controller";
import { Router } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get("/", authenticateJWT, NotificationsController.getVisible);

router.get("/unnotified", authenticateJWT, NotificationsController.getUnnotified);

router.post(
  "/",
  authenticateJWT,
  upload.single("notificationFile"),
  NotificationsController.create
);

router.patch("/bulk-update", authenticateJWT, NotificationsController.bulkUpdate);

router.patch("/:uuid", authenticateJWT, NotificationsController.update);

router.delete("/", authenticateJWT, NotificationsController.bulkDelete);

router.get("/:batchId/read-history", authenticateJWT, NotificationsController.readHistory);

router.get("/sent", authenticateJWT, NotificationsController.getSent);

export default router;
