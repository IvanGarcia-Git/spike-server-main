import { GlobalSearchService } from "../services/global-search.service";

export module GlobalSearchController {
  export const performGlobalSearch = async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;

    const { isManager, groupId, userId } = req.user;

    const { searchText, contractSearchParams } = req.body;

    try {
      const contractsFound = await GlobalSearchService.search(
        searchText,
        contractSearchParams,
        { isManager, groupId, userId },
        Number(page),
        Number(limit)
      );

      res.json(contractsFound);
    } catch (error) {
      next(error);
    }
  };

  export const performCalendarSearch = async (req, res, next) => {
    const { userId } = req.user;

    const { startDate, endDate } = req.body;

    try {
      const calendarData = await GlobalSearchService.searchCalendarData(
        userId,
        startDate,
        endDate
      );

      res.json(calendarData);
    } catch (error) {
      next(error);
    }
  };
}
