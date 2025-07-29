import { authenticateJWT } from "../middlewares/auth";
import { Router } from "express";
import { GroupsController } from "../controllers/groups.controller";

const router = Router();

router.post("/", authenticateJWT, GroupsController.createOrUpdate);

router.post("/link-user", authenticateJWT, GroupsController.linkUser);

router.post("/unlink-user", authenticateJWT, GroupsController.unlinkUser);

router.get("/:groupUuid", authenticateJWT, GroupsController.getOne);

router.get("/user/:userId", authenticateJWT, GroupsController.getUserGroups);

router.get("/", authenticateJWT, GroupsController.getAll);

router.delete("/:groupUuid", authenticateJWT, GroupsController.deleteGroup);

export default router;
