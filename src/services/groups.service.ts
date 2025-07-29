import { Group } from "../models/group.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations } from "typeorm";
import { GroupUser } from "../models/group-user.entity";
import { GroupDetailDTO, GroupStats } from "../dto/group-detail.dto";
import { GroupCampaign } from "../models/group-campaign.entity";
import { LeadStates } from "../enums/lead-states.enum";
import { Lead } from "../models/lead.entity";

export module GroupsService {
  export const createOrUpdate = async (
    groupData: Partial<Group>
  ): Promise<Group> => {
    try {
      const groupRepository = dataSource.getRepository(Group);

      const existingGroup = await groupRepository.findOne({
        where: {
          name: groupData.name,
        },
      });

      let groupToSave: Group;

      if (existingGroup) {
        groupToSave = {
          ...existingGroup,
          ...groupData,
        };
      } else {
        groupToSave = groupRepository.create(groupData);
      }

      return await groupRepository.save(groupToSave);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    relations: FindOptionsRelations<Group> = {},
    getStats: boolean = false
  ): Promise<Group[] | GroupDetailDTO[]> => {
    try {
      const groupRepository = dataSource.getRepository(Group);
      const groupsFound = await groupRepository.find({ relations });

      if (!getStats) {
        return groupsFound;
      }

      return await getGroupStats(groupsFound);
    } catch (error) {
      throw error;
    }
  };

  const getGroupStats = async (
    groupsFound: Group[]
  ): Promise<GroupDetailDTO[]> => {
    const groupDetails: GroupDetailDTO[] = [];

    for (const groupFound of groupsFound) {
      const groupCampaigns = await dataSource
        .getRepository(GroupCampaign)
        .find({
          where: { groupId: groupFound.id },
          relations: { campaign: { leads: true } },
        });

      let leads: Lead[] = [];
      for (const groupCampaign of groupCampaigns) {
        leads = leads.concat(groupCampaign.campaign.leads);
      }

      const stats: Partial<GroupStats> = {
        porContactar: leads.filter(
          (lead) =>
            !lead.leadStateId || lead.leadStateId == LeadStates.NoContesta
        ).length,
        venta: leads.filter((lead) => lead.leadStateId === LeadStates.Venta)
          .length,
        agendado: leads.filter(
          (lead) => lead.leadStateId === LeadStates.AgendaPersonal
        ).length,
        ilocalizable: leads.filter(
          (lead) => lead.leadStateId === LeadStates.Ilocalizable
        ).length,
        noInteresa: leads.filter(
          (lead) => lead.leadStateId === LeadStates.NoInteresa
        ).length,
        contactedPercent: 0,
        leadsCount: leads.length,
        contactedLeadsCount: 0,
      };

      const totalContactedLeads = leads.filter(
        (lead) => lead.leadStateId
      ).length;

      stats.contactedLeadsCount = totalContactedLeads;

      stats.contactedPercent =
        leads.length > 0
          ? Math.round((totalContactedLeads / leads.length) * 100)
          : 0;

      if (leads.length > 0) {
        stats.porContactarPercent = Math.round(
          (stats.porContactar / leads.length) * 100
        );
        stats.ventaPercent = Math.round((stats.venta / leads.length) * 100);
        stats.agendadoPercent = Math.round(
          (stats.agendado / leads.length) * 100
        );
        stats.ilocalizablePercent = Math.round(
          (stats.ilocalizable / leads.length) * 100
        );
        stats.noInteresaPercent = Math.round(
          (stats.noInteresa / leads.length) * 100
        );
      }

      const usersCount = groupFound.groupUsers
        ? groupFound.groupUsers.length
        : 0;

      const groupDetail: GroupDetailDTO = {
        stats: stats as GroupStats,
        usersCount,
        group: groupFound,
      };

      groupDetails.push(groupDetail);
    }

    return groupDetails;
  };

  export const getOne = async (
    uuid: string,
    relations: FindOptionsRelations<Group> = {},
    getStats: boolean = false
  ): Promise<Group | GroupDetailDTO> => {
    try {
      const groupRepository = dataSource.getRepository(Group);
      const groupFound = await groupRepository.findOne({
        where: { uuid },
        relations,
      });

      if (!getStats) {
        return groupFound;
      }

      const groupWithStats = await getGroupStats([groupFound]);

      return groupWithStats[0];
    } catch (error) {
      throw error;
    }
  };

  export const getUserGroups = async (userId: number): Promise<Group[]> => {
    try {
      const groupUserRepository = dataSource.getRepository(GroupUser);
      const groupsUserFound = await groupUserRepository.find({
        where: { userId },
        relations: { group: true },
      });

      const userGroups: Group[] = [];

      for (const groupUser of groupsUserFound) {
        userGroups.push(groupUser.group);
      }

      return userGroups;
    } catch (error) {
      throw error;
    }
  };

  export const linkUser = async (linkData: {
    groupId: number;
    userId: number;
  }): Promise<GroupUser> => {
    try {
      const groupUserRepository = dataSource.getRepository(GroupUser);

      const linkToSave = groupUserRepository.create({
        groupId: linkData.groupId,
        userId: linkData.userId,
      });

      return await groupUserRepository.save(linkToSave);
    } catch (error) {
      throw error;
    }
  };

  export const unlinkUser = async (linkData: {
    groupId: number;
    userId: number;
  }): Promise<boolean> => {
    try {
      const groupUserRepository = dataSource.getRepository(GroupUser);

      const linkToDelete = await groupUserRepository.findOneBy({
        groupId: linkData.groupId,
        userId: linkData.userId,
      });

      if (!linkToDelete) {
        throw new Error("link-not-found");
      }

      await groupUserRepository.remove(linkToDelete);

      return true;
    } catch (error) {
      throw error;
    }
  };

  export const deleteGroup = async (uuid: string): Promise<boolean> => {
    try {
      const groupRepository = dataSource.getRepository(Group);

      const group = await groupRepository.findOne({ where: { uuid } });

      if (!group) {
        throw new Error("group-not-found");
      }

      await groupRepository.remove(group);

      return true;
    } catch (error) {
      throw error;
    }
  };
}
