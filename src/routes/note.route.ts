import { Router } from "express";
import { NoteController } from "../controllers/note.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Handle OPTIONS requests without authentication
router.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

// Apply authentication to all other routes
router.get("/", authenticateJWT, NoteController.getAll);
router.get("/:id", authenticateJWT, NoteController.getById);
router.post("/", authenticateJWT, NoteController.create);
router.put("/:id", authenticateJWT, NoteController.update);
router.delete("/:id", authenticateJWT, NoteController.deleteNote);
router.post("/bulk", authenticateJWT, NoteController.bulkCreate);
router.delete("/", authenticateJWT, NoteController.deleteAll);

export default router;