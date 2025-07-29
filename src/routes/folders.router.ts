import { authenticateJWT } from "../middlewares/auth";
import { FoldersController } from "../controllers/folders.controller";
import { Router } from "express";

const router = Router();

router.post("/", authenticateJWT, FoldersController.create);

router.get("/private", authenticateJWT, FoldersController.getPrivate);

router.get("/shared", authenticateJWT, FoldersController.getShared);

router.get("/recent", authenticateJWT, FoldersController.getRecent);

router.patch("/:uuid", authenticateJWT, FoldersController.update);

router.delete("/:uuid", authenticateJWT, FoldersController.remove);

export default router;
