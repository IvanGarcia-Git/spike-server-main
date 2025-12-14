import { Request, Response, NextFunction } from "express";
import { InvoicesService } from "../services/invoices.service";

export module InvoicesController {
  // Crear nueva factura
  export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const dto = {
        ...req.body,
        userId: req.body.userId !== undefined ? req.body.userId : user?.userId,
      };

      const invoice = await InvoicesService.create(dto);
      res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  };

  // Obtener factura por UUID
  export const getByUuid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const invoice = await InvoicesService.getByUuid(uuid);

      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }

      res.json(invoice);
    } catch (err) {
      next(err);
    }
  };

  // Actualizar factura
  export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const user = (req as any).user;
      const invoice = await InvoicesService.update(
        uuid,
        req.body,
        user?.userId,
        user?.isManager || false
      );
      res.json(invoice);
    } catch (err) {
      next(err);
    }
  };

  // Eliminar factura
  export const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const user = (req as any).user;
      await InvoicesService.remove(uuid, user?.userId, user?.isManager || false);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // Listar todas las facturas (managers) o las del usuario
  export const findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      let invoices;

      if (user?.isManager) {
        invoices = await InvoicesService.findAll();
      } else {
        invoices = await InvoicesService.findByUser(user?.userId);
      }

      res.json(invoices);
    } catch (err) {
      next(err);
    }
  };

  // Obtener facturas recientes (para historial)
  export const findRecent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const limit = parseInt(req.query.limit as string) || 10;

      let invoices;
      if (user?.isManager) {
        invoices = await InvoicesService.findRecent(limit);
      } else {
        invoices = await InvoicesService.findRecent(limit, user?.userId);
      }

      res.json(invoices);
    } catch (err) {
      next(err);
    }
  };

  // Obtener facturas por tipo
  export const findByType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { type } = req.params;

      if (type !== "COBRO" && type !== "PAGO") {
        return res.status(400).json({ error: "Tipo inválido. Debe ser COBRO o PAGO." });
      }

      let invoices;
      if (user?.isManager) {
        invoices = await InvoicesService.findByType(type as any);
      } else {
        invoices = await InvoicesService.findByType(type as any, user?.userId);
      }

      res.json(invoices);
    } catch (err) {
      next(err);
    }
  };

  // Obtener siguiente número de factura
  export const getNextInvoiceNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prefix = (req.query.prefix as string) || "F";
      const nextNumber = await InvoicesService.getNextInvoiceNumber(prefix);
      res.json({ nextInvoiceNumber: nextNumber });
    } catch (err) {
      next(err);
    }
  };
}
