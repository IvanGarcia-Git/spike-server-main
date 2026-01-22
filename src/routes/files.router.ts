import { authenticateJWT } from "../middlewares/auth";
import { FilesController } from "../controllers/files.controller";
import { Router } from "express";
import multer from "multer";
import path from "path";
import * as fs from "fs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
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

// Rutas de compartir archivos
router.get("/shares/with-me", authenticateJWT, FilesController.getSharedWithMe);
router.get("/shares/by-me", authenticateJWT, FilesController.getSharedByMe);
router.get("/shares/users", authenticateJWT, FilesController.getUsersForSharing);
router.get("/shares/:fileId", authenticateJWT, FilesController.getFileShares);
router.post("/shares", authenticateJWT, FilesController.shareFile);
router.delete("/shares", authenticateJWT, FilesController.unshareFile);

// Rutas de papelera (deben ir antes de /:uuid para evitar conflictos)
router.get("/trash", authenticateJWT, FilesController.getTrash);
router.delete("/trash", authenticateJWT, FilesController.emptyTrash);
router.post("/:uuid/restore", authenticateJWT, FilesController.restore);

// Actualizar archivo (destacado, etc.)
router.put("/:id", authenticateJWT, FilesController.update);

router.delete("/:uuid", authenticateJWT, FilesController.remove);

router.get("/uploads/*", (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(process.cwd(), "uploads", filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.mp3': 'audio/mpeg',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`);
    res.sendFile(fullPath);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ error: "Error serving file" });
  }
});

export default router;
