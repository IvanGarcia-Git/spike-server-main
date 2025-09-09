import { Request, Response, NextFunction } from "express";
import { ComparativaService } from "../services/comparativa.service";

export module ComparativaController {
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
      const comparativas = await ComparativaService.findAll(userId);
      res.json(comparativas);
    } catch (error: any) {
      next(error);
    }
  };

  export const findRecent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const comparativas = await ComparativaService.findRecent(limit, userId);
      res.json(comparativas);
    } catch (error: any) {
      next(error);
    }
  };

  export const findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const comparativa = await ComparativaService.findById(id);
      res.json(comparativa);
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
      res.json(comparativa);
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