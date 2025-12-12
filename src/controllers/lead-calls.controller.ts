import { LeadCallsService } from "../services/lead-calls.service";
import {
  LeadAuthorizationService,
  LeadAction,
} from "../services/lead-authorization.service";

const SUPER_ADMIN_GROUP_ID = 1;

export module LeadCallsController {
  export const create = async (req, res, next) => {
    const { userId, groupId } = req.user;
    const leadCallData = req.body;
    const leadCallFile = req.file;

    // Si el usuario intenta crear una llamada para otro usuario
    if (leadCallData.userId && leadCallData.userId !== userId) {
      // Solo Admin o Manager pueden crear llamadas para otros usuarios
      if (groupId !== SUPER_ADMIN_GROUP_ID && !req.user.isManager) {
        return res.status(403).json({ error: "cannot-create-call-for-other-user" });
      }
    } else {
      leadCallData.userId = userId;
    }

    // Si hay un leadId asociado, verificar permisos sobre el lead
    if (leadCallData.leadId) {
      const userContext = LeadAuthorizationService.extractUserContext(req.user);
      const authResult = await LeadAuthorizationService.canPerformAction(
        userContext,
        leadCallData.leadId,
        LeadAction.MANAGE_CALLS
      );

      if (!authResult.allowed) {
        return res.status(403).json({ error: authResult.reason || "unauthorized" });
      }
    }

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
    const { userId, groupId, isManager } = req.user;

    try {
      const leadCall = await LeadCallsService.get({ uuid: leadCallUuid });

      if (!leadCall) {
        return res.status(404).json({ error: "lead-call-not-found" });
      }

      // Verificar permisos: el usuario puede ver si es suya, o es Admin/Manager
      const canView =
        leadCall.userId === userId ||
        groupId === SUPER_ADMIN_GROUP_ID ||
        isManager;

      if (!canView) {
        return res.status(403).json({ error: "unauthorized" });
      }

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
    const { userId, groupId, isManager } = req.user;

    try {
      // Primero obtener la llamada para verificar permisos
      const leadCall = await LeadCallsService.get({ uuid: leadCallUuid });

      if (!leadCall) {
        return res.status(404).json({ error: "lead-call-not-found" });
      }

      // Verificar permisos: el usuario puede editar si es suya, o es Admin
      const canEdit =
        leadCall.userId === userId ||
        groupId === SUPER_ADMIN_GROUP_ID;

      if (!canEdit) {
        return res.status(403).json({ error: "unauthorized" });
      }

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
      const { userId, groupId } = req.user;

      // Primero obtener la llamada para verificar permisos
      const leadCall = await LeadCallsService.get({ uuid: leadCallUuid });

      if (!leadCall) {
        return res.status(404).json({ error: "lead-call-not-found" });
      }

      // Verificar permisos: el usuario puede borrar si es suya, o es Admin
      const canDelete =
        leadCall.userId === userId ||
        groupId === SUPER_ADMIN_GROUP_ID;

      if (!canDelete) {
        return res.status(403).json({ error: "unauthorized" });
      }

      await LeadCallsService.deleteLeadCall(leadCallUuid);
      res.json({ message: "Lead Call deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
