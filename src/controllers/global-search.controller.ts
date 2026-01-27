import { GlobalSearchService } from "../services/global-search.service";
import { UsersService } from "../services/users.service";

export module GlobalSearchController {
  export const performGlobalSearch = async (req, res, next) => {
    const { page = 1, limit = 10, liquidacion } = req.query;

    const { isManager, groupId, userId } = req.user;

    const { searchText, contractSearchParams } = req.body;

    try {
      const contractsFound = await GlobalSearchService.search(
        searchText,
        contractSearchParams,
        { isManager, groupId, userId },
        Number(page),
        Number(limit),
        liquidacion as string | undefined
      );

      res.json(contractsFound);
    } catch (error) {
      next(error);
    }
  };

  export const performCalendarSearch = async (req, res, next) => {
    const { userId, isManager, groupId } = req.user;

    const { startDate, endDate, userIds } = req.body;

    try {
      // Determine which user IDs to query
      let targetUserIds: number[] = [userId];

      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        // Get visible users for current user
        const visibleUserIds = await GlobalSearchService.getVisibleUserIdsForCalendar(
          userId,
          isManager,
          groupId
        );

        // Filter requested userIds to only include visible ones
        targetUserIds = userIds.filter((id: number) => visibleUserIds.includes(id));

        // If no valid userIds remain, default to current user
        if (targetUserIds.length === 0) {
          targetUserIds = [userId];
        }
      }

      const calendarData = await GlobalSearchService.searchCalendarData(
        targetUserIds,
        startDate,
        endDate
      );

      res.json(calendarData);
    } catch (error) {
      next(error);
    }
  };
}
