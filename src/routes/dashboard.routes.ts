import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateJWT as authenticateToken } from '../middlewares/auth';

const router = Router();
const dashboardController = new DashboardController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas del dashboard
router.get('/stats', (req, res) => dashboardController.getGeneralStats(req, res));
router.get('/top-agents', (req, res) => dashboardController.getTopAgents(req, res));
router.get('/leads-by-state', (req, res) => dashboardController.getLeadsByState(req, res));
router.get('/monthly-sales', (req, res) => dashboardController.getMonthlySales(req, res));
router.get('/upcoming-liquidations', (req, res) => dashboardController.getUpcomingLiquidations(req, res));
router.get('/weekly-activity', (req, res) => dashboardController.getWeeklyActivity(req, res));
router.get('/contracts-by-state', (req, res) => dashboardController.getContractsByState(req, res));
router.get('/activity-calendar', (req, res) => dashboardController.getActivityCalendar(req, res));
router.get('/financial-metrics', (req, res) => dashboardController.getFinancialMetrics(req, res));
router.get('/sales-vs-target', (req, res) => dashboardController.getSalesVsTarget(req, res));
router.get('/historical-liquidations', (req, res) => dashboardController.getHistoricalLiquidations(req, res));
router.get('/', (req, res) => dashboardController.getFullDashboard(req, res));

export default router;