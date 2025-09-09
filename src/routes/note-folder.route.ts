import { Router } from "express";
import { NoteFolderController } from "../controllers/note-folder.controller";
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
router.get("/", authenticateJWT, NoteFolderController.getAll);
router.get("/:id", authenticateJWT, NoteFolderController.getById);
router.get("/folder/:folderId", authenticateJWT, NoteFolderController.getByFolderId);
router.post("/", authenticateJWT, NoteFolderController.create);
router.put("/:id", authenticateJWT, NoteFolderController.update);
router.put("/folder/:folderId", authenticateJWT, NoteFolderController.updateByFolderId);
router.delete("/:id", authenticateJWT, NoteFolderController.deleteFolder);
router.delete("/folder/:folderId", authenticateJWT, NoteFolderController.deleteByFolderId);
router.post("/bulk", authenticateJWT, NoteFolderController.bulkCreate);
router.delete("/", authenticateJWT, NoteFolderController.deleteAll);

export default router;