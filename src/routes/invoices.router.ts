import { Router } from "express";
import { InvoicesController } from "../controllers/invoices.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Rutas públicas (ninguna por ahora)

// Rutas protegidas
router.get("/", authenticateJWT, InvoicesController.findAll);
router.get("/recent", authenticateJWT, InvoicesController.findRecent);
router.get("/next-number", authenticateJWT, InvoicesController.getNextInvoiceNumber);
router.get("/type/:type", authenticateJWT, InvoicesController.findByType);
router.get("/:uuid", authenticateJWT, InvoicesController.getByUuid);
router.post("/", authenticateJWT, InvoicesController.create);
router.put("/:uuid", authenticateJWT, InvoicesController.update);
router.delete("/:uuid", authenticateJWT, InvoicesController.remove);

export default router;
