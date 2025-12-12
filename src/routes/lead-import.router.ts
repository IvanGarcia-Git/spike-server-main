import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { LeadImportController } from "../controllers/lead-import.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Multer configuration for Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (ext !== ".xlsx" && ext !== ".xls") {
      return callback(new Error("Solo se permiten archivos Excel (.xlsx, .xls)"));
    }

    if (!validMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Tipo de archivo no válido. Solo se permiten archivos Excel."));
    }

    callback(null, true);
  },
});

// Middleware to check manager or super admin permissions
const requireManagerOrAdmin = (req: any, res: Response, next: NextFunction) => {
  const { isManager, groupId } = req.user as { isManager: boolean; groupId: number };

  if (!isManager && groupId !== 1) {
    res.status(403);
    return next(new Error("No tienes permisos para importar leads. Solo managers y administradores pueden realizar esta acción."));
  }

  next();
};

// Routes
router.post(
  "/preview",
  authenticateJWT,
  requireManagerOrAdmin,
  upload.single("file"),
  LeadImportController.preview
);

router.post(
  "/confirm",
  authenticateJWT,
  requireManagerOrAdmin,
  LeadImportController.confirm
);

router.get(
  "/template",
  authenticateJWT,
  LeadImportController.downloadTemplate
);

export default router;
