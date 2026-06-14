import { Router } from "express";
import { LeadAssignmentRulesController } from "../controllers/lead-assignment-rules.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.use(authenticateJWT);

router.get("/", LeadAssignmentRulesController.list);
router.post("/", LeadAssignmentRulesController.create);
router.put("/:uuid", LeadAssignmentRulesController.update);
router.delete("/:uuid", LeadAssignmentRulesController.remove);

export default router;
