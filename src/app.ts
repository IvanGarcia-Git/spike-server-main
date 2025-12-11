require("dotenv").config();
import campaignsRouter from "./routes/campaigns.router";
import channelsRouter from "./routes/channels.router";
import comparativasRouter from "./routes/comparativa.route";
import companiesRouter from "./routes/companies.router";
import contractsRouter from "./routes/contracts.router";
import contractCommentsRouter from "./routes/contract-comment.router"
import contractDocumentsRouter from "./routes/contract-documents.router";
import contractLogsRouter from "./routes/contract-logs.router";
import contractStatesRoutes from "./routes/contract-states.router";
import customersRouter from "./routes/customers.route";
import filesRouter from "./routes/files.router";
import foldersRouter from "./routes/folders.router";
import landingWebhook from "./webhooks/landing.webhook";
import leadsRouter from "./routes/leads.router";
import leadCallsRouter from "./routes/lead-calls.router";
import leadImportRouter from "./routes/lead-import.router";
import leadSheetsRouter from "./routes/lead-sheets.router";
import tiktokWebhook from "./webhooks/tiktok.webhook";
import notificationsRouter from "./routes/notifications.router";
import originsRouter from "./routes/origins.router";
import globalSearchRouter from "./routes/global-search.router";
import groupsRouter from "./routes/groups.router";
import ratesRoutes from "./routes/rates.router";
import reminderRoutes from "./routes/reminders.router";
import tasksRoutes from "./routes/tasks.router";
import taskCommentsRoutes from "./routes/task-comments.router";
import userAccessibilityRoutes from "./routes/agent-user-visible-user.router";
import userContractPreferencesRoutes from "./routes/user-contract-preferences.router";
import userLiquidationPreferencesRoutes from "./routes/user-liquidation-preferences.router";
import userShareLeadsRoutes from "./routes/user-share-leads.router";
import cors from "cors";
import { dataSource } from "../app-data-source";
import express from "express";
import errorMiddleware from "./middlewares/error";
import userRouter from "./routes/users.router";
import payrollRouter from "./routes/payrolls.router";
import absencesRouter from "./routes/absences.router";
import timeEntriesRouter from "./routes/time-entries.router";
import holidayRouter from "./routes/holiday.router";
import commissionAssignmentsRouter from "./routes/commission-assignments.router";
import liquidationsRouter from "./routes/liquidations.router";
import liquidationContractsRouter from "./routes/liquidation-contracts.router";
import dashboardRouter from "./routes/dashboard.routes";
import userProfilesRouter from "./routes/user-profiles.routes";
import noteRouter from "./routes/note.route";
import noteFolderRouter from "./routes/note-folder.route";
import { createServer } from "http";
import { User } from "./models/user.entity";
import { Roles } from "./enums/roles.enum";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Health check endpoint for Docker/Dokploy
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

//Webhooks routing
app.use("/webhook/tiktok", tiktokWebhook);
app.use("/webhook/landing", landingWebhook);

//Routing
app.use("/campaigns", campaignsRouter);
app.use("/channels", channelsRouter);
app.use("/comparativas", comparativasRouter);
app.use("/companies", companiesRouter);
app.use("/contracts", contractsRouter);
app.use("/contract-comments", contractCommentsRouter);
app.use("/contract-documents", contractDocumentsRouter);
app.use("/contract-logs", contractLogsRouter);
app.use("/contract-states", contractStatesRoutes);
app.use("/customers", customersRouter);
app.use("/files", filesRouter);
app.use("/folders", foldersRouter);
app.use("/leads", leadsRouter);
app.use("/leads/import", leadImportRouter);
app.use("/lead-calls", leadCallsRouter);
app.use("/lead-sheets", leadSheetsRouter);
app.use("/notifications", notificationsRouter);
app.use("/origins", originsRouter);
app.use("/groups", groupsRouter);
app.use("/rates", ratesRoutes);
app.use("/reminders", reminderRoutes);
app.use("/search", globalSearchRouter);
app.use("/tasks", tasksRoutes);
app.use("/task-comments", taskCommentsRoutes);
app.use("/user-contract-preferences", userContractPreferencesRoutes);
app.use("/user-liquidation-preferences", userLiquidationPreferencesRoutes);
app.use("/users", userRouter);
app.use("/payrolls", payrollRouter);
app.use("/absences", absencesRouter);
app.use("/time-entries", timeEntriesRouter);
app.use("/holidays", holidayRouter);
app.use("/commission-assignments", commissionAssignmentsRouter);
app.use("/users-accessibility", userAccessibilityRoutes);
app.use("/users-share-leads", userShareLeadsRoutes);
app.use("/liquidations", liquidationsRouter);
app.use("/liquidation-contracts", liquidationContractsRouter);
app.use("/dashboard", dashboardRouter);
app.use("/user-profiles", userProfilesRouter);
app.use("/notes", noteRouter);
app.use("/note-folders", noteFolderRouter);

//Custom middlewares
app.use(errorMiddleware);

// Función para crear usuario admin si no existe
async function seedAdminUser() {
  try {
    const userRepository = dataSource.getRepository(User);

    // Verificar si ya existe un usuario admin
    const existingAdmin = await userRepository.findOne({
      where: { username: process.env.ADMIN_USERNAME || "admin" }
    });

    if (existingAdmin) {
      console.log("✅ Usuario admin ya existe");
      return;
    }

    // Crear usuario admin
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "123456", 10);

    const adminUser = userRepository.create({
      uuid: uuidv4(),
      name: "Admin",
      firstSurname: "Usuario",
      secondSurname: "Sistema",
      username: process.env.ADMIN_USERNAME || "admin",
      email: process.env.ADMIN_EMAIL || "admin@admin.com",
      password: hashedPassword,
      isManager: true,
      role: Roles.Admin,
      groupId: 1,
      parentGroupId: null,
      leadPriorities: []
    });

    await userRepository.save(adminUser);
    console.log("🎉 Usuario admin creado exitosamente");
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
  } catch (error) {
    console.error("❌ Error creando usuario admin:", error);
  }
}

dataSource
  .initialize()
  .then(async () => {
    console.log("Data Source initialized");
    // Crear usuario admin si no existe
    await seedAdminUser();
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
