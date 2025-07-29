import { authenticateJWT } from "../middlewares/auth";
import { ContractStatesController } from "../controllers/contract-states.controller";
import { Router } from "express";
const router = Router();

router.post("/", authenticateJWT, ContractStatesController.create);

router.get("/one/:id", authenticateJWT, ContractStatesController.get);

router.get("/all", authenticateJWT, ContractStatesController.getAll);

router.delete(
  "/:id",
  authenticateJWT,
  ContractStatesController.deleteContractState
);

router.patch("/:id", authenticateJWT, ContractStatesController.update);

export default router;
