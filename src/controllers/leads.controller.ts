import { LeadStates } from "../enums/lead-states.enum";
import { Roles } from "../enums/roles.enum";
import { LeadLogsService } from "../services/lead-logs.service";
import { LeadsService } from "../services/leads.service";
import {
  LeadAuthorizationService,
  LeadAction,
} from "../services/lead-authorization.service";

export module LeadsController {
  const SUPER_ADMIN_GROUP_ID = 1;
  export const count = async (req, res, next) => {
    try {
      const count = await LeadsService.count();
      res.json({ count });
    } catch (error) {
      next(error);
    }
  };

  export const create = async (req, res, next) => {
    const leadData = req.body;
    const billFile = req.file;

    try {
      const leadCreated = await LeadsService.create(leadData, billFile);

      res.status(201).json(leadCreated);
    } catch (error) {
      next(error);
    }
  };

  export const createBatch = async (req, res, next) => {
    const { leadsData } = req.body;

    try {
      const leadsCreated = [];

      for (const lead of leadsData) {
        leadsCreated.push(await LeadsService.create(lead));
      }

      res.status(201).json(leadsCreated);
    } catch (error) {
      next(error);
    }
  };

  export const createFromWebhook = async (req, res, next) => {
    const leadData = req.body;

    try {
      const leadCreated = await LeadsService.create({
        fullName: leadData.fullName,
        phoneNumber: leadData.phoneNumber,
        campaignName: leadData.campaignName,
        campaignSource: "Meta",
      });

      res.status(201).json(leadCreated);
    } catch (error) {
      next(error);
    }
  };

  export const getOne = async (req, res, next) => {
    try {
      const { leadUuid } = req.params;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Verificar permiso de visualización
      const authResult = await LeadAuthorizationService.canPerformActionByUuid(
        userContext,
        leadUuid,
        LeadAction.VIEW
      );

      if (!authResult.allowed) {
        return res.status(403).json({ error: authResult.reason || "unauthorized" });
      }

      const lead = await LeadsService.getOne({ uuid: leadUuid }, { user: true });

      res.json(lead);
    } catch (error) {
      next(error);
    }
  };

  export const getRepeatedLeads = async (req, res, next) => {
    try {
      const repeatedLeadsFound = await LeadsService.getMany(
        { leadStateId: LeadStates.Repetido },
        { campaign: true }
      );

      res.status(200).json(repeatedLeadsFound);
    } catch (error) {
      next(error);
    }
  };

  export const getUserLeadsHistory = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const repeatedLeadsFound = await LeadLogsService.getMany(
        { userId },
        { leadState: true, lead: { campaign: true } }
      );

      res.status(200).json(repeatedLeadsFound);
    } catch (error) {
      next(error);
    }
  };

  export const typeLead = async (req, res, next) => {
    try {
      const userContext = LeadAuthorizationService.extractUserContext(req.user);
      const { leadStateId, observations, userToAssignId, personalAgendaData } = req.body;

      // Si se intenta agendar a otro usuario, verificar permisos
      if (leadStateId === LeadStates.AgendarUsuario && userToAssignId) {
        const assignAuthResult = await LeadAuthorizationService.canAssignLeadToUser(
          userContext,
          userToAssignId
        );

        if (!assignAuthResult.allowed) {
          return res.status(403).json({ error: assignAuthResult.reason || "cannot-assign-to-user" });
        }
      }

      const options = {
        personalAgendaData,
        userToAssignId,
      };

      const typed = await LeadsService.typeLead(userContext.userId, leadStateId, observations, options);

      res.json({ typed });
    } catch (error) {
      // Manejar errores conocidos con códigos de estado apropiados
      const knownErrors: { [key: string]: number } = {
        "No available lead to assign": 404,
        "User does not belong to any group": 400,
        "No campaigns available for the user's groups": 400,
        "User to assign not specified": 400,
        "Personal Agenda Data not specified": 400,
      };

      const errorMessage = error instanceof Error ? error.message : String(error);
      const statusCode = knownErrors[errorMessage];

      if (statusCode) {
        return res.status(statusCode).json({ message: errorMessage });
      }

      next(error);
    }
  };

  export const assignToUser = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { leadId } = req.body;

      const assignedLead = await LeadsService.assignToUser(userId, leadId);

      res.json({ assignedLead });
    } catch (error) {
      next(error);
    }
  };

  export const assignToQueue = async (req, res, next) => {
    try {
      const { leadUuid, userId: targetUserId } = req.body;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Verificar que el usuario puede reasignar el lead
      const leadAuthResult = await LeadAuthorizationService.canPerformActionByUuid(
        userContext,
        leadUuid,
        LeadAction.REASSIGN
      );

      if (!leadAuthResult.allowed) {
        return res.status(403).json({ error: leadAuthResult.reason || "unauthorized" });
      }

      // Verificar que el usuario puede asignar a este usuario destino
      const assignAuthResult = await LeadAuthorizationService.canAssignLeadToUser(
        userContext,
        targetUserId
      );

      if (!assignAuthResult.allowed) {
        return res.status(403).json({ error: assignAuthResult.reason || "cannot-assign-to-user" });
      }

      const assignedLead = await LeadsService.assignToQueue(targetUserId, leadUuid);

      res.json({ assignedLead });
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { leadUuid } = req.params;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Verificar permiso de edición
      const authResult = await LeadAuthorizationService.canPerformActionByUuid(
        userContext,
        leadUuid,
        LeadAction.EDIT
      );

      if (!authResult.allowed) {
        return res.status(403).json({ error: authResult.reason || "unauthorized" });
      }

      const billFile: Express.Multer.File = req.file;
      const leadData = req.body;

      const updatedCompany = await LeadsService.update(leadUuid, leadData, billFile);

      res.json(updatedCompany);
    } catch (error) {
      next(error);
    }
  };

  export const changeState = async (req, res, next) => {
    try {
      const { leadUuid } = req.params;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Solo Admin puede cambiar estado directamente (sin tipificar)
      if (userContext.groupId !== SUPER_ADMIN_GROUP_ID) {
        return res.status(403).json({ error: "only-admin-can-change-state-directly" });
      }

      const { leadStateId } = req.body;

      const updatedLead = await LeadsService.update(leadUuid, {
        leadStateId,
      });

      res.json(updatedLead);
    } catch (error) {
      next(error);
    }
  };

  export const deleteLead = async (req, res, next) => {
    const { leadUuid } = req.params;

    if (!leadUuid) {
      return res.status(400).json({ message: "UUID is required" });
    }

    try {
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Verificar permiso de eliminación (solo Admin puede borrar)
      const authResult = await LeadAuthorizationService.canPerformActionByUuid(
        userContext,
        leadUuid,
        LeadAction.DELETE
      );

      if (!authResult.allowed) {
        return res.status(403).json({ error: authResult.reason || "unauthorized" });
      }

      await LeadsService.remove(leadUuid);
      return res.status(200).json({ message: "Lead eliminated succesfull" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

  //Lead Document
  export const uploadDocumentForLead = async (req, res, next) => {
    try {
      const { leadUuid } = req.params;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Verificar permiso de gestión de documentos
      const authResult = await LeadAuthorizationService.canPerformActionByUuid(
        userContext,
        leadUuid,
        LeadAction.MANAGE_DOCUMENTS
      );

      if (!authResult.allowed) {
        return res.status(403).json({ error: authResult.reason || "unauthorized" });
      }

      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No se han proporcionado archivos." });
      }

      const uploadPromises = files.map((file) => LeadsService.uploadDocument(leadUuid, file));

      const newDocuments = await Promise.all(uploadPromises);

      res.status(201).json(newDocuments);
    } catch (error) {
      next(error);
    }
  };

  export const getDocumentsForLead = async (req, res, next) => {
    try {
      const { leadUuid } = req.params;
      const userContext = LeadAuthorizationService.extractUserContext(req.user);

      // Verificar permiso de visualización
      const authResult = await LeadAuthorizationService.canPerformActionByUuid(
        userContext,
        leadUuid,
        LeadAction.VIEW
      );

      if (!authResult.allowed) {
        return res.status(403).json({ error: authResult.reason || "unauthorized" });
      }

      const documents = await LeadsService.getDocumentsForLead(leadUuid);
      res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  };

  export const getLeadDocumentDownloadUrl = async (req, res, next) => {
    try {
      const { documentUuid } = req.params;
      // Nota: Para una verificación más estricta, se debería obtener el lead
      // asociado al documento y verificar permisos. Por ahora mantenemos
      // la autenticación básica ya que el endpoint requiere authenticateJWT.
      const downloadUrl = await LeadsService.getPresignedUrlForDocument(documentUuid);

      if (!downloadUrl) {
        return res.status(404).json({ message: "Documento no encontrado." });
      }

      res.status(200).json({ url: downloadUrl });
    } catch (error) {
      next(error);
    }
  };
}
