import { authenticateJWT } from "../middlewares/auth";
import { CompaniesController } from "../controllers/companies.controller";
import multer from "multer";
import { Router } from "express";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    var ext = path.extname(file.originalname).toLocaleLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
});

const router = Router();

router.post(
  "/",
  authenticateJWT,
  upload.single("imgFile"),
  CompaniesController.create
);

router.get("/:uuid", authenticateJWT, CompaniesController.get);

router.get("/", authenticateJWT, CompaniesController.getAll);

router.patch(
  "/:uuid",
  authenticateJWT,
  upload.single("imgFile"),
  CompaniesController.update
);

router.delete("/:id", authenticateJWT, CompaniesController.deleteCompany);

export default router;
