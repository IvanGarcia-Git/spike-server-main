import { Campaign } from "../models/campaign.entity";
import { dataSource } from "../../app-data-source";
import { DeleteResult, FindOptionsRelations, IsNull } from "typeorm";
import { GroupCampaign } from "../models/group-campaign.entity";
import { Lead } from "../models/lead.entity";

export module CampaignsService {
  export const createOrUpdate = async (campaignData: Partial<Campaign>): Promise<Campaign> => {
    try {
      const campaignRepository = dataSource.getRepository(Campaign);

      const existingCampaign = await campaignRepository.findOne({
        where: {
          name: campaignData.name,
        },
      });

      let campaignToSave: Campaign;

      if (existingCampaign) {
        campaignToSave = {
          ...existingCampaign,
          ...campaignData,
        };
      } else {
        campaignToSave = campaignRepository.create(campaignData);
      }

      return await campaignRepository.save(campaignToSave);
    } catch (error) {
      throw error;
    }
  };

  export const createOrGet = async (campaignData: Partial<Campaign>): Promise<Campaign> => {
    try {
      const campaignRepository = dataSource.getRepository(Campaign);

      const existingCampaign = await campaignRepository.findOne({
        where: {
          name: campaignData.name,
        },
      });

      if (existingCampaign) {
        return existingCampaign;
      }

      const campaignToSave = campaignRepository.create(campaignData);

      return await campaignRepository.save(campaignToSave);
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    relations: FindOptionsRelations<Campaign> = {}
  ): Promise<Campaign[]> => {
    try {
      const campaignRepository = dataSource.getRepository(Campaign);
      return await campaignRepository.find({ relations });
    } catch (error) {
      throw error;
    }
  };

  export const getOne = async (
    uuid: string,
    relations: FindOptionsRelations<Campaign> = {}
  ): Promise<Campaign> => {
    try {
      const campaignRepository = dataSource.getRepository(Campaign);
      return await campaignRepository.findOne({
        where: { uuid },
        relations,
      });
    } catch (error) {
      throw error;
    }
  };

  export const getLeadsForCampaignPaginated = async (
    campaignId: number,
    skip: number,
    take: number
  ): Promise<[Lead[], number]> => {
    const leadRepository = dataSource.getRepository(Lead);
    const [leads, total] = await leadRepository.findAndCount({
      where: { campaignId },
      skip,
      take,
      relations: { user: true },
    });

    return [leads, total];
  };

  export const getOrphanLeadsPaginated = async (
  ): Promise<[Lead[], number]> => {
    const leadRepository = dataSource.getRepository(Lead);
    const [leads, total] = await leadRepository.findAndCount({
      where: { campaignId: IsNull() },
      relations: { user: true },
    });

    return [leads, total];
  };

  export const linkToGroup = async (
    linkData: {
      groupId: number;
      campaignId: number;
    },
    unlink = false
  ): Promise<GroupCampaign | DeleteResult> => {
    try {
      const groupCampaignRepository = dataSource.getRepository(GroupCampaign);

      if (unlink) {
        return await groupCampaignRepository.delete({
          groupId: linkData.groupId,
          campaignId: linkData.campaignId,
        });
      }
      const linkToSave = groupCampaignRepository.create({
        groupId: linkData.groupId,
        campaignId: linkData.campaignId,
      });

      return await groupCampaignRepository.save(linkToSave);
    } catch (error) {
      throw error;
    }
  };

  export const deleteByUuid = async (uuid: string): Promise<void> => {
    await dataSource.transaction(async (transactionalEntityManager) => {
      const campaignRepository = transactionalEntityManager.getRepository(Campaign);
      const leadRepository = transactionalEntityManager.getRepository(Lead);

      const campaignToDelete = await campaignRepository.findOne({ where: { uuid } });

      if (!campaignToDelete) {
        const error = new Error("Campaña no encontrada");
        throw error;
      }
      await leadRepository.update(
        { campaignId: campaignToDelete.id },
        { removedCampaignName: campaignToDelete.name }
      );
      const result = await campaignRepository.delete({ id: campaignToDelete.id });

      if (result.affected === 0) {
        throw new Error("No se pudo eliminar la campaña.");
      }
    });
  };
}
