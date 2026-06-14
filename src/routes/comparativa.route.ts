import { Router } from "express";
import multer from "multer";
import { ComparativaController } from "../controllers/comparativa.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Subida en memoria para enviar la factura a la IA sin persistirla (PRES-018 B1).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Formato no soportado: usa PNG, JPG o PDF"));
  },
});

// Envuelve multer para devolver 400 (formato/tamaño) en vez de un 500 opaco.
const uploadInvoice = (req: any, res: any, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      const msg =
        err?.code === "LIMIT_FILE_SIZE"
          ? "La factura supera el tamaño máximo (15MB)"
          : err?.message || "Archivo no válido";
      return res.status(400).json({ error: msg });
    }
    next();
  });
};

// All routes require authentication
router.use(authenticateJWT);

// GET routes
router.get("/", ComparativaController.findAll);
router.get("/recent", ComparativaController.findRecent);
router.get("/:id", ComparativaController.findById);
router.get("/uuid/:uuid", ComparativaController.findByUuid);

// POST routes
router.post("/extract-invoice", uploadInvoice, ComparativaController.extractInvoice);
router.post("/", ComparativaController.create);

// PUT routes
router.put("/:id", ComparativaController.update);

// DELETE routes
router.delete("/:id", ComparativaController.deleteById);
router.delete("/uuid/:uuid", ComparativaController.deleteByUuid);

export default router;