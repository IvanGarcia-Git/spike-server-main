import { dataSource } from "../../app-data-source";
import { TimeEntry, TimeEntryStatus } from "../models/time-entry.entity";
import { TimeBreak, BreakStatus } from "../models/time-break.entity";
import { TimeEntryAudit, AuditAction } from "../models/time-entry-audit.entity";
import { User } from "../models/user.entity";
import {
  FindOptionsWhere,
  FindOptionsRelations,
  Between,
  In,
  IsNull,
  MoreThanOrEqual,
  LessThanOrEqual,
} from "typeorm";

export module TimeEntriesService {
  // Get active session for a user (clocked in but not clocked out)
  export const getActiveSession = async (
    userId: number
  ): Promise<TimeEntry | null> => {
    const repo = dataSource.getRepository(TimeEntry);
    return repo.findOne({
      where: {
        userId,
        status: TimeEntryStatus.ACTIVE,
      },
      relations: { breaks: true },
    });
  };

  // Get current status for a user
  export const getCurrentStatus = async (userId: number) => {
    const activeSession = await getActiveSession(userId);

    if (!activeSession) {
      return {
        isClockedIn: false,
        activeSession: null,
        hasActiveBreak: false,
        currentBreak: null,
      };
    }

    const activeBreak = activeSession.breaks?.find(
      (b) => b.status === BreakStatus.ACTIVE
    );

    return {
      isClockedIn: true,
      activeSession,
      hasActiveBreak: !!activeBreak,
      currentBreak: activeBreak || null,
    };
  };

  // Clock in
  export const clockIn = async (userId: number): Promise<TimeEntry> => {
    const repo = dataSource.getRepository(TimeEntry);
    const auditRepo = dataSource.getRepository(TimeEntryAudit);

    // Check if already clocked in
    const existingSession = await getActiveSession(userId);
    if (existingSession) {
      throw new Error("already-clocked-in");
    }

    const now = new Date();
    const newEntry = repo.create({
      userId,
      clockInTime: now,
      status: TimeEntryStatus.ACTIVE,
      totalBreakMinutes: 0,
    });

    const savedEntry = await repo.save(newEntry);

    // Create audit entry
    await auditRepo.save(
      auditRepo.create({
        timeEntryId: savedEntry.id,
        modifiedByUserId: userId,
        action: AuditAction.CLOCK_IN,
        newValue: now.toISOString(),
      })
    );

    return savedEntry;
  };

  // Clock out
  export const clockOut = async (userId: number): Promise<TimeEntry> => {
    const repo = dataSource.getRepository(TimeEntry);
    const auditRepo = dataSource.getRepository(TimeEntryAudit);
    const breakRepo = dataSource.getRepository(TimeBreak);

    const activeSession = await getActiveSession(userId);
    if (!activeSession) {
      throw new Error("not-clocked-in");
    }

    // Check for active break
    const activeBreak = activeSession.breaks?.find(
      (b) => b.status === BreakStatus.ACTIVE
    );
    if (activeBreak) {
      throw new Error("cannot-clock-out-during-break");
    }

    const now = new Date();
    activeSession.clockOutTime = now;
    activeSession.status = TimeEntryStatus.COMPLETED;

    // Calculate total break minutes
    const completedBreaks = activeSession.breaks?.filter(
      (b) => b.status === BreakStatus.COMPLETED && b.endTime
    ) || [];

    let totalBreakMinutes = 0;
    for (const breakEntry of completedBreaks) {
      if (breakEntry.endTime) {
        const breakDuration =
          (new Date(breakEntry.endTime).getTime() - new Date(breakEntry.startTime).getTime()) /
          (1000 * 60);
        totalBreakMinutes += breakDuration;
      }
    }
    activeSession.totalBreakMinutes = Math.round(totalBreakMinutes);

    const savedEntry = await repo.save(activeSession);

    // Create audit entry
    await auditRepo.save(
      auditRepo.create({
        timeEntryId: savedEntry.id,
        modifiedByUserId: userId,
        action: AuditAction.CLOCK_OUT,
        newValue: now.toISOString(),
      })
    );

    return savedEntry;
  };

  // Start break
  export const startBreak = async (userId: number): Promise<TimeBreak> => {
    const breakRepo = dataSource.getRepository(TimeBreak);
    const auditRepo = dataSource.getRepository(TimeEntryAudit);

    const activeSession = await getActiveSession(userId);
    if (!activeSession) {
      throw new Error("not-clocked-in");
    }

    // Check if already on break
    const activeBreak = activeSession.breaks?.find(
      (b) => b.status === BreakStatus.ACTIVE
    );
    if (activeBreak) {
      throw new Error("already-on-break");
    }

    const now = new Date();
    const newBreak = breakRepo.create({
      timeEntryId: activeSession.id,
      startTime: now,
      status: BreakStatus.ACTIVE,
    });

    const savedBreak = await breakRepo.save(newBreak);

    // Create audit entry
    await auditRepo.save(
      auditRepo.create({
        timeEntryId: activeSession.id,
        modifiedByUserId: userId,
        action: AuditAction.BREAK_START,
        newValue: now.toISOString(),
      })
    );

    return savedBreak;
  };

  // End break
  export const endBreak = async (userId: number): Promise<TimeBreak> => {
    const breakRepo = dataSource.getRepository(TimeBreak);
    const auditRepo = dataSource.getRepository(TimeEntryAudit);

    const activeSession = await getActiveSession(userId);
    if (!activeSession) {
      throw new Error("not-clocked-in");
    }

    const activeBreak = activeSession.breaks?.find(
      (b) => b.status === BreakStatus.ACTIVE
    );
    if (!activeBreak) {
      throw new Error("not-on-break");
    }

    const now = new Date();
    activeBreak.endTime = now;
    activeBreak.status = BreakStatus.COMPLETED;

    const savedBreak = await breakRepo.save(activeBreak);

    // Create audit entry
    await auditRepo.save(
      auditRepo.create({
        timeEntryId: activeSession.id,
        modifiedByUserId: userId,
        action: AuditAction.BREAK_END,
        newValue: now.toISOString(),
      })
    );

    return savedBreak;
  };

  // Get today's summary for a user
  export const getTodaySummary = async (userId: number) => {
    const repo = dataSource.getRepository(TimeEntry);

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const entries = await repo.find({
      where: {
        userId,
        clockInTime: Between(startOfDay, endOfDay),
      },
      relations: { breaks: true },
      order: { clockInTime: "ASC" },
    });

    let totalWorkedMinutes = 0;
    let totalBreakMinutes = 0;

    for (const entry of entries) {
      const clockOut = entry.clockOutTime
        ? new Date(entry.clockOutTime)
        : new Date();
      const clockIn = new Date(entry.clockInTime);

      const sessionMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
      totalWorkedMinutes += sessionMinutes;
      totalBreakMinutes += entry.totalBreakMinutes || 0;

      // If session is active, calculate current break time
      if (entry.status === TimeEntryStatus.ACTIVE && entry.breaks) {
        for (const breakEntry of entry.breaks) {
          if (breakEntry.status === BreakStatus.ACTIVE) {
            const breakDuration =
              (new Date().getTime() - new Date(breakEntry.startTime).getTime()) /
              (1000 * 60);
            totalBreakMinutes += breakDuration;
          }
        }
      }
    }

    // Net worked time (excluding breaks)
    const netWorkedMinutes = totalWorkedMinutes - totalBreakMinutes;

    return {
      entries,
      totalWorkedMinutes: Math.round(totalWorkedMinutes),
      totalBreakMinutes: Math.round(totalBreakMinutes),
      netWorkedMinutes: Math.round(netWorkedMinutes),
      totalWorkedHours: Math.round((netWorkedMinutes / 60) * 100) / 100,
    };
  };

  // Get weekly summary for a user
  export const getWeeklySummary = async (userId: number, weekStartDate?: Date) => {
    const repo = dataSource.getRepository(TimeEntry);

    // Default to current week (Monday start)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0

    const weekStart = weekStartDate || new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diff
    );
    const weekEnd = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + 6,
      23, 59, 59, 999
    );

    const entries = await repo.find({
      where: {
        userId,
        clockInTime: Between(weekStart, weekEnd),
      },
      relations: { breaks: true },
      order: { clockInTime: "ASC" },
    });

    // Group by day
    const dailySummary: Record<string, { workedMinutes: number; breakMinutes: number }> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      dailySummary[dateKey] = { workedMinutes: 0, breakMinutes: 0 };
    }

    for (const entry of entries) {
      const dateKey = new Date(entry.clockInTime).toISOString().split("T")[0];

      const clockOut = entry.clockOutTime
        ? new Date(entry.clockOutTime)
        : new Date();
      const clockIn = new Date(entry.clockInTime);

      const sessionMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);

      if (dailySummary[dateKey]) {
        dailySummary[dateKey].workedMinutes += sessionMinutes;
        dailySummary[dateKey].breakMinutes += entry.totalBreakMinutes || 0;
      }
    }

    // Calculate totals
    let totalWorkedMinutes = 0;
    let totalBreakMinutes = 0;

    const days = Object.entries(dailySummary).map(([date, data]) => {
      const netMinutes = data.workedMinutes - data.breakMinutes;
      totalWorkedMinutes += data.workedMinutes;
      totalBreakMinutes += data.breakMinutes;

      return {
        date,
        workedMinutes: Math.round(data.workedMinutes),
        breakMinutes: Math.round(data.breakMinutes),
        netWorkedMinutes: Math.round(netMinutes),
        netWorkedHours: Math.round((netMinutes / 60) * 100) / 100,
      };
    });

    return {
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      days,
      totalWorkedMinutes: Math.round(totalWorkedMinutes),
      totalBreakMinutes: Math.round(totalBreakMinutes),
      totalNetWorkedMinutes: Math.round(totalWorkedMinutes - totalBreakMinutes),
      totalNetWorkedHours: Math.round(((totalWorkedMinutes - totalBreakMinutes) / 60) * 100) / 100,
    };
  };

  // Get entries by date range with pagination
  export const getEntriesByDateRange = async (
    userId: number | null,
    startDate: Date,
    endDate: Date,
    page: number = 1,
    limit: number = 20,
    relations: FindOptionsRelations<TimeEntry> = { breaks: true, user: true }
  ): Promise<{ entries: TimeEntry[]; total: number; page: number; totalPages: number }> => {
    const repo = dataSource.getRepository(TimeEntry);

    const where: FindOptionsWhere<TimeEntry> = {
      clockInTime: Between(startDate, endDate),
    };

    if (userId !== null) {
      where.userId = userId;
    }

    const [entries, total] = await repo.findAndCount({
      where,
      relations,
      order: { clockInTime: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  };

  // Update entry (manager only)
  export const updateEntry = async (
    entryUuid: string,
    data: {
      clockInTime?: Date;
      clockOutTime?: Date;
      notes?: string;
    },
    modifiedByUserId: number,
    reason: string
  ): Promise<TimeEntry> => {
    const repo = dataSource.getRepository(TimeEntry);
    const auditRepo = dataSource.getRepository(TimeEntryAudit);

    const entry = await repo.findOne({
      where: { uuid: entryUuid },
      relations: { breaks: true },
    });

    if (!entry) {
      throw new Error("time-entry-not-found");
    }

    // Create audit entries for each changed field
    if (data.clockInTime && data.clockInTime.getTime() !== new Date(entry.clockInTime).getTime()) {
      await auditRepo.save(
        auditRepo.create({
          timeEntryId: entry.id,
          modifiedByUserId,
          action: AuditAction.EDIT_CLOCK_IN,
          fieldName: "clockInTime",
          oldValue: entry.clockInTime.toString(),
          newValue: data.clockInTime.toISOString(),
          reason,
        })
      );
      entry.clockInTime = data.clockInTime;
    }

    if (data.clockOutTime !== undefined) {
      const oldValue = entry.clockOutTime ? entry.clockOutTime.toString() : null;
      const newValue = data.clockOutTime ? data.clockOutTime.toISOString() : null;

      if (oldValue !== newValue) {
        await auditRepo.save(
          auditRepo.create({
            timeEntryId: entry.id,
            modifiedByUserId,
            action: AuditAction.EDIT_CLOCK_OUT,
            fieldName: "clockOutTime",
            oldValue,
            newValue,
            reason,
          })
        );
        entry.clockOutTime = data.clockOutTime || null;

        // Recalculate status if clock out is set
        if (data.clockOutTime) {
          entry.status = TimeEntryStatus.COMPLETED;
        }
      }
    }

    if (data.notes !== undefined) {
      entry.notes = data.notes;
    }

    return await repo.save(entry);
  };

  // Get audit history for an entry
  export const getAuditHistory = async (
    entryUuid: string
  ): Promise<TimeEntryAudit[]> => {
    const repo = dataSource.getRepository(TimeEntry);
    const auditRepo = dataSource.getRepository(TimeEntryAudit);

    const entry = await repo.findOne({ where: { uuid: entryUuid } });
    if (!entry) {
      throw new Error("time-entry-not-found");
    }

    return auditRepo.find({
      where: { timeEntryId: entry.id },
      relations: { modifiedByUser: true },
      order: { createdAt: "DESC" },
    });
  };

  // Get entries for export
  export const getEntriesForExport = async (
    userId: number | null, // null for all users (managers)
    startDate: Date,
    endDate: Date,
    requestingUserId: number,
    isManager: boolean
  ): Promise<TimeEntry[]> => {
    const repo = dataSource.getRepository(TimeEntry);

    // Non-managers can only export their own data
    const targetUserId = isManager ? userId : requestingUserId;

    const where: FindOptionsWhere<TimeEntry> = {
      clockInTime: Between(startDate, endDate),
    };

    if (targetUserId !== null) {
      where.userId = targetUserId;
    }

    return repo.find({
      where,
      relations: { breaks: true, user: true },
      order: { userId: "ASC", clockInTime: "ASC" },
    });
  };

  // Get entries for a specific user within a date range (for team view by managers)
  export const getTeamEntries = async (
    userIds: number[],
    startDate: Date,
    endDate: Date
  ): Promise<TimeEntry[]> => {
    const repo = dataSource.getRepository(TimeEntry);

    return repo.find({
      where: {
        userId: In(userIds),
        clockInTime: Between(startDate, endDate),
      },
      relations: { breaks: true, user: true },
      order: { userId: "ASC", clockInTime: "DESC" },
    });
  };

  // Calculate worked hours for a single entry
  export const calculateWorkedHours = (entry: TimeEntry): number => {
    if (!entry.clockOutTime) {
      // For active sessions, calculate up to now
      const now = new Date();
      const totalMinutes =
        (now.getTime() - new Date(entry.clockInTime).getTime()) / (1000 * 60);
      const netMinutes = totalMinutes - (entry.totalBreakMinutes || 0);
      return Math.round((netMinutes / 60) * 100) / 100;
    }

    const totalMinutes =
      (new Date(entry.clockOutTime).getTime() - new Date(entry.clockInTime).getTime()) /
      (1000 * 60);
    const netMinutes = totalMinutes - (entry.totalBreakMinutes || 0);
    return Math.round((netMinutes / 60) * 100) / 100;
  };

  // Delete entry (soft delete via audit)
  export const deleteEntry = async (
    entryUuid: string,
    modifiedByUserId: number,
    reason: string
  ): Promise<boolean> => {
    const repo = dataSource.getRepository(TimeEntry);
    const auditRepo = dataSource.getRepository(TimeEntryAudit);

    const entry = await repo.findOne({ where: { uuid: entryUuid } });
    if (!entry) {
      throw new Error("time-entry-not-found");
    }

    // Create audit entry before deletion
    await auditRepo.save(
      auditRepo.create({
        timeEntryId: entry.id,
        modifiedByUserId,
        action: AuditAction.DELETE,
        oldValue: JSON.stringify({
          clockInTime: entry.clockInTime,
          clockOutTime: entry.clockOutTime,
          totalBreakMinutes: entry.totalBreakMinutes,
        }),
        reason,
      })
    );

    await repo.remove(entry);
    return true;
  };
}
