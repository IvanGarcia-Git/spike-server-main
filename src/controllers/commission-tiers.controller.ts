import { Request, Response, NextFunction } from "express";
import { CommissionTiersService } from "../services/commission-tiers.service";

export module CommissionTiersController {
  // GET /commission-tiers?rateId=...
  export const listByRate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const rateId = Number(req.query.rateId);
      if (!rateId) {
        return res.status(400).json({ message: "rateId is required" });
      }
      const tiers = await CommissionTiersService.listByRate(rateId);
      res.json(tiers);
    } catch (error) {
      next(error);
    }
  };

  // POST /commission-tiers
  export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { rateId, minConsumo, maxConsumo, comision, appliesToRenewal } = req.body;
      if (rateId === undefined || minConsumo === undefined || comision === undefined) {
        return res.status(400).json({
          message: "rateId, minConsumo and comision are required",
        });
      }

      const tier = await CommissionTiersService.create({
        rateId: Number(rateId),
        minConsumo: Number(minConsumo),
        maxConsumo: maxConsumo !== null && maxConsumo !== undefined ? Number(maxConsumo) : null,
        comision: Number(comision),
        appliesToRenewal: Boolean(appliesToRenewal),
      });

      res.status(201).json(tier);
    } catch (error: any) {
      if (error.message?.includes("solapa") || error.message?.includes("menor o igual")) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  };

  // PATCH /commission-tiers/:id
  export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number(req.params.id);
      const { minConsumo, maxConsumo, comision, appliesToRenewal } = req.body;

      const dto: any = {};
      if (minConsumo !== undefined) dto.minConsumo = Number(minConsumo);
      if (maxConsumo !== undefined) dto.maxConsumo = maxConsumo !== null ? Number(maxConsumo) : null;
      if (comision !== undefined) dto.comision = Number(comision);
      if (appliesToRenewal !== undefined) dto.appliesToRenewal = Boolean(appliesToRenewal);

      const tier = await CommissionTiersService.update(id, dto);
      res.json(tier);
    } catch (error: any) {
      if (error.message?.includes("solapa") || error.message?.includes("menor o igual") || error.message?.includes("no encontrado")) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  };

  // DELETE /commission-tiers/:id
  export const remove = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number(req.params.id);
      await CommissionTiersService.remove(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // POST /commission-tiers/bulk
  // Body: { rateId, tiers: [...] }
  export const bulkUpsert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { rateId, tiers } = req.body;
      if (!rateId || !Array.isArray(tiers)) {
        return res.status(400).json({
          message: "rateId and tiers array are required",
        });
      }

      const result = await CommissionTiersService.bulkUpsert(
        Number(rateId),
        tiers.map((t: any) => ({
          id: t.id ? Number(t.id) : undefined,
          minConsumo: Number(t.minConsumo),
          maxConsumo: t.maxConsumo !== null && t.maxConsumo !== undefined ? Number(t.maxConsumo) : null,
          comision: Number(t.comision),
          appliesToRenewal: Boolean(t.appliesToRenewal),
        }))
      );

      res.json(result);
    } catch (error: any) {
      if (error.message?.includes("solapa") || error.message?.includes("menor o igual")) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  };

  // GET /commission-tiers/calculate?rateId=...&consumo=...&isRenewal=...
  export const calculate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const rateId = Number(req.query.rateId);
      const consumo = Number(req.query.consumo);
      const isRenewal = req.query.isRenewal === "true";

      if (!rateId || isNaN(consumo)) {
        return res.status(400).json({
          message: "rateId and consumo are required",
        });
      }

      const comision = await CommissionTiersService.calculateCommission(rateId, consumo, isRenewal);
      res.json({ comision });
    } catch (error) {
      next(error);
    }
  };
}
