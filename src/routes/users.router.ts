import { authenticateJWT } from "../middlewares/auth";
import { Router } from "express";
const router = Router();
import { UsersController } from "../controllers/users.controller";
import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, callback) => {
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf", ".xlsx", ".xls"];

    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return callback(
        new Error("Solo se permiten imágenes (PNG, JPG), PDF y archivos de Excel (XLS, XLSX)")
      );
    }
    callback(null, true);
  },
});

router.post("/", authenticateJWT, upload.single("userImage"), (req, res, next) => {
  UsersController.create(req, res, next);
});

router.post("/all", authenticateJWT, (req, res, next) => {
  UsersController.getList(req, res, next);
});

router.post("/login", (req, res, next) => {
  UsersController.login(req, res, next);
});

router.post("/send-reset-password", (req, res, next) => {
  UsersController.sendResetPasswordEmail(req, res, next);
});

router.get("/agents", authenticateJWT, (req, res, next) => {
  UsersController.getAgentsList(req, res, next);
});

router.get("/profile-picture/:userId", authenticateJWT, (req, res, next) => {
  UsersController.getProfilePicture(req, res, next);
});

router.get("/lead", authenticateJWT, (req, res, next) => {
  UsersController.getLead(req, res, next);
});

router.get("/", authenticateJWT, (req, res, next) => {
  UsersController.get(req, res, next);
});

router.get("/all", authenticateJWT, (req, res, next) => {
  UsersController.getAllUsers(req, res, next);
});

router.get("/by/:userUuid", authenticateJWT, (req, res, next) => {
  UsersController.getByUuid(req, res, next);
});

router.get("/by-email/:userEmail", (req, res, next) => {
  UsersController.getByEmail(req, res, next);
});

router.get("/visible-users", authenticateJWT, (req, res, next) => {
  UsersController.getManagerVisibleUsers(req, res, next);
});

router.get("/agent-visible-users", authenticateJWT, (req, res, next) => {
  UsersController.getAgentVisibleUsers(req, res, next);
});

router.get("/agents-and-supervisors", authenticateJWT, UsersController.getAgentsAndSupervisors);

router.patch("/", authenticateJWT, upload.single("userImage"), (req, res, next) => {
  UsersController.updateUser(req, res, next);
});

router.patch("/reset-password/:userUuid", (req, res, next) => {
  UsersController.resetPassword(req, res, next);
});

router.delete("/", authenticateJWT, (req, res, next) => {
  UsersController.deleteUser(req, res, next);
});

//User Documents
router.post(
  "/documents/:userId",
  authenticateJWT,
  upload.single("document"),
  UsersController.uploadDocument
);

router.get("/documents/:userId", authenticateJWT, UsersController.getDocumentsForUser);

router.get("/documents/download/:documentUuid", authenticateJWT, UsersController.getDownloadUrl);

router.delete("/documents/:documentUuid", authenticateJWT, UsersController.deleteDocument);

export default router;
