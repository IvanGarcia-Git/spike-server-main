import { Request, Response, NextFunction } from "express";
import { ComparativaService } from "../services/comparativa.service";
import { InvoiceExtractionService } from "../services/invoice-extraction.service";

/** Calcula el desglose de una factura de luz con los precios unitarios y consumo del cliente. */
const calculateCurrentLightBillBreakdown = (data: any) => {
  const { potencias, energias, numDias, solarPanelActive, excedentes, clientPowerPrices, clientEnergyPrices, clientSurplusPrice, clientMaintenanceCost } = data;
  
  const regulatedCosts = {
    ihp: 5.112926, // 5.112926%
    alquiler: 0.026712, // €/día
    social: 0.038466, // €/día
    iva: 21, // %
  };

  if (!potencias || !energias || !numDias) return null;

  const powerCosts = (potencias as number[]).map((p, i) => {
    const price = clientPowerPrices?.[i] ?? clientPowerPrices?.[clientPowerPrices.length - 1] ?? 0;
    return p * price * numDias;
  });
  const costePotencia = powerCosts.reduce((acc, cost) => acc + cost, 0);

  const energyCosts = (energias as number[]).map((e, i) => {
    const price = clientEnergyPrices?.[i] ?? clientEnergyPrices?.[clientEnergyPrices.length - 1] ?? 0;
    return e * price;
  });
  const costeEnergia = energyCosts.reduce((acc, cost) => acc + cost, 0);

  const surplusCredit = solarPanelActive && excedentes ? excedentes * (clientSurplusPrice ?? 0) : 0;
  const equipmentRental = numDias * regulatedCosts.alquiler;
  const socialBonus = numDias * regulatedCosts.social;

  const baseForTax = costePotencia + costeEnergia - surplusCredit + equipmentRental + socialBonus + (clientMaintenanceCost ?? 0);
  const electricityTax = baseForTax > 0 ? baseForTax * (regulatedCosts.ihp / 100) : 0;
  
  const baseIVA = baseForTax + electricityTax;
  const vat = baseIVA > 0 ? baseIVA * (regulatedCosts.iva / 100) : 0;
  
  const totalCost = baseIVA + vat;

  return {
    totalCost: totalCost > 0 ? totalCost : 0,
    breakdown: {
      powerCosts,
      energyCosts,
      surplusCredit,
      socialBonus,
      equipmentRental,
      maintenanceCost: clientMaintenanceCost ?? 0,
      electricityTax,
      vat,
    },
  };
};

/** Calcula el desglose de una factura de gas con los precios unitarios y consumo del cliente. */
const calculateCurrentGasBillBreakdown = (data: any) => {
  const { energia, numDias, clientFixedPrice, clientGasEnergyPrice, clientMaintenanceCost } = data;
  
  const regulatedCosts = {
    alquiler: 0.026712, // €/día
    hydrocarbon: 0.00234, // €/kWh
    iva: 21, // %
  };

  if (!energia || !numDias) return null;

  const fixedCost = (clientFixedPrice ?? 0) * numDias;
  const energyCost = energia * (clientGasEnergyPrice ?? 0);
  const equipmentRental = numDias * regulatedCosts.alquiler;
  const hydrocarbonTax = energia * regulatedCosts.hydrocarbon;

  const baseForTax = fixedCost + energyCost + equipmentRental + hydrocarbonTax + (clientMaintenanceCost ?? 0);
  const baseIVA = baseForTax;
  const vat = baseIVA > 0 ? baseIVA * (regulatedCosts.iva / 100) : 0;
  const totalCost = baseIVA + vat;

  return {
    totalCost: totalCost > 0 ? totalCost : 0,
    breakdown: {
      fixedCost,
      energyCost,
      equipmentRental,
      maintenanceCost: clientMaintenanceCost ?? 0,
      hydrocarbonTax,
      vat,
    },
  };
};

/** Añade el desglose de la factura actual a la respuesta de la comparativa. */
const enrichComparativaWithBreakdown = (comparativa: any) => {
  if (!comparativa) return comparativa;

  const breakdown = comparativa.comparisonType === 'luz'
    ? calculateCurrentLightBillBreakdown(comparativa)
    : calculateCurrentGasBillBreakdown(comparativa);

  return {
    ...comparativa,
    currentBillBreakdown: breakdown,
  };
};

export module ComparativaController {
  // PRES-018 B1 — Extrae datos de una factura (imagen/PDF) con IA para pre-rellenar el asistente.
  export const extractInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No se ha enviado ninguna factura (campo 'file')" });
      }

      const data = await InvoiceExtractionService.extract(
        file.buffer,
        file.mimetype,
        file.originalname || "factura"
      );

      res.json(data);
    } catch (error: any) {
      if (error?.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  };

  export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const comparativaData = req.body;
      
      // Calculate prices based on the data
      const calculatedOldPrice = comparativaData.currentBillAmount || 0;
      let calculatedNewPrice = 0;
      let savings = 0;

      // Basic calculation logic (to be enhanced based on actual business logic)
      if (comparativaData.comparisonType === 'luz') {
        // Simple mock calculation for light
        calculatedNewPrice = calculatedOldPrice * 0.85; // 15% savings
      } else if (comparativaData.comparisonType === 'gas') {
        // Simple mock calculation for gas
        calculatedNewPrice = calculatedOldPrice * 0.88; // 12% savings
      }

      savings = calculatedOldPrice - calculatedNewPrice;

      const enrichedData = {
        ...comparativaData,
        calculatedOldPrice,
        calculatedNewPrice,
        savings,
        calculationDetails: JSON.stringify({
          originalData: comparativaData,
          timestamp: new Date().toISOString(),
        }),
      };

      const comparativa = await ComparativaService.create(enrichedData, userId);
      res.status(201).json(comparativa);
    } catch (error: any) {
      next(error);
    }
  };

  export const findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const result = await ComparativaService.findAll(userId, page, limit);
      
      // Enriquecer cada comparativa con su desglose
      const enrichedData = {
        ...result,
        data: result.data.map((c: any) => enrichComparativaWithBreakdown(c)),
      };
      
      res.json(enrichedData);
    } catch (error: any) {
      next(error);
    }
  };

  export const findRecent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const comparativas = await ComparativaService.findRecent(limit, userId);
      res.json(comparativas.map((c: any) => enrichComparativaWithBreakdown(c)));
    } catch (error: any) {
      next(error);
    }
  };

  export const findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const comparativa = await ComparativaService.findById(id);
      res.json(enrichComparativaWithBreakdown(comparativa));
    } catch (error: any) {
      if (error.message === "Comparativa not found") {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  export const findByUuid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uuid = req.params.uuid;
      const comparativa = await ComparativaService.findByUuid(uuid);
      res.json(enrichComparativaWithBreakdown(comparativa));
    } catch (error: any) {
      if (error.message === "Comparativa not found") {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const comparativa = await ComparativaService.update(id, data);
      res.json(comparativa);
    } catch (error: any) {
      if (error.message === "Comparativa not found") {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const result = await ComparativaService.deleteById(id);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Comparativa not found") {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  export const deleteByUuid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uuid = req.params.uuid;
      const result = await ComparativaService.deleteByUuid(uuid);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Comparativa not found") {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };
}