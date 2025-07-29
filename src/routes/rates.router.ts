import { authenticateJWT } from "../middlewares/auth";
import { RatesController } from "../controllers/rates.controller";
import { Router } from "express";
const router = Router();

router.post("/", authenticateJWT, RatesController.create);

router.get("/:id", RatesController.get);

router.get("/", RatesController.getMany);

router.get("/group/company-name", RatesController.getManyGroupedByCompanyName);

router.patch("/:id", authenticateJWT, RatesController.update);

router.put(
  "/channel-for-rates",
  authenticateJWT,
  RatesController.updateChannelForRates
);

router.delete("/:id", authenticateJWT, RatesController.deleteRate);

export default router;
