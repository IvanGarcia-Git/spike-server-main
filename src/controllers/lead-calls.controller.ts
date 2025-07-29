import { LeadCallsService } from "../services/lead-calls.service";

export module LeadCallsController {
  export const create = async (req, res, next) => {
    const { userId } = req.user;
    const leadCallData = req.body;
    const leadCallFile = req.file;

    leadCallData.userId = userId;

    try {
      const leadCallCreated = await LeadCallsService.create(
        leadCallData,
        leadCallFile
      );

      res.status(201).json(leadCallCreated);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    const { leadCallUuid } = req.params;

    try {
      const leadCall = await LeadCallsService.get({ uuid: leadCallUuid });

      res.json(leadCall);
    } catch (error) {
      next(error);
    }
  };

  export const getMany = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const userLeadCalls = await LeadCallsService.getMany({ userId });

      res.json(userLeadCalls);
    } catch (error) {
      next(error);
    }
  };

  export const getManyByDate = async (req, res, next) => {
    const { userId } = req.user;
    const { leadCallDate } = req.body;

    try {
      const userLeadCalls = await LeadCallsService.getManyByDate(leadCallDate, {
        userId,
      });

      res.json(userLeadCalls);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    const { leadCallUuid } = req.params;
    const { completed } = req.body;

    try {
      const updatedReminder = await LeadCallsService.update(
        leadCallUuid,
        completed
      );

      res.json(updatedReminder);
    } catch (error) {
      next(error);
    }
  };

  export const deleteLeadCall = async (req, res, next) => {
      try {
        const { leadCallUuid } = req.params;
        await LeadCallsService.deleteLeadCall(leadCallUuid);
        res.json({ message: "Lead Call deleted successfully" });
      } catch (error) {
        next(error);
      }
    };
}
