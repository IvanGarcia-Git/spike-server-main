import { NextFunction, Request, Response } from "express";
import { PayrollsService } from "../services/payrolls.service";
import { Payroll } from "../models/payroll.entity";
import { PayrollState } from "../enums/payroll-state.enum";

interface CreatePayrollRequestBody {
  userId: number;
  qty: number;
  date: string;
  state?: PayrollState;
}

export module PayrollsController {
  export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, qty, date, state }: CreatePayrollRequestBody = req.body;

    if (userId === undefined || qty === undefined || !date) {
      return res
        .status(400)
        .json({ message: "userId, qty, and date are required." });
    }

    if (typeof userId !== "number") {
      return res.status(400).json({ message: "userId must be a number." });
    }

    if (typeof qty !== "number" || qty <= 0) {
      return res
        .status(400)
        .json({ message: "qty must be a positive number." });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "date must be in YYYY-MM-DD format." });
    }
    
    if (state && !Object.values(PayrollState).includes(state)) {
      return res
        .status(400)
        .json({ message: "Invalid payroll state provided." });
    }

    try {
      const payrollDataForService: Omit<
        Payroll,
        "id" | "uuid" | "createdAt" | "updatedAt" | "user"
      > = {
        userId,
        qty,
        date,
        state: state || PayrollState.Pendiente,
      };

      const newPayroll: Payroll = await PayrollsService.create(
        payrollDataForService
      );
      res.status(201).json(newPayroll);
    } catch (error) {
      console.error("Error creating payroll:", error);

      if (
        error.message &&
        (error.message.includes("violates foreign key constraint") ||
          error.message.includes("foreign key constraint fails"))
      ) {
        return res
          .status(400)
          .json({
            message: `Failed to create payroll. User with ID ${userId} may not exist.`,
          });
      }

      res
        .status(500)
        .json({
          message: "An internal error occurred while creating the payroll.",
        });
    }
  };

  export const getAllByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (isNaN(Number(userId))) {
      return res.status(400).json({ message: "userId must be a number." });
    }

    try {
      const payrolls = await PayrollsService.getMany(
        { userId: Number(userId) },
        {}
      );

      res.status(200).json(payrolls);
    } catch (error) {
      console.error("Error fetching payrolls:", error);

      res
        .status(500)
        .json({
          message: "An internal error occurred while fetching payrolls.",
        });
    }
  };

  export const deletePayroll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const uuid = req.params.uuid;

    if (!uuid) {
      return res.status(400).json({ message: "UUID is required." });
    }

    try {
      const payroll = await PayrollsService.getByUuid(uuid);

      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found." });
      }

      await PayrollsService.remove(uuid);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payroll:", error);

      res
        .status(500)
        .json({
          message: "An internal error occurred while deleting the payroll.",
        });
    }
  };

  export const updatePayroll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const uuid = req.params.uuid;
    const { qty, date, state }: Partial<CreatePayrollRequestBody> = req.body;

    if (!uuid) {
      return res.status(400).json({ message: "UUID is required." });
    }

    try {
      const payroll = await PayrollsService.getByUuid(uuid);

      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found." });
      }

      if (qty !== undefined) {
        payroll.qty = qty;
      }
      if (date !== undefined) {
        payroll.date = date;
      }
      if (state !== undefined) {
        payroll.state = state;
      }

      await PayrollsService.update(uuid, payroll);
      res.status(200).json(payroll);
    } catch (error) {
      console.error("Error updating payroll:", error);

      res
        .status(500)
        .json({
          message: "An internal error occurred while updating the payroll.",
        });
    }
  };
}
