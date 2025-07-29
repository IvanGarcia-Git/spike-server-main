import { authenticateJWT } from "../middlewares/auth";
import { CustomersController } from "../controllers/customers.controller";
import { Router } from "express";

const router = Router();

router.post("/", authenticateJWT, CustomersController.create);

router.get("/:uuid", authenticateJWT, CustomersController.get);

router.get("/", authenticateJWT, CustomersController.getAllCustomers);

router.get("/simple/:uuid", authenticateJWT, CustomersController.simpleGet);

router.get("/check/duplicity", authenticateJWT, CustomersController.checkDuplicity);

router.patch("/:uuid", authenticateJWT, CustomersController.update);

export default router;
