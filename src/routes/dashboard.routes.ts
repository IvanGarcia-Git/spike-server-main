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

// ===== NUEVAS RUTAS FACTURACIÓN =====
router.get('/facturacion/ingresos-por-tarifa', (req, res) => dashboardController.getIngresosPorTarifa(req, res));
router.get('/facturacion/cobrado-vs-por-cobrar', (req, res) => dashboardController.getCobradoVsPorCobrar(req, res));
router.get('/facturacion/fuentes-ingreso', (req, res) => dashboardController.getFuentesIngreso(req, res));
router.get('/facturacion/objetivos-venta', (req, res) => dashboardController.getObjetivosVenta(req, res));
router.get('/facturacion/ingresos-recurrentes', (req, res) => dashboardController.getIngresosRecurrentes(req, res));

// ===== NUEVAS RUTAS COLABORADORES/AGENTES =====
router.get('/colaborador/:userId/stats', (req, res) => dashboardController.getColaboradorStats(req, res));
router.get('/colaborador/:userId/clientes-por-tipo', (req, res) => dashboardController.getClientesPorTipo(req, res));
router.get('/colaborador/:userId/historial-comisiones', (req, res) => dashboardController.getHistorialComisionesPorUsuario(req, res));
router.get('/colaborador/:userId/cumplimiento-objetivo', (req, res) => dashboardController.getCumplimientoObjetivo(req, res));
router.get('/colaborador/:userId/historico-mensual', (req, res) => dashboardController.getHistoricoMensual(req, res));
router.get('/tiempos-activacion', (req, res) => dashboardController.getTiemposActivacionPorCompania(req, res));

// ===== NUEVAS RUTAS CLIENTES/CONTRATOS =====
router.get('/clientes/distribucion', (req, res) => dashboardController.getDistribucionClientes(req, res));
router.get('/clientes/por-servicios', (req, res) => dashboardController.getDistribucionPorServicios(req, res));
router.get('/clientes/por-compania', (req, res) => dashboardController.getDistribucionPorCompania(req, res));
router.get('/clientes/referidos', (req, res) => dashboardController.getClientesReferidos(req, res));
router.get('/contratos/renovables', (req, res) => dashboardController.getContratosRenovables(req, res));

// ===== NUEVAS RUTAS PIZARRA SEMANAL =====
router.get('/pizarra/en-vivo', (req, res) => dashboardController.getPizarraEnVivo(req, res));
router.get('/pizarra/ventas-por-turno', (req, res) => dashboardController.getVentasPorTurno(req, res));

router.get('/', (req, res) => dashboardController.getFullDashboard(req, res));

export default router;