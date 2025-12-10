import { TimeEntriesService } from "../services/time-entries.service";

export module TimeEntriesController {
  // GET /time-entries/status - Get current clock status
  export const getCurrentStatus = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const status = await TimeEntriesService.getCurrentStatus(userId);
      res.status(200).json(status);
    } catch (error) {
      console.error("Error getting clock status:", error);
      next(error);
    }
  };

  // POST /time-entries/clock-in - Clock in
  export const clockIn = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const entry = await TimeEntriesService.clockIn(userId);
      res.status(201).json(entry);
    } catch (error) {
      if (error.message === "already-clocked-in") {
        return res.status(400).json({ message: "Ya estás fichado." });
      }
      console.error("Error clocking in:", error);
      next(error);
    }
  };

  // POST /time-entries/clock-out - Clock out
  export const clockOut = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const entry = await TimeEntriesService.clockOut(userId);
      res.status(200).json(entry);
    } catch (error) {
      if (error.message === "not-clocked-in") {
        return res.status(400).json({ message: "No estás fichado." });
      }
      if (error.message === "cannot-clock-out-during-break") {
        return res.status(400).json({ message: "No puedes salir durante una pausa. Finaliza la pausa primero." });
      }
      console.error("Error clocking out:", error);
      next(error);
    }
  };

  // POST /time-entries/break/start - Start break
  export const startBreak = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const breakEntry = await TimeEntriesService.startBreak(userId);
      res.status(201).json(breakEntry);
    } catch (error) {
      if (error.message === "not-clocked-in") {
        return res.status(400).json({ message: "Debes fichar entrada antes de iniciar una pausa." });
      }
      if (error.message === "already-on-break") {
        return res.status(400).json({ message: "Ya estás en pausa." });
      }
      console.error("Error starting break:", error);
      next(error);
    }
  };

  // POST /time-entries/break/end - End break
  export const endBreak = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const breakEntry = await TimeEntriesService.endBreak(userId);
      res.status(200).json(breakEntry);
    } catch (error) {
      if (error.message === "not-clocked-in") {
        return res.status(400).json({ message: "No estás fichado." });
      }
      if (error.message === "not-on-break") {
        return res.status(400).json({ message: "No estás en pausa." });
      }
      console.error("Error ending break:", error);
      next(error);
    }
  };

  // GET /time-entries/today - Get today's summary
  export const getTodaySummary = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const summary = await TimeEntriesService.getTodaySummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error getting today's summary:", error);
      next(error);
    }
  };

  // GET /time-entries/weekly - Get weekly summary
  export const getWeeklySummary = async (req, res, next) => {
    const { userId } = req.user;
    const { weekStart } = req.query;

    try {
      const weekStartDate = weekStart ? new Date(weekStart) : undefined;
      const summary = await TimeEntriesService.getWeeklySummary(userId, weekStartDate);
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error getting weekly summary:", error);
      next(error);
    }
  };

  // GET /time-entries/history - Get history with filters
  export const getHistory = async (req, res, next) => {
    const { userId: requestingUserId, isManager } = req.user;
    const { startDate, endDate, userId, page, limit } = req.query;

    // Default date range: last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    // Non-managers can only view their own history
    let targetUserId = requestingUserId;
    if (isManager && userId) {
      targetUserId = userId === "all" ? null : parseInt(userId);
    }

    try {
      const result = await TimeEntriesService.getEntriesByDateRange(
        targetUserId,
        start,
        end,
        parseInt(page || "1"),
        parseInt(limit || "20")
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error getting history:", error);
      next(error);
    }
  };

  // PATCH /time-entries/:uuid - Update entry (manager only)
  export const updateEntry = async (req, res, next) => {
    const { userId, isManager } = req.user;
    const { uuid } = req.params;
    const { clockInTime, clockOutTime, notes, reason } = req.body;

    if (!isManager) {
      return res.status(403).json({ message: "Solo los managers pueden editar registros." });
    }

    if (!uuid) {
      return res.status(400).json({ message: "UUID es requerido." });
    }

    if (!reason) {
      return res.status(400).json({ message: "Debe proporcionar un motivo para la modificación." });
    }

    try {
      const data: { clockInTime?: Date; clockOutTime?: Date; notes?: string } = {};
      if (clockInTime) data.clockInTime = new Date(clockInTime);
      if (clockOutTime) data.clockOutTime = new Date(clockOutTime);
      if (notes !== undefined) data.notes = notes;

      const updatedEntry = await TimeEntriesService.updateEntry(uuid, data, userId, reason);
      res.status(200).json(updatedEntry);
    } catch (error) {
      if (error.message === "time-entry-not-found") {
        return res.status(404).json({ message: "Registro no encontrado." });
      }
      console.error("Error updating entry:", error);
      next(error);
    }
  };

  // GET /time-entries/:uuid/audit - Get audit trail
  export const getAuditTrail = async (req, res, next) => {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({ message: "UUID es requerido." });
    }

    try {
      const audits = await TimeEntriesService.getAuditHistory(uuid);
      res.status(200).json(audits);
    } catch (error) {
      if (error.message === "time-entry-not-found") {
        return res.status(404).json({ message: "Registro no encontrado." });
      }
      console.error("Error getting audit trail:", error);
      next(error);
    }
  };

  // GET /time-entries/export - Export entries
  export const exportEntries = async (req, res, next) => {
    const { userId: requestingUserId, isManager } = req.user;
    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate y endDate son requeridos." });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Determine target user
    let targetUserId = requestingUserId;
    if (isManager && userId) {
      targetUserId = userId === "all" ? null : parseInt(userId);
    }

    try {
      const entries = await TimeEntriesService.getEntriesForExport(
        targetUserId,
        start,
        end,
        requestingUserId,
        isManager
      );

      // Format entries for export
      const exportData = entries.map((entry) => ({
        usuario: entry.user ? `${entry.user.name} ${entry.user.firstSurname}` : "N/A",
        fecha: new Date(entry.clockInTime).toLocaleDateString("es-ES"),
        entrada: new Date(entry.clockInTime).toLocaleTimeString("es-ES"),
        salida: entry.clockOutTime
          ? new Date(entry.clockOutTime).toLocaleTimeString("es-ES")
          : "En curso",
        pausas_minutos: entry.totalBreakMinutes,
        horas_trabajadas: TimeEntriesService.calculateWorkedHours(entry),
        estado: entry.status,
        notas: entry.notes || "",
      }));

      res.status(200).json(exportData);
    } catch (error) {
      console.error("Error exporting entries:", error);
      next(error);
    }
  };

  // DELETE /time-entries/:uuid - Delete entry (manager only)
  export const deleteEntry = async (req, res, next) => {
    const { userId, isManager } = req.user;
    const { uuid } = req.params;
    const { reason } = req.body;

    if (!isManager) {
      return res.status(403).json({ message: "Solo los managers pueden eliminar registros." });
    }

    if (!uuid) {
      return res.status(400).json({ message: "UUID es requerido." });
    }

    if (!reason) {
      return res.status(400).json({ message: "Debe proporcionar un motivo para la eliminación." });
    }

    try {
      await TimeEntriesService.deleteEntry(uuid, userId, reason);
      res.status(204).send();
    } catch (error) {
      if (error.message === "time-entry-not-found") {
        return res.status(404).json({ message: "Registro no encontrado." });
      }
      console.error("Error deleting entry:", error);
      next(error);
    }
  };
}
