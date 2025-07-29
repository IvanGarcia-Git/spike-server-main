import { authenticateJWT } from "../middlewares/auth";
import { Router } from "express";
import { UserShareLeadsController } from "../controllers/user-share-leads.controller";

const router = Router();

router.post("/", authenticateJWT, UserShareLeadsController.createBatch);

router.post("/user-list", authenticateJWT, UserShareLeadsController.getList);

export default router;
