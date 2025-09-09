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
}