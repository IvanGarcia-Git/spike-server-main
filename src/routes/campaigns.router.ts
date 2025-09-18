import { authenticateJWT } from "../middlewares/auth";
import { Router } from "express";
import { CampaignsController } from "../controllers/campaigns.controller";

const router = Router();

router.post("/", authenticateJWT, CampaignsController.createOrUpdate);

router.post("/link-to-group", authenticateJWT, CampaignsController.linkToGroup);

router.get(
  "/all",
  authenticateJWT,
  CampaignsController.getAllWithPaginatedLeads
);

router.get(
  "/basic",
  authenticateJWT,
  CampaignsController.getAllBasic
);

router.get(
  "/:uuid",
  authenticateJWT,
  CampaignsController.getOne
);

router.delete("/:uuid", authenticateJWT, CampaignsController.deleteCampaign);

export default router;
