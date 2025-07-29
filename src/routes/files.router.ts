import { authenticateJWT } from "../middlewares/auth";
import { FilesController } from "../controllers/files.controller";
import { Router } from "express";
import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".mp3",
      ".xlsx",
      ".pdf",
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return callback(
        new Error("Only images, MP3, Excel, and PDF files are allowed")
      );
    }

    callback(null, true);
  },
});

const router = Router();

router.post(
  "/",
  upload.single("file"),
  authenticateJWT,
  FilesController.create
);

router.get("/private", authenticateJWT, FilesController.getPrivate);

router.get("/shared", authenticateJWT, FilesController.getShared);

router.get("/recent", authenticateJWT, FilesController.getRecent);

router.delete("/:uuid", authenticateJWT, FilesController.remove);

export default router;
