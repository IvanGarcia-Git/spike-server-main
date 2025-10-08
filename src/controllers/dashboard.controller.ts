import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getGeneralStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const stats = await this.dashboardService.getGeneralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting general stats:', error);
      res.status(500).json({ message: 'Error obteniendo estadísticas generales' });
    }
  }

  async getTopAgents(req: Request, res: Response) {
    try {
      const { limit = 5 } = req.query;
      const agents = await this.dashboardService.getTopAgents(Number(limit));
      res.json(agents);
    } catch (error) {
      console.error('Error getting top agents:', error);
      res.status(500).json({ message: 'Error obteniendo top agentes' });
    }
  }

  async getLeadsByState(req: Request, res: Response) {
    try {
      const leadStates = await this.dashboardService.getLeadsByState();
      res.json(leadStates);
    } catch (error) {
      console.error('Error getting leads by state:', error);
      res.status(500).json({ message: 'Error obteniendo leads por estado' });
    }
  }

  async getMonthlySales(req: Request, res: Response) {
    try {
      const { year = new Date().getFullYear() } = req.query;
      const sales = await this.dashboardService.getMonthlySales(Number(year));
      res.json(sales);
    } catch (error) {
      console.error('Error getting monthly sales:', error);
      res.status(500).json({ message: 'Error obteniendo ventas mensuales' });
    }
  }

  async getUpcomingLiquidations(req: Request, res: Response) {
    try {
      const { limit = 5 } = req.query;
      const liquidations = await this.dashboardService.getUpcomingLiquidations(Number(limit));
      res.json(liquidations);
    } catch (error) {
      console.error('Error getting upcoming liquidations:', error);
      res.status(500).json({ message: 'Error obteniendo próximas liquidaciones' });
    }
  }

  async getFullDashboard(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const dashboard = await this.dashboardService.getFullDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      console.error('Error getting full dashboard:', error);
      res.status(500).json({ message: 'Error obteniendo dashboard completo' });
    }
  }

  async getWeeklyActivity(req: Request, res: Response) {
    try {
      const weeklyActivity = await this.dashboardService.getWeeklyActivity();
      res.json(weeklyActivity);
    } catch (error) {
      console.error('Error getting weekly activity:', error);
      res.status(500).json({ message: 'Error obteniendo actividad semanal' });
    }
  }

  async getContractsByState(req: Request, res: Response) {
    try {
      const contracts = await this.dashboardService.getContractsByState();
      res.json(contracts);
    } catch (error) {
      console.error('Error getting contracts by state:', error);
      res.status(500).json({ message: 'Error obteniendo contratos por estado' });
    }
  }

  async getActivityCalendar(req: Request, res: Response) {
    try {
      const calendar = await this.dashboardService.getActivityCalendar();
      res.json(calendar);
    } catch (error) {
      console.error('Error getting activity calendar:', error);
      res.status(500).json({ message: 'Error obteniendo calendario de actividad' });
    }
  }

  async getFinancialMetrics(req: Request, res: Response) {
    try {
      const metrics = await this.dashboardService.getFinancialMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error getting financial metrics:', error);
      res.status(500).json({ message: 'Error obteniendo métricas financieras' });
    }
  }

  async getSalesVsTarget(req: Request, res: Response) {
    try {
      const sales = await this.dashboardService.getSalesVsTarget();
      res.json(sales);
    } catch (error) {
      console.error('Error getting sales vs target:', error);
      res.status(500).json({ message: 'Error obteniendo ventas vs objetivo' });
    }
  }

  async getHistoricalLiquidations(req: Request, res: Response) {
    try {
      const liquidations = await this.dashboardService.getHistoricalLiquidations();
      res.json(liquidations);
    } catch (error) {
      console.error('Error getting historical liquidations:', error);
      res.status(500).json({ message: 'Error obteniendo liquidaciones históricas' });
    }
  }

  // ===== NUEVOS ENDPOINTS FACTURACIÓN =====

  async getIngresosPorTarifa(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const ingresos = await this.dashboardService.getIngresosPorTarifa(start, end);
      res.json(ingresos);
    } catch (error) {
      console.error('Error getting ingresos por tarifa:', error);
      res.status(500).json({ message: 'Error obteniendo ingresos por tarifa' });
    }
  }

  async getCobradoVsPorCobrar(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const data = await this.dashboardService.getCobradoVsPorCobrar(start, end);
      res.json(data);
    } catch (error) {
      console.error('Error getting cobrado vs por cobrar:', error);
      res.status(500).json({ message: 'Error obteniendo cobrado vs por cobrar' });
    }
  }

  async getFuentesIngreso(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const fuentes = await this.dashboardService.getFuentesIngreso(start, end);
      res.json(fuentes);
    } catch (error) {
      console.error('Error getting fuentes ingreso:', error);
      res.status(500).json({ message: 'Error obteniendo fuentes de ingreso' });
    }
  }

  async getObjetivosVenta(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const objetivos = await this.dashboardService.getObjetivosVenta(userId);
      res.json(objetivos);
    } catch (error) {
      console.error('Error getting objetivos venta:', error);
      res.status(500).json({ message: 'Error obteniendo objetivos de venta' });
    }
  }

  async getIngresosRecurrentes(req: Request, res: Response) {
    try {
      const ingresos = await this.dashboardService.getIngresosRecurrentes();
      res.json(ingresos);
    } catch (error) {
      console.error('Error getting ingresos recurrentes:', error);
      res.status(500).json({ message: 'Error obteniendo ingresos recurrentes' });
    }
  }

  // ===== NUEVOS ENDPOINTS COLABORADORES/AGENTES =====

  async getColaboradorStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const stats = await this.dashboardService.getColaboradorStats(Number(userId));
      res.json(stats);
    } catch (error) {
      console.error('Error getting colaborador stats:', error);
      res.status(500).json({ message: 'Error obteniendo estadísticas de colaborador' });
    }
  }

  async getClientesPorTipo(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const distribucion = await this.dashboardService.getClientesPorTipo(Number(userId));
      res.json(distribucion);
    } catch (error) {
      console.error('Error getting clientes por tipo:', error);
      res.status(500).json({ message: 'Error obteniendo clientes por tipo' });
    }
  }

  async getTiemposActivacionPorCompania(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const tiempos = await this.dashboardService.getTiemposActivacionPorCompania(userId);
      res.json(tiempos);
    } catch (error) {
      console.error('Error getting tiempos activacion:', error);
      res.status(500).json({ message: 'Error obteniendo tiempos de activación' });
    }
  }

  async getHistorialComisionesPorUsuario(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;
      const historial = await this.dashboardService.getHistorialComisionesPorUsuario(Number(userId), Number(limit));
      res.json(historial);
    } catch (error) {
      console.error('Error getting historial comisiones:', error);
      res.status(500).json({ message: 'Error obteniendo historial de comisiones' });
    }
  }

  async getCumplimientoObjetivo(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const cumplimiento = await this.dashboardService.getCumplimientoObjetivo(Number(userId));
      res.json(cumplimiento);
    } catch (error) {
      console.error('Error getting cumplimiento objetivo:', error);
      res.status(500).json({ message: 'Error obteniendo cumplimiento de objetivo' });
    }
  }

  async getHistoricoMensual(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { meses = 6 } = req.query;
      const historico = await this.dashboardService.getHistoricoMensual(Number(userId), Number(meses));
      res.json(historico);
    } catch (error) {
      console.error('Error getting historico mensual:', error);
      res.status(500).json({ message: 'Error obteniendo histórico mensual' });
    }
  }

  // ===== NUEVOS ENDPOINTS CLIENTES/CONTRATOS =====

  async getDistribucionClientes(req: Request, res: Response) {
    try {
      const distribucion = await this.dashboardService.getDistribucionClientes();
      res.json(distribucion);
    } catch (error) {
      console.error('Error getting distribucion clientes:', error);
      res.status(500).json({ message: 'Error obteniendo distribución de clientes' });
    }
  }

  async getDistribucionPorServicios(req: Request, res: Response) {
    try {
      const distribucion = await this.dashboardService.getDistribucionPorServicios();
      res.json(distribucion);
    } catch (error) {
      console.error('Error getting distribucion servicios:', error);
      res.status(500).json({ message: 'Error obteniendo distribución por servicios' });
    }
  }

  async getDistribucionPorCompania(req: Request, res: Response) {
    try {
      const distribucion = await this.dashboardService.getDistribucionPorCompania();
      res.json(distribucion);
    } catch (error) {
      console.error('Error getting distribucion compania:', error);
      res.status(500).json({ message: 'Error obteniendo distribución por compañía' });
    }
  }

  async getClientesReferidos(req: Request, res: Response) {
    try {
      const referidos = await this.dashboardService.getClientesReferidos();
      res.json(referidos);
    } catch (error) {
      console.error('Error getting clientes referidos:', error);
      res.status(500).json({ message: 'Error obteniendo clientes referidos' });
    }
  }

  async getContratosRenovables(req: Request, res: Response) {
    try {
      const renovables = await this.dashboardService.getContratosRenovables();
      res.json(renovables);
    } catch (error) {
      console.error('Error getting contratos renovables:', error);
      res.status(500).json({ message: 'Error obteniendo contratos renovables' });
    }
  }

  // ===== NUEVOS ENDPOINTS PIZARRA SEMANAL =====

  async getPizarraEnVivo(req: Request, res: Response) {
    try {
      const pizarra = await this.dashboardService.getPizarraEnVivo();
      res.json(pizarra);
    } catch (error) {
      console.error('Error getting pizarra en vivo:', error);
      res.status(500).json({ message: 'Error obteniendo pizarra en vivo' });
    }
  }

  async getVentasPorTurno(req: Request, res: Response) {
    try {
      const ventas = await this.dashboardService.getVentasPorTurno();
      res.json(ventas);
    } catch (error) {
      console.error('Error getting ventas por turno:', error);
      res.status(500).json({ message: 'Error obteniendo ventas por turno' });
    }
  }
}