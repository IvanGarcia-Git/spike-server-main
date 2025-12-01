import { Brackets, FindOptionsRelations, FindOptionsWhere, In } from "typeorm";
import { AwsHelper } from "../helpers/aws.helper";
import { CampaignsService } from "./campaigns.service";
import { CallBellHelper } from "../helpers/callbell.helper";
import { dataSource } from "../../app-data-source";
import { GroupCampaign } from "../models/group-campaign.entity";
import { GroupShift } from "../models/lead.entity";
import { Lead } from "../models/lead.entity";
import { LeadCallsService } from "./lead-calls.service";
import { LeadStates } from "../enums/lead-states.enum";
import { LeadLogsService } from "./lead-logs.service";
import { LeadQueuesService } from "./lead-queues.service";
import { LeadQueue } from "../models/lead-queue.entity";
import { LeadPriority, User } from "../models/user.entity";
import { UsersService } from "./users.service";
import { AutomaticCreateLeadDTO } from "../dto/automatic-lead-create.dto";
import { LeadDocument } from "../models/lead-document.entity";

export module LeadsService {
  export const count = async (): Promise<number> => {
    const leadRepository = dataSource.getRepository(Lead);
    return await leadRepository.count();
  };

  export const create = async (
    leadData: AutomaticCreateLeadDTO,
    billFile?: Express.Multer.File
  ): Promise<Lead> => {
    try {
      const leadRepository = dataSource.getRepository(Lead);

      const campaign = await CampaignsService.createOrGet({
        name: leadData.campaignName,
        source: leadData?.campaignSource,
      });

      const newLead = leadRepository.create({
        ...leadData,
        campaignId: campaign.id,
      });

      if (billFile) {
        newLead.billUri = await AwsHelper.uploadGenericCommentDocumentToS3("leadBill", billFile);
      }

      const leadFound = await leadRepository.findOneBy({
        phoneNumber: leadData.phoneNumber,
      });

      if (leadFound) {
        newLead.leadStateId = LeadStates.Repetido;
      } else {
        await CallBellHelper.createContactAndSendMessage(
          leadData.phoneNumber,
          leadData.fullName || leadData.phoneNumber
        );
      }

      return await leadRepository.save(newLead);
    } catch (error) {
      throw new Error(`Error creating Lead: ${error.message}`);
    }
  };

  export const update = async (
    uuid: string,
    leadData: Partial<Lead>,
    billFile?: Express.Multer.File
  ): Promise<Lead> => {
    try {
      const leadRepository = dataSource.getRepository(Lead);

      const lead = await leadRepository.findOne({ where: { uuid } });

      if (!lead) {
        throw new Error("lead-not-found");
      }

      if (billFile) {
        leadData.billUri = await AwsHelper.uploadGenericCommentDocumentToS3("leadBill", billFile);
      }

      Object.assign(lead, leadData);

      return await leadRepository.save(lead);
    } catch (error) {
      throw error;
    }
  };

  export const remove = async (uuid: string): Promise<boolean> => {
    try {
      const leadRepository = dataSource.getRepository(Lead);
      const result = await leadRepository.delete({ uuid });

      if (result.affected === 0) {
        throw new Error("lead not found");
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting lead with uuid ${uuid}: ${error.message}`);
    }
  };

  export const getOne = async (
    where: FindOptionsWhere<Lead>,
    relations: FindOptionsRelations<Lead> = {}
  ): Promise<Lead> => {
    try {
      const leadRepository = dataSource.getRepository(Lead);

      const leadFound = await leadRepository.findOne({
        where,
        relations,
      });

      if (!leadFound) {
        throw new Error("lead-not-found");
      }

      return leadFound;
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<Lead>,
    relations: FindOptionsRelations<Lead> = {}
  ): Promise<Lead[]> => {
    try {
      const leadRepository = dataSource.getRepository(Lead);

      return await leadRepository.find({
        where,
        relations,
        order: { updatedAt: "DESC" },
      });
    } catch (error) {
      throw error;
    }
  };

  export const assignToUser = async (userId: number, leadId: number): Promise<Lead> => {
    try {
      const userRepository = dataSource.getRepository(User);
      const leadRepository = dataSource.getRepository(Lead);

      const leadFound = await leadRepository.findOne({
        where: { id: leadId },
        relations: { user: true },
      });

      if (!leadFound || leadFound?.user) {
        return null;
      }

      try {
        const userDetail = await userRepository.findOne({
          where: { id: userId },
        });

        await CallBellHelper.assignUserToContact(leadFound.phoneNumber, userDetail.email);
      } catch (error) {
        console.error("Error assigning user to CallBell contact:", error);
      }

      await userRepository.update(userId, { leadId: leadFound.id });

      return leadFound;
    } catch (error) {
      throw error;
    }
  };

  export const assignToQueue = async (userId: number, leadUuid: string): Promise<Lead> => {
    try {
      const leadRepository = dataSource.getRepository(Lead);

      const lead = await getOne({ uuid: leadUuid });

      await LeadQueuesService.create(lead.id, userId);

      return await leadRepository.save({
        ...lead,
        leadStateId: LeadStates.AgendarUsuario,
      });
    } catch (error) {
      throw error;
    }
  };

  export const typeLead = async (
    userId: number,
    leadStateId: number,
    observations: string,
    options?: {
      personalAgendaData?: { subject: string; startDate: Date };
      userToAssignId?: number;
    }
  ): Promise<Lead> => {
    try {
      const userRepository = dataSource.getRepository(User);
      const leadRepository = dataSource.getRepository(Lead);

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: { lead: { leadLogs: true } },
      });

      const lead = user?.lead;

      if (!lead) {
        return await assignNewLeadToUser(userId);
      }

      await LeadLogsService.create({
        userId,
        leadStateId,
        leadId: lead.id,
        observations,
      });

      let updateFields: Partial<Lead> = {};

      switch (leadStateId) {
        case LeadStates.Venta:
        case LeadStates.NoInteresa:
        case LeadStates.NoMejorar:
        case LeadStates.Erroneo:
          updateFields.leadStateId = leadStateId;
          break;

        case LeadStates.MorningShift:
          updateFields.shift = GroupShift.MORNING;
          updateFields.leadStateId = null;
          break;

        case LeadStates.EveningShift:
          updateFields.shift = GroupShift.EVENING;
          updateFields.leadStateId = null;
          break;

        case LeadStates.AgendarUsuario:
          if (!options?.userToAssignId) {
            throw new Error(`User to assign not specified`);
          }

          updateFields.leadStateId = leadStateId;
          await LeadQueuesService.create(lead.id, options.userToAssignId);
          break;

        case LeadStates.AgendaPersonal:
          if (!options?.personalAgendaData) {
            throw new Error(`Personal Agenda Data not specified`);
          }

          await LeadCallsService.create({
            ...options.personalAgendaData,
            subject: `Llamada con ${lead.fullName}`,
            observations: options.personalAgendaData.subject,
            userId,
            leadId: lead.id,
          });

          updateFields.leadStateId = leadStateId;
          break;

        case LeadStates.NoContesta:
          if (lead.leadLogs.length >= 4) {
            updateFields.leadStateId = LeadStates.Ilocalizable;
          } else {
            updateFields.leadStateId = leadStateId;
          }

          break;

        default:
          throw new Error(`Lead state '${leadStateId}' is not handled.`);
      }

      await leadRepository.update(lead.id, updateFields);
      await userRepository.update(userId, { leadId: null });
      return lead;
    } catch (error) {
      throw error;
    }
  };

  //Private functions
  const assignNewLeadToUser = async (userId: number): Promise<Lead> => {
    const leadQueueRepository = dataSource.getRepository(LeadQueue);

    const user = await UsersService.get({ id: userId }, { groupUsers: { group: true } });

    if (!user || !user.groupUsers || user.groupUsers.length === 0) {
      throw new Error("User does not belong to any group");
    }

    const priorities = user.leadPriorities || [LeadPriority.OLDEST_FIRST];

    const groups = user.groupUsers.map((groupUser) => groupUser.group);
    const groupIds = groups.map((group) => group.id);
    const shifts = Array.from(new Set(groups.map((group) => group.shift)));

    const groupCampaigns = await dataSource.getRepository(GroupCampaign).find({
      where: { groupId: In(groupIds) },
    });

    const campaignIds = groupCampaigns.map((groupCampaign) => groupCampaign.campaignId);

    if (campaignIds.length === 0) {
      throw new Error("No campaigns available for the user's groups");
    }

    const leadRepository = dataSource.getRepository(Lead);

    const createBaseQuery = () => {
      return leadRepository
        .createQueryBuilder("lead")
        .where("lead.campaignId IN (:...campaignIds)", { campaignIds })
        .andWhere(
          new Brackets((qb) => {
            qb.where("lead.leadStateId IS NULL").orWhere("lead.leadStateId = :noContesta", {
              noContesta: LeadStates.NoContesta,
            });
          })
        )
        .andWhere(`lead.id NOT IN (SELECT user.leadId FROM user WHERE user.leadId IS NOT NULL)`)
        .andWhere("lead.shift IS NULL");
    };

    //TODO: Count with "all" shift
    for (const priority of priorities) {
      let leadQuery = createBaseQuery();

      if (priority.startsWith("group")) {
        const groupId = parseInt(priority.replace("group", ""), 10);

        if (isNaN(groupId) || !groupIds.includes(groupId)) {
          continue;
        }

        leadQuery = leadQuery
          .andWhere(
            `lead.campaignId IN (
         SELECT groupCampaign.campaignId 
         FROM group_campaign groupCampaign 
         WHERE groupCampaign.groupId = :groupId
       )`,
            { groupId }
          )
          .orderBy("lead.updatedAt", "ASC");

        const leadToAssign = await leadQuery.getOne();

        if (leadToAssign) {
          await dataSource.getRepository(User).update(userId, { leadId: leadToAssign.id });

          try {
            await CallBellHelper.assignUserToContact(leadToAssign.phoneNumber, user.email);
          } catch (error) {
            console.error("Error assigning user to CallBell contact:", error);
          }

          return leadToAssign;
        }
        continue;
      }

      switch (priority) {
        case LeadPriority.WITH_ATTACHMENTS:
          leadQuery = leadQuery.andWhere("lead.billUri IS NOT NULL");
          break;

        case LeadPriority.FROM_QUEUE:
          const leadInQueue = await leadQueueRepository.findOne({
            where: { userId },
            relations: { lead: true },
            order: { position: "ASC" },
          });

          if (leadInQueue) {
            await dataSource.getRepository(User).update(userId, { leadId: leadInQueue.lead.id });

            await LeadQueuesService.deleteFirst(userId);

            try {
              await CallBellHelper.assignUserToContact(leadInQueue.lead.phoneNumber, user.email);
            } catch (error) {
              console.error("Error assigning user to CallBell contact:", error);
            }

            return leadInQueue.lead;
          }
          continue;

        case LeadPriority.RECENT_FIRST:
          leadQuery = leadQuery.orderBy("lead.updatedAt", "DESC");
          break;

        case LeadPriority.OLDEST_FIRST:
          leadQuery = leadQuery.orderBy("lead.updatedAt", "ASC");
          break;

        case LeadPriority.MORNING_SHIFT:
          if (!shifts.includes(GroupShift.MORNING)) {
            continue;
          }
          leadQuery = leadRepository
            .createQueryBuilder("lead")
            .where("lead.campaignId IN (:...campaignIds)", { campaignIds })
            .andWhere("lead.leadStateId IS NULL")
            .andWhere(`lead.id NOT IN (SELECT user.leadId FROM user WHERE user.leadId IS NOT NULL)`)
            .andWhere("lead.shift = :shift", { shift: GroupShift.MORNING });
          break;

        case LeadPriority.EVENING_SHIFT:
          if (!shifts.includes(GroupShift.EVENING)) {
            continue;
          }
          leadQuery = leadRepository
            .createQueryBuilder("lead")
            .where("lead.campaignId IN (:...campaignIds)", { campaignIds })
            .andWhere("lead.leadStateId IS NULL")
            .andWhere(`lead.id NOT IN (SELECT user.leadId FROM user WHERE user.leadId IS NOT NULL)`)
            .andWhere("lead.shift = :shift", { shift: GroupShift.EVENING });
          break;

        case LeadPriority.NOT_RESPONDING:
          leadQuery = leadQuery
            .andWhere("lead.leadStateId = :noContesta", {
              noContesta: LeadStates.NoContesta,
            })
            .orderBy("lead.updatedAt", "ASC");
          break;

        default:
          continue;
      }

      const leadToAssign = await leadQuery.getOne();
      if (leadToAssign) {
        await dataSource.getRepository(User).update(userId, { leadId: leadToAssign.id });

        try {
          await CallBellHelper.assignUserToContact(leadToAssign.phoneNumber, user.email);
        } catch (error) {
          console.error("Error assigning user to CallBell contact:", error);
        }

        return leadToAssign;
      }
    }

    await dataSource.getRepository(User).update(userId, { leadId: null });
    throw new Error("No available lead to assign");
  };

  //Lead Document
  export const uploadDocument = async (
    leadUuid: string,
    file: Express.Multer.File
  ): Promise<LeadDocument> => {
    const leadRepository = dataSource.getRepository(Lead);
    const leadDocumentRepository = dataSource.getRepository(LeadDocument);

    const lead = await leadRepository.findOne({ where: { uuid: leadUuid } });
    if (!lead) {
      const error = new Error("Lead no encontrado");
      (error as any).statusCode = 404;
      throw error;
    }

    try {
      const documentUri = await AwsHelper.uploadGenericCommentDocumentToS3("lead", file);

      const newDocument = leadDocumentRepository.create({
        leadId: lead.id,
        documentUri,
        originalName: file.originalname,
      });

      await leadDocumentRepository.save(newDocument);
      return newDocument;
    } catch (error) {
      console.error("Error en el servicio uploadDocument para Lead:", error);
      throw error;
    }
  };

  export const getDocumentsForLead = async (leadUuid: string): Promise<LeadDocument[]> => {
    const leadRepository = dataSource.getRepository(Lead);
    const leadWithDocuments = await leadRepository.findOne({
      where: { uuid: leadUuid },
      relations: ["documents"],
    });

    if (!leadWithDocuments) {
      const error = new Error("Lead no encontrado");
      (error as any).statusCode = 404;
      throw error;
    }

    return leadWithDocuments.documents.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  };

  export const getPresignedUrlForDocument = async (
    documentUuid: string
  ): Promise<string | null> => {
    const leadDocumentRepository = dataSource.getRepository(LeadDocument);
    const document = await leadDocumentRepository.findOne({ where: { uuid: documentUuid } });

    if (!document) {
      return null;
    }

    return AwsHelper.getPresignedUrl(document.documentUri, 3600);
  };
}
