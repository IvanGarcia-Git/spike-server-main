import { Router } from "express";
import { ComparativaController } from "../controllers/comparativa.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// GET routes
router.get("/", ComparativaController.findAll);
router.get("/recent", ComparativaController.findRecent);
router.get("/:id", ComparativaController.findById);
router.get("/uuid/:uuid", ComparativaController.findByUuid);

// POST routes
router.post("/", ComparativaController.create);

// PUT routes
router.put("/:id", ComparativaController.update);

// DELETE routes
router.delete("/:id", ComparativaController.deleteById);
router.delete("/uuid/:uuid", ComparativaController.deleteByUuid);

export default router;