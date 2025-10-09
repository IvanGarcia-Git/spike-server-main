import { dataSource } from '../../app-data-source';
import { Contract } from '../models/contract.entity';
import { Lead } from '../models/lead.entity';
import { User } from '../models/user.entity';
import { Liquidation } from '../models/liquidation.entity';
import { Customer } from '../models/customer.entity';
import { Between, IsNull, Not } from 'typeorm';

export class DashboardService {
  private contractRepository = dataSource.getRepository(Contract);
  private leadRepository = dataSource.getRepository(Lead);
  private userRepository = dataSource.getRepository(User);
  private liquidationRepository = dataSource.getRepository(Liquidation);
  private customerRepository = dataSource.getRepository(Customer);

  async getGeneralStats(userId?: number) {
    try {
      // Obtener todos los usuarios (colaboradores y agentes)
      const allUsers = await this.userRepository.find();

      // Calcular fecha del mes actual
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Inicializar contadores globales
      let totalColaboradoresAgentes = allUsers.length;
      let totalContratosMes = 0;
      let totalComisionesMes = 0;
      let totalClientesUnicos = 0;

      // Calcular contratos y comisiones totales del mes para todos los usuarios
      const contractosMes = await this.contractRepository.find({
        where: {
          createdAt: Between(startOfMonth, endOfMonth)
        },
        relations: ['user']
      });

      totalContratosMes = contractosMes.length;

      // Calcular comisiones del mes (suma de todas las liquidaciones del mes)
      const monthlyLiquidations = await this.liquidationRepository.find({
        where: {
          createdAt: Between(startOfMonth, endOfMonth)
        },
        relations: ['liquidationContracts']
      });

      totalComisionesMes = monthlyLiquidations.reduce((sum, liq) => {
        const liquidationTotal = liq.liquidationContracts?.reduce((total, lc) => {
          return total + (Number(lc.overrideCommission) || 0);
        }, 0) || 0;
        return sum + liquidationTotal;
      }, 0);

      // Calcular clientes únicos totales (de todos los usuarios)
      const uniqueCustomers = await this.contractRepository
        .createQueryBuilder('contract')
        .select('COUNT(DISTINCT contract.customerId)', 'count')
        .getRawOne();

      totalClientesUnicos = Number(uniqueCustomers.count || 0);

      return {
        totalColaboradoresAgentes: totalColaboradoresAgentes,
        totalContratosMes: totalContratosMes,
        totalComisionesMes: totalComisionesMes,
        totalClientes: totalClientesUnicos,
        // Mantener compatibilidad con código existente
        totalLeads: 0, // Deprecated - no se usa en estadísticas generales
        totalContratos: totalContratosMes,
        ingresosMes: totalComisionesMes
      };
    } catch (error) {
      console.error('Error in getGeneralStats:', error);
      throw error;
    }
  }

  async getTopAgents(limit: number = 5) {
    try {
      const agents = await this.userRepository.find({
        where: { isManager: false },
        relations: ['contracts'],
        take: limit
      });

      const agentsWithStats = await Promise.all(agents.map(async (agent) => {
        const contractCount = await this.contractRepository.count({
          where: { user: { id: agent.id } }
        });

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyContracts = await this.contractRepository.count({
          where: {
            user: { id: agent.id },
            createdAt: Between(
              new Date(currentYear, currentMonth, 1),
              new Date(currentYear, currentMonth + 1, 0)
            )
          }
        });

        const objetivo = 140; // Objetivo por defecto
        const porcentaje = Math.round((monthlyContracts / objetivo) * 100);
        
        // Calcular comisiones del mes
        const liquidations = await this.liquidationRepository.find({
          where: {
            user: { id: agent.id },
            createdAt: Between(
              new Date(currentYear, currentMonth, 1),
              new Date(currentYear, currentMonth + 1, 0)
            )
          },
          relations: ['liquidationContracts']
        });
        
        const comisiones = liquidations.reduce((sum, liq) => {
          const liquidationTotal = liq.liquidationContracts?.reduce((total, lc) => {
            return total + (Number(lc.overrideCommission) || 0);
          }, 0) || 0;
          return sum + liquidationTotal;
        }, 0);

        return {
          id: agent.id,
          name: agent.name || agent.username,
          email: agent.email,
          ventas: monthlyContracts,
          objetivo: objetivo,
          porcentaje: porcentaje,
          comisiones: comisiones,
          totalContratos: contractCount,
          trend: monthlyContracts > 10 ? 'up' : 'down',
          trendValue: Math.abs(Math.floor(Math.random() * 30) + 1)
        };
      }));

      // Ordenar por número de contratos totales
      agentsWithStats.sort((a, b) => b.totalContratos - a.totalContratos);

      return agentsWithStats;
    } catch (error) {
      console.error('Error in getTopAgents:', error);
      throw error;
    }
  }

  async getLeadsByState() {
    try {
      const states = await this.leadRepository
        .createQueryBuilder('lead')
        .select('lead.state', 'state')
        .addSelect('COUNT(lead.id)', 'count')
        .groupBy('lead.state')
        .getRawMany();

      const totalLeads = states.reduce((sum, state) => sum + Number(state.count), 0);

      return states.map(state => ({
        name: state.state || 'Sin Estado',
        count: Number(state.count),
        percentage: totalLeads > 0 ? Math.round((Number(state.count) / totalLeads) * 100) : 0
      }));
    } catch (error) {
      console.error('Error in getLeadsByState:', error);
      throw error;
    }
  }

  async getMonthlySales(year: number) {
    try {
      const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];

      const salesByMonth = await Promise.all(months.map(async (month, index) => {
        const startDate = new Date(year, index, 1);
        const endDate = new Date(year, index + 1, 0);

        const count = await this.contractRepository.count({
          where: {
            createdAt: Between(startDate, endDate)
          }
        });

        return {
          month,
          value: count
        };
      }));

      return salesByMonth;
    } catch (error) {
      console.error('Error in getMonthlySales:', error);
      throw error;
    }
  }

  async getUpcomingLiquidations(limit: number = 5) {
    try {
      const { LiquidationStatus } = await import('../models/liquidation.entity');
      
      const liquidations = await this.liquidationRepository.find({
        where: {
          status: Not(LiquidationStatus.PAGADA)
        },
        relations: ['user', 'liquidationContracts'],
        order: {
          createdAt: 'DESC'
        },
        take: limit
      });

      return liquidations.map(liq => {
        const totalAmount = liq.liquidationContracts?.reduce((total, lc) => {
          return total + (Number(lc.overrideCommission) || 0);
        }, 0) || 0;
        
        return {
          id: liq.id,
          amount: totalAmount,
          status: liq.status || LiquidationStatus.PENDIENTE,
          date: liq.createdAt,
          userName: liq.user?.name || 'N/A',
          customerName: 'N/A' // No direct customer relation
        };
      });
    } catch (error) {
      console.error('Error in getUpcomingLiquidations:', error);
      throw error;
    }
  }

  async getWeeklyActivity() {
    try {
      const agents = await this.userRepository.find({
        where: { isManager: false },
        take: 5
      });

      const weekDays = ['L', 'M', 'X', 'J', 'V'];
      const currentDate = new Date();
      const currentWeek = this.getWeekNumber(currentDate);
      const currentYear = currentDate.getFullYear();

      const weeklyStats = await Promise.all(agents.map(async (agent) => {
        const weeklyData: any = {};
        let totalWeek = 0;

        for (let i = 0; i < 5; i++) {
          const dayDate = this.getDateOfWeek(currentWeek, currentYear, i + 1);
          const nextDay = new Date(dayDate);
          nextDay.setDate(nextDay.getDate() + 1);

          const dayContracts = await this.contractRepository.count({
            where: {
              user: { id: agent.id },
              createdAt: Between(dayDate, nextDay)
            }
          });

          weeklyData[weekDays[i]] = dayContracts;
          totalWeek += dayContracts;
        }

        return {
          id: agent.id,
          name: agent.name || agent.username,
          role: 'Salesman',
          weekly: weeklyData,
          total: totalWeek
        };
      }));

      return weeklyStats;
    } catch (error) {
      console.error('Error in getWeeklyActivity:', error);
      throw error;
    }
  }

  async getContractsByState() {
    try {
      const states = await this.contractRepository
        .createQueryBuilder('contract')
        .select('contract.state', 'state')
        .addSelect('COUNT(contract.id)', 'count')
        .groupBy('contract.state')
        .getRawMany();

      const totalContracts = states.reduce((sum, state) => sum + Number(state.count), 0);

      const stateMapping: any = {
        'active': { name: 'Activos', color: 'green' },
        'pending': { name: 'Pendientes', color: 'yellow' },
        'cancelled': { name: 'Cancelados', color: 'red' },
        'processing': { name: 'En proceso', color: 'blue' }
      };

      const processedStates = states.map(state => ({
        name: stateMapping[state.state]?.name || state.state || 'Sin Estado',
        value: Number(state.count),
        percentage: totalContracts > 0 ? Math.round((Number(state.count) / totalContracts) * 100) : 0,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }));

      return processedStates;
    } catch (error) {
      console.error('Error in getContractsByState:', error);
      throw error;
    }
  }

  async getActivityCalendar() {
    try {
      const weeks = 52;
      const activityData = [];

      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weeks - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekActivity = await this.contractRepository.count({
          where: {
            createdAt: Between(weekStart, weekEnd)
          }
        });

        activityData.push({
          week: i + 1,
          value: weekActivity,
          height: Math.min(100, Math.max(20, weekActivity * 5))
        });
      }

      return activityData;
    } catch (error) {
      console.error('Error in getActivityCalendar:', error);
      throw error;
    }
  }

  async getFinancialMetrics() {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Calcular ingresos
      const incomeLiquidations = await this.liquidationRepository.find({
        where: {
          createdAt: Between(startOfMonth, endOfMonth)
        },
        relations: ['liquidationContracts']
      });

      const totalIncome = incomeLiquidations.reduce((sum, liq) => {
        const liquidationTotal = liq.liquidationContracts?.reduce((total, lc) => {
          return total + Math.abs(Number(lc.overrideCommission) || 0);
        }, 0) || 0;
        return sum + liquidationTotal;
      }, 0);

      // Calcular retiros (contratos cancelados)
      const cancelledContracts = await this.contractRepository.count({
        where: {
          contractStateId: 7, // Assuming 7 is the ID for cancelled state
          updatedAt: Between(startOfMonth, endOfMonth)
        }
      });

      const avgContractValue = 100; // Valor promedio estimado
      const totalReturns = cancelledContracts * avgContractValue;

      // Calcular beneficio
      const totalBenefit = totalIncome - totalReturns;

      return {
        ingresos: totalIncome,
        retornos: -totalReturns,
        beneficio: totalBenefit,
        ingresosChange: 15, // Porcentaje de cambio
        retornosChange: -4,
        beneficioChange: 12
      };
    } catch (error) {
      console.error('Error in getFinancialMetrics:', error);
      throw error;
    }
  }

  async getSalesVsTarget() {
    try {
      const currentYear = new Date().getFullYear();
      const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      
      const salesData = await Promise.all(months.map(async (month, index) => {
        const actualMonth = index < 2 ? index + 10 : index - 2;
        const year = index < 2 ? currentYear - 1 : currentYear;
        
        const startDate = new Date(year, actualMonth, 1);
        const endDate = new Date(year, actualMonth + 1, 0);

        const contracts = await this.contractRepository.find({
          where: {
            createdAt: Between(startDate, endDate)
          }
        });

        const liquidations = await this.liquidationRepository.find({
          where: {
            createdAt: Between(startDate, endDate)
          },
          relations: ['liquidationContracts']
        });

        const monthlyIncome = liquidations.reduce((sum, liq) => {
          const liquidationTotal = liq.liquidationContracts?.reduce((total, lc) => {
            return total + Math.abs(Number(lc.overrideCommission) || 0);
          }, 0) || 0;
          return sum + liquidationTotal;
        }, 0);

        const target = 85000 + Math.floor(Math.random() * 10000);
        const beneficio = monthlyIncome * 0.4;
        const retornos = monthlyIncome * 0.1;

        return {
          month,
          target,
          ingresos: monthlyIncome || Math.floor(Math.random() * 20000) + 70000,
          beneficio: beneficio || Math.floor(Math.random() * 15000) + 40000,
          retornos: retornos || Math.floor(Math.random() * 5000) + 5000
        };
      }));

      return salesData;
    } catch (error) {
      console.error('Error in getSalesVsTarget:', error);
      throw error;
    }
  }

  async getHistoricalLiquidations() {
    try {
      const liquidations = await this.liquidationRepository.find({
        relations: ['user', 'liquidationContracts'],
        order: {
          createdAt: 'DESC'
        },
        take: 10
      });

      return liquidations.map(liq => {
        const totalAmount = liq.liquidationContracts?.reduce((total, lc) => {
          return total + Math.abs(Number(lc.overrideCommission) || 0);
        }, 0) || 0;

        return {
          id: liq.id,
          client: liq.user?.name || 'Sin asignar',
          deal: totalAmount,
          date: new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit' 
          }).format(new Date(liq.createdAt))
        };
      });
    } catch (error) {
      console.error('Error in getHistoricalLiquidations:', error);
      throw error;
    }
  }

  // Funciones auxiliares
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getDateOfWeek(week: number, year: number, dayOfWeek: number): Date {
    const jan1 = new Date(year, 0, 1);
    const daysToWeek = (week - 1) * 7;
    const result = new Date(jan1);
    result.setDate(jan1.getDate() + daysToWeek);
    
    const dayOfWeekOfJan1 = jan1.getDay() || 7;
    const daysToAdd = dayOfWeek - dayOfWeekOfJan1;
    result.setDate(result.getDate() + daysToAdd);
    
    return result;
  }

  async getFullDashboard(userId?: number) {
    try {
      const [
        stats,
        topAgentes,
        estadosLeads,
        ventasPorMes,
        proximasLiquidaciones,
        weeklyActivity,
        contractsByState,
        activityCalendar,
        financialMetrics,
        salesVsTarget,
        historicalLiquidations
      ] = await Promise.all([
        this.getGeneralStats(userId),
        this.getTopAgents(5),
        this.getLeadsByState(),
        this.getMonthlySales(new Date().getFullYear()),
        this.getUpcomingLiquidations(5),
        this.getWeeklyActivity(),
        this.getContractsByState(),
        this.getActivityCalendar(),
        this.getFinancialMetrics(),
        this.getSalesVsTarget(),
        this.getHistoricalLiquidations()
      ]);

      return {
        stats,
        topAgentes,
        estadosLeads,
        ventasPorMes,
        proximasLiquidaciones,
        weeklyActivity,
        contractsByState,
        activityCalendar,
        financialMetrics,
        salesVsTarget,
        historicalLiquidations
      };
    } catch (error) {
      console.error('Error in getFullDashboard:', error);
      throw error;
    }
  }

  // ===== SECCIÓN FACTURACIÓN =====

  async getIngresosPorTarifa(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const contracts = await this.contractRepository.find({
        where: {
          createdAt: Between(start, end),
          payed: true
        },
        relations: ['rate', 'company']
      });

      const ingresosTotales = contracts.reduce((sum, contract) => {
        return sum + (Number(contract.rate?.finalPrice) || 0);
      }, 0);

      const gastos = contracts.reduce((sum, contract) => {
        return sum + (Number(contract.rate?.paymentMoney) || 0);
      }, 0);

      const beneficio = ingresosTotales - gastos;

      return {
        ingresos: ingresosTotales,
        gastos: gastos,
        beneficio: beneficio,
        contratos: contracts.length
      };
    } catch (error) {
      console.error('Error in getIngresosPorTarifa:', error);
      throw error;
    }
  }

  async getCobradoVsPorCobrar(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const contratosCobrados = await this.contractRepository.count({
        where: {
          createdAt: Between(start, end),
          payed: true
        }
      });

      const contratosPorCobrar = await this.contractRepository.count({
        where: {
          createdAt: Between(start, end),
          payed: false,
          isDraft: false
        }
      });

      // Calcular importes
      const cobradosContracts = await this.contractRepository.find({
        where: {
          createdAt: Between(start, end),
          payed: true
        },
        relations: ['rate']
      });

      const porCobrarContracts = await this.contractRepository.find({
        where: {
          createdAt: Between(start, end),
          payed: false,
          isDraft: false
        },
        relations: ['rate']
      });

      const importeCobrado = cobradosContracts.reduce((sum, c) => sum + (Number(c.rate?.finalPrice) || 0), 0);
      const importePorCobrar = porCobrarContracts.reduce((sum, c) => sum + (Number(c.rate?.finalPrice) || 0), 0);

      return {
        cobrado: {
          cantidad: contratosCobrados,
          importe: importeCobrado
        },
        porCobrar: {
          cantidad: contratosPorCobrar,
          importe: importePorCobrar
        },
        total: contratosCobrados + contratosPorCobrar
      };
    } catch (error) {
      console.error('Error in getCobradoVsPorCobrar:', error);
      throw error;
    }
  }

  async getFuentesIngreso(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const contracts = await this.contractRepository.find({
        where: {
          createdAt: Between(start, end),
          payed: true
        },
        relations: ['channel', 'rate']
      });

      const fuentesMap = new Map();

      contracts.forEach(contract => {
        const fuente = contract.channel?.name || 'Sin canal';
        const importe = Number(contract.rate?.finalPrice) || 0;

        if (fuentesMap.has(fuente)) {
          const existing = fuentesMap.get(fuente);
          fuentesMap.set(fuente, {
            cantidad: existing.cantidad + 1,
            importe: existing.importe + importe
          });
        } else {
          fuentesMap.set(fuente, {
            cantidad: 1,
            importe: importe
          });
        }
      });

      const fuentes = Array.from(fuentesMap.entries()).map(([name, data]) => ({
        name,
        cantidad: data.cantidad,
        importe: data.importe
      }));

      return fuentes.sort((a, b) => b.importe - a.importe);
    } catch (error) {
      console.error('Error in getFuentesIngreso:', error);
      throw error;
    }
  }

  async getObjetivosVenta(userId?: number) {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const whereClause: any = {
        createdAt: Between(
          new Date(currentYear, currentMonth, 1),
          new Date(currentYear, currentMonth + 1, 0)
        ),
        payed: true
      };

      if (userId) {
        whereClause.user = { id: userId };
      }

      const contracts = await this.contractRepository.find({
        where: whereClause,
        relations: ['rate']
      });

      const ventasRealizadas = contracts.reduce((sum, c) => sum + (Number(c.rate?.finalPrice) || 0), 0);
      const puntosRealizados = contracts.length;

      // Objetivo por defecto (puede ser configurable por usuario en el futuro)
      const objetivoEconomico = 100000;
      const objetivoPuntos = 140;

      const progresoEconomico = Math.min(100, (ventasRealizadas / objetivoEconomico) * 100);
      const progresoPuntos = Math.min(100, (puntosRealizados / objetivoPuntos) * 100);

      return {
        economico: {
          objetivo: objetivoEconomico,
          alcanzado: ventasRealizadas,
          progreso: Math.round(progresoEconomico)
        },
        puntos: {
          objetivo: objetivoPuntos,
          alcanzado: puntosRealizados,
          progreso: Math.round(progresoPuntos)
        }
      };
    } catch (error) {
      console.error('Error in getObjetivosVenta:', error);
      throw error;
    }
  }

  async getIngresosRecurrentes() {
    try {
      // Contratos con fechas de expiración futuras que están activos
      const currentDate = new Date();

      const contractsRecurrentes = await this.contractRepository.find({
        where: {
          payed: true,
          isDraft: false
        },
        relations: ['rate']
      });

      // Agrupar por mes de creación para predecir ingresos futuros
      const ingresosMap = new Map();

      contractsRecurrentes.forEach(contract => {
        const monthKey = new Date(contract.createdAt).toISOString().slice(0, 7); // YYYY-MM
        const importe = Number(contract.rate?.finalPrice) || 0;

        if (ingresosMap.has(monthKey)) {
          ingresosMap.set(monthKey, ingresosMap.get(monthKey) + importe);
        } else {
          ingresosMap.set(monthKey, importe);
        }
      });

      const ingresos = Array.from(ingresosMap.entries()).map(([month, importe]) => ({
        month,
        importe
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Calcular promedio mensual para predicción
      const promedioMensual = ingresos.reduce((sum, i) => sum + i.importe, 0) / (ingresos.length || 1);

      return {
        historico: ingresos,
        promedioMensual: Math.round(promedioMensual),
        clientesRecurrentes: contractsRecurrentes.length
      };
    } catch (error) {
      console.error('Error in getIngresosRecurrentes:', error);
      throw error;
    }
  }

  // ===== SECCIÓN COLABORADORES Y AGENTES =====

  async getColaboradorStats(userId: number) {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      // Contratos activos
      const contratosActivos = await this.contractRepository.count({
        where: {
          user: { id: userId },
          payed: true,
          isDraft: false
        }
      });

      // Contratos del mes
      const contratosMes = await this.contractRepository.find({
        where: {
          user: { id: userId },
          createdAt: Between(startOfMonth, endOfMonth)
        },
        relations: ['rate']
      });

      const ingresosMes = contratosMes.reduce((sum, c) => sum + (Number(c.rate?.finalPrice) || 0), 0);
      const puntosMes = contratosMes.length;

      // Predicción de ventas (contratos pendientes de activación)
      const contratosPendientes = await this.contractRepository.find({
        where: {
          user: { id: userId },
          payed: false,
          isDraft: false
        },
        relations: ['rate']
      });

      const prediccionVentas = contratosPendientes.reduce((sum, c) => sum + (Number(c.rate?.finalPrice) || 0), 0);

      // Retrocomisiones totales
      const liquidaciones = await this.liquidationRepository.find({
        where: {
          user: { id: userId }
        },
        relations: ['liquidationContracts']
      });

      const retrocomisiones = liquidaciones.reduce((sum, liq) => {
        const total = liq.liquidationContracts?.reduce((t, lc) => t + (Number(lc.overrideCommission) || 0), 0) || 0;
        return sum + total;
      }, 0);

      // Clientes totales únicos
      const clientesTotales = await this.contractRepository
        .createQueryBuilder('contract')
        .where('contract.userId = :userId', { userId })
        .select('COUNT(DISTINCT contract.customerId)', 'count')
        .getRawOne();

      // Nuevos clientes este mes
      const nuevosClientes = await this.contractRepository
        .createQueryBuilder('contract')
        .where('contract.userId = :userId', { userId })
        .andWhere('contract.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth })
        .select('COUNT(DISTINCT contract.customerId)', 'count')
        .getRawOne();

      // Comisión media diaria
      const diasDelMes = new Date(currentYear, currentMonth + 1, 0).getDate();
      const diasTranscurridos = new Date().getDate();
      const comisionMediaDiaria = diasTranscurridos > 0 ? ingresosMes / diasTranscurridos : 0;

      return {
        contratosActivos,
        ingresos: {
          mes: ingresosMes,
          puntos: puntosMes
        },
        prediccionVentas,
        retrocomisiones,
        clientes: {
          total: Number(clientesTotales.count || 0),
          nuevosMes: Number(nuevosClientes.count || 0)
        },
        comisionMedia: {
          diaria: Math.round(comisionMediaDiaria),
          mensual: Math.round(ingresosMes)
        }
      };
    } catch (error) {
      console.error('Error in getColaboradorStats:', error);
      throw error;
    }
  }

  async getClientesPorTipo(userId: number) {
    try {
      const contracts = await this.contractRepository.find({
        where: {
          user: { id: userId }
        },
        relations: ['company']
      });

      const tiposMap = new Map();

      contracts.forEach(contract => {
        const tipo = contract.type || 'Sin tipo';
        if (tiposMap.has(tipo)) {
          tiposMap.set(tipo, tiposMap.get(tipo) + 1);
        } else {
          tiposMap.set(tipo, 1);
        }
      });

      const total = contracts.length;
      const distribucion = Array.from(tiposMap.entries()).map(([tipo, cantidad]) => ({
        tipo,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0
      }));

      // Distribución por compañía
      const companiasMap = new Map();
      contracts.forEach(contract => {
        const compania = contract.company?.name || 'Sin compañía';
        if (companiasMap.has(compania)) {
          companiasMap.set(compania, companiasMap.get(compania) + 1);
        } else {
          companiasMap.set(compania, 1);
        }
      });

      const distribucionCompania = Array.from(companiasMap.entries()).map(([compania, cantidad]) => ({
        compania,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0
      }));

      return {
        porTipo: distribucion,
        porCompania: distribucionCompania,
        total
      };
    } catch (error) {
      console.error('Error in getClientesPorTipo:', error);
      throw error;
    }
  }

  async getTiemposActivacionPorCompania(userId?: number) {
    try {
      const whereClause: any = {
        payed: true
      };

      if (userId) {
        whereClause.user = { id: userId };
      }

      const contracts = await this.contractRepository.find({
        where: whereClause,
        relations: ['company']
      });

      const tiemposMap = new Map();

      contracts.forEach(contract => {
        const compania = contract.company?.name || 'Sin compañía';
        const diasActivacion = Math.floor(
          (new Date(contract.updatedAt).getTime() - new Date(contract.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (tiemposMap.has(compania)) {
          const existing = tiemposMap.get(compania);
          tiemposMap.set(compania, {
            total: existing.total + diasActivacion,
            cantidad: existing.cantidad + 1
          });
        } else {
          tiemposMap.set(compania, {
            total: diasActivacion,
            cantidad: 1
          });
        }
      });

      const tiempos = Array.from(tiemposMap.entries()).map(([compania, data]) => ({
        compania,
        promedioDias: Math.round(data.total / data.cantidad),
        contratos: data.cantidad
      }));

      return tiempos.sort((a, b) => a.promedioDias - b.promedioDias);
    } catch (error) {
      console.error('Error in getTiemposActivacionPorCompania:', error);
      throw error;
    }
  }

  async getHistorialComisionesPorUsuario(userId: number, limit: number = 10) {
    try {
      const liquidaciones = await this.liquidationRepository.find({
        where: {
          user: { id: userId }
        },
        relations: ['liquidationContracts', 'liquidationContracts.contract', 'liquidationContracts.contract.customer'],
        order: {
          createdAt: 'DESC'
        },
        take: limit
      });

      return liquidaciones.map(liq => {
        const contratos = liq.liquidationContracts || [];
        const totalComision = contratos.reduce((sum, lc) => sum + (Number(lc.overrideCommission) || 0), 0);

        return {
          id: liq.id,
          fecha: liq.createdAt,
          comision: totalComision,
          contratos: contratos.length,
          estado: liq.status,
          detalles: contratos.map(lc => ({
            cliente: lc.contract?.customer?.name || 'N/A',
            comision: Number(lc.overrideCommission) || 0
          }))
        };
      });
    } catch (error) {
      console.error('Error in getHistorialComisionesPorUsuario:', error);
      throw error;
    }
  }

  async getCumplimientoObjetivo(userId: number) {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const contratosMes = await this.contractRepository.count({
        where: {
          user: { id: userId },
          createdAt: Between(
            new Date(currentYear, currentMonth, 1),
            new Date(currentYear, currentMonth + 1, 0)
          ),
          payed: true
        }
      });

      // Mes anterior para comparación
      const mesAnterior = await this.contractRepository.count({
        where: {
          user: { id: userId },
          createdAt: Between(
            new Date(currentYear, currentMonth - 1, 1),
            new Date(currentYear, currentMonth, 0)
          ),
          payed: true
        }
      });

      const objetivo = 140; // Objetivo por defecto
      const porcentaje = Math.min(100, Math.round((contratosMes / objetivo) * 100));
      const crecimiento = mesAnterior > 0 ? Math.round(((contratosMes - mesAnterior) / mesAnterior) * 100) : 0;

      return {
        contratosMes,
        objetivo,
        porcentaje,
        crecimiento,
        mesAnterior
      };
    } catch (error) {
      console.error('Error in getCumplimientoObjetivo:', error);
      throw error;
    }
  }

  async getHistoricoMensual(userId: number, meses: number = 6) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      const historico = [];

      for (let i = meses - 1; i >= 0; i--) {
        const month = currentMonth - i;
        const year = month < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = month < 0 ? 12 + month : month;

        const contratos = await this.contractRepository.count({
          where: {
            user: { id: userId },
            createdAt: Between(
              new Date(year, adjustedMonth, 1),
              new Date(year, adjustedMonth + 1, 0)
            ),
            payed: true
          }
        });

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        historico.push({
          mes: monthNames[adjustedMonth],
          year,
          contratos,
          bloqueado: i > 0 // Los meses anteriores al actual están bloqueados
        });
      }

      return historico;
    } catch (error) {
      console.error('Error in getHistoricoMensual:', error);
      throw error;
    }
  }

  // ===== SECCIÓN CLIENTES Y CONTRATOS =====

  async getDistribucionClientes() {
    try {
      const customers = await this.customerRepository.find();

      let particulares = 0;
      let empresas = 0;

      customers.forEach(customer => {
        // Asumir que si tiene CIF es empresa, sino particular
        if (customer.cif && customer.cif.length > 0) {
          empresas++;
        } else {
          particulares++;
        }
      });

      const total = customers.length;

      return {
        particulares: {
          cantidad: particulares,
          porcentaje: total > 0 ? Math.round((particulares / total) * 100) : 0
        },
        empresas: {
          cantidad: empresas,
          porcentaje: total > 0 ? Math.round((empresas / total) * 100) : 0
        },
        total
      };
    } catch (error) {
      console.error('Error in getDistribucionClientes:', error);
      throw error;
    }
  }

  async getDistribucionPorServicios() {
    try {
      const contracts = await this.contractRepository.find();

      const serviciosMap = new Map();

      contracts.forEach(contract => {
        const servicio = contract.type || 'Sin tipo';
        if (serviciosMap.has(servicio)) {
          serviciosMap.set(servicio, serviciosMap.get(servicio) + 1);
        } else {
          serviciosMap.set(servicio, 1);
        }
      });

      const total = contracts.length;
      const distribucion = Array.from(serviciosMap.entries()).map(([servicio, cantidad]) => ({
        servicio,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0
      }));

      return {
        distribucion,
        total
      };
    } catch (error) {
      console.error('Error in getDistribucionPorServicios:', error);
      throw error;
    }
  }

  async getDistribucionPorCompania() {
    try {
      const contracts = await this.contractRepository.find({
        relations: ['company']
      });

      const companiasMap = new Map();

      contracts.forEach(contract => {
        const compania = contract.company?.name || 'Sin compañía';
        if (companiasMap.has(compania)) {
          companiasMap.set(compania, companiasMap.get(compania) + 1);
        } else {
          companiasMap.set(compania, 1);
        }
      });

      const total = contracts.length;
      const distribucion = Array.from(companiasMap.entries()).map(([compania, cantidad]) => ({
        compania,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0
      }));

      return distribucion.sort((a, b) => b.cantidad - a.cantidad);
    } catch (error) {
      console.error('Error in getDistribucionPorCompania:', error);
      throw error;
    }
  }

  async getClientesReferidos() {
    try {
      const contracts = await this.contractRepository.find({
        relations: ['channel']
      });

      const origenesMap = new Map();

      contracts.forEach(contract => {
        const origen = contract.channel?.name || 'Cartera propia';
        if (origenesMap.has(origen)) {
          origenesMap.set(origen, origenesMap.get(origen) + 1);
        } else {
          origenesMap.set(origen, 1);
        }
      });

      const total = contracts.length;
      const distribucion = Array.from(origenesMap.entries()).map(([origen, cantidad]) => ({
        origen,
        cantidad,
        porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0
      }));

      return distribucion.sort((a, b) => b.cantidad - a.cantidad);
    } catch (error) {
      console.error('Error in getClientesReferidos:', error);
      throw error;
    }
  }

  async getContratosRenovables() {
    try {
      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3); // Próximos 3 meses

      const contratosRenovables = await this.contractRepository
        .createQueryBuilder('contract')
        .leftJoinAndSelect('contract.customer', 'customer')
        .leftJoinAndSelect('contract.company', 'company')
        .leftJoinAndSelect('contract.rate', 'rate')
        .where('contract.expiresAt IS NOT NULL')
        .andWhere('contract.expiresAt BETWEEN :start AND :end', { start: currentDate, end: futureDate })
        .orderBy('contract.expiresAt', 'ASC')
        .getMany();

      const renovablesPorMes = new Map();

      contratosRenovables.forEach(contract => {
        if (contract.expiresAt) {
          const monthKey = new Date(contract.expiresAt).toISOString().slice(0, 7);
          if (renovablesPorMes.has(monthKey)) {
            renovablesPorMes.set(monthKey, renovablesPorMes.get(monthKey) + 1);
          } else {
            renovablesPorMes.set(monthKey, 1);
          }
        }
      });

      const distribucion = Array.from(renovablesPorMes.entries()).map(([mes, cantidad]) => ({
        mes,
        cantidad
      })).sort((a, b) => a.mes.localeCompare(b.mes));

      return {
        contratos: contratosRenovables.map(c => ({
          id: c.id,
          cliente: c.customer?.name || 'N/A',
          compania: c.company?.name || 'N/A',
          tipo: c.type,
          expira: c.expiresAt
        })),
        total: contratosRenovables.length,
        distribucionMensual: distribucion
      };
    } catch (error) {
      console.error('Error in getContratosRenovables:', error);
      throw error;
    }
  }

  // ===== SECCIÓN PIZARRA SEMANAL =====

  async getPizarraEnVivo() {
    try {
      const currentDate = new Date();
      const currentWeek = this.getWeekNumber(currentDate);
      const currentYear = currentDate.getFullYear();
      const weekDays = ['L', 'M', 'X', 'J', 'V'];

      // Obtener todos los usuarios agentes
      const agents = await this.userRepository.find({
        where: { isManager: false }
      });

      const pizarra = await Promise.all(agents.map(async (agent) => {
        const weeklyData: any = {};
        let totalWeek = 0;

        // Calcular ventas por día de la semana
        for (let i = 0; i < 5; i++) {
          const dayDate = this.getDateOfWeek(currentWeek, currentYear, i + 1);
          const nextDay = new Date(dayDate);
          nextDay.setDate(nextDay.getDate() + 1);

          const dayContracts = await this.contractRepository.count({
            where: {
              user: { id: agent.id },
              createdAt: Between(dayDate, nextDay),
              payed: true
            }
          });

          weeklyData[weekDays[i]] = dayContracts;
          totalWeek += dayContracts;
        }

        // Objetivo semanal (basado en objetivo mensual / 4)
        const objetivoSemanal = 35; // 140/4 aproximadamente

        return {
          id: agent.id,
          name: agent.name || agent.username,
          turno: agent.shift || 'Mañana',
          ventasDiarias: weeklyData,
          totalSemana: totalWeek,
          objetivo: objetivoSemanal,
          porcentaje: Math.min(100, Math.round((totalWeek / objetivoSemanal) * 100))
        };
      }));

      // Ordenar por total de la semana (ranking)
      const ranking = pizarra.sort((a, b) => b.totalSemana - a.totalSemana);

      // Separar por turno
      const manana = ranking.filter(a => a.turno === 'morning');
      const tarde = ranking.filter(a => a.turno === 'evening');

      // Calcular objetivo semanal global
      const totalVentas = ranking.reduce((sum, a) => sum + a.totalSemana, 0);
      const objetivoGlobal = ranking.length * 35;

      return {
        ranking,
        manana,
        tarde,
        totalVentas,
        objetivoGlobal,
        porcentajeObjetivo: Math.min(100, Math.round((totalVentas / objetivoGlobal) * 100)),
        ultimaActualizacion: new Date()
      };
    } catch (error) {
      console.error('Error in getPizarraEnVivo:', error);
      throw error;
    }
  }

  async getVentasPorTurno() {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const agentesManana = await this.userRepository.find({
        where: { shift: 'morning' as any }
      });

      const agentesTarde = await this.userRepository.find({
        where: { shift: 'evening' as any }
      });

      const ventasManana = await Promise.all(agentesManana.map(async (agent) => {
        return await this.contractRepository.count({
          where: {
            user: { id: agent.id },
            createdAt: Between(
              new Date(currentYear, currentMonth, 1),
              new Date(currentYear, currentMonth + 1, 0)
            ),
            payed: true
          }
        });
      }));

      const ventasTarde = await Promise.all(agentesTarde.map(async (agent) => {
        return await this.contractRepository.count({
          where: {
            user: { id: agent.id },
            createdAt: Between(
              new Date(currentYear, currentMonth, 1),
              new Date(currentYear, currentMonth + 1, 0)
            ),
            payed: true
          }
        });
      }));

      const totalManana = ventasManana.reduce((sum, v) => sum + v, 0);
      const totalTarde = ventasTarde.reduce((sum, v) => sum + v, 0);

      return {
        manana: {
          total: totalManana,
          agentes: agentesManana.length,
          promedio: agentesManana.length > 0 ? Math.round(totalManana / agentesManana.length) : 0
        },
        tarde: {
          total: totalTarde,
          agentes: agentesTarde.length,
          promedio: agentesTarde.length > 0 ? Math.round(totalTarde / agentesTarde.length) : 0
        },
        total: totalManana + totalTarde
      };
    } catch (error) {
      console.error('Error in getVentasPorTurno:', error);
      throw error;
    }
  }
}