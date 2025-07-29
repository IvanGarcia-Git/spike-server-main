import { authenticateJWT } from "../middlewares/auth";
import { ChannelsController } from "../controllers/channels.controller";
import multer from "multer";
import { Router } from "express";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    var ext = path.extname(file.originalname).toLocaleLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
});

const router = Router();

router.post(
  "/",
  authenticateJWT,
  upload.single("imgFile"),
  ChannelsController.create
);

router.get("/:uuid", ChannelsController.get);

router.get("/", authenticateJWT, ChannelsController.getAll);

router.patch(
  "/:uuid",
  authenticateJWT,
  upload.single("imgFile"),
  ChannelsController.update
);

router.delete("/", authenticateJWT, ChannelsController.deleteChannel);

export default router;
