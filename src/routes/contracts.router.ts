import { authenticateJWT } from "../middlewares/auth";
import { ContractsController } from "../controllers/contracts.controller";
import multer from "multer";
import { Router } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router();

router.post(
  "/",
  authenticateJWT,
  ContractsController.create
);

router.get("/count", authenticateJWT, ContractsController.count);

router.get("/:uuid", authenticateJWT, ContractsController.get);

router.get("/history/:uuid", authenticateJWT, ContractsController.getHistory);

router.get("/visible/cups", authenticateJWT, ContractsController.getVisibleCups);

router.get("/search/cups", authenticateJWT, ContractsController.searchByCups);

router.get("/", authenticateJWT, ContractsController.getVisibleContracts);

router.patch("/:uuid", authenticateJWT, ContractsController.update);

router.patch("/renew/:uuid", authenticateJWT, ContractsController.renew);

router.delete("/:uuid", authenticateJWT, ContractsController.deleteContract);

router.delete("/batch/delete", authenticateJWT, ContractsController.deleteBatch);

router.patch("/batch/update", authenticateJWT, ContractsController.updateBatch);

router.post(
  "/clone",
  authenticateJWT,
  ContractsController.cloneContract
);

router.post(
  "/renew-duplicate/:uuid",
  authenticateJWT,
  ContractsController.renewContract
);

export default router;
