import { LeadStates } from "../enums/lead-states.enum";
import { Roles } from "../enums/roles.enum";
import { LeadLogsService } from "../services/lead-logs.service";
import { LeadsService } from "../services/leads.service";

export module LeadsController {
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
      const { userId } = req.user;

      const { leadStateId, observations, userToAssignId, personalAgendaData } = req.body;

      const options = {
        personalAgendaData,
        userToAssignId,
      };

      const typed = await LeadsService.typeLead(userId, leadStateId, observations, options);

      res.json({ typed });
    } catch (error) {
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
      const { leadUuid, userId } = req.body;

      const assignedLead = await LeadsService.assignToQueue(userId, leadUuid);

      res.json({ assignedLead });
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId != Roles.SuperAdmin) {
        res.status(403).send("unauthorized");
        return;
      }

      const { leadUuid } = req.params;
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
      const { groupId } = req.user;

      if (groupId != Roles.SuperAdmin) {
        res.status(403).send("unauthorized");
        return;
      }

      const { leadUuid } = req.params;
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
      const documents = await LeadsService.getDocumentsForLead(leadUuid);
      res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  };

  export const getLeadDocumentDownloadUrl = async (req, res, next) => {
    try {
      const { documentUuid } = req.params;
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
