import { Router } from "express";
import { ComparativasController } from "../controllers/comparativas.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Handle OPTIONS requests without authentication
router.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

// Apply authentication to all routes
router.get("/", authenticateJWT, ComparativasController.getAll);
router.get("/recent", authenticateJWT, ComparativasController.getRecent);
router.get("/:id", authenticateJWT, ComparativasController.getById);
router.post("/", authenticateJWT, ComparativasController.create);
router.put("/:id", authenticateJWT, ComparativasController.update);
router.delete("/:id", authenticateJWT, ComparativasController.deleteComparativa);

export default router;