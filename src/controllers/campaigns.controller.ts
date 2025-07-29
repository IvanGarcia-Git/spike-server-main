import { AwsHelper } from "../helpers/aws.helper";
import { CampaignsService } from "../services/campaigns.service";
import { Roles } from "../enums/roles.enum";

export module CampaignsController {
  export const createOrUpdate = async (req, res, next) => {
    const campaignData = req.body;

    try {
      const campaignCreated = await CampaignsService.createOrUpdate(campaignData);

      res.status(201).json(campaignCreated);
    } catch (error) {
      next(error);
    }
  };

  export const linkToGroup = async (req, res, next) => {
    const linkData = req.body;

    const status = linkData?.unlink ? 200 : 201;

    try {
      const linkCreated = await CampaignsService.linkToGroup(linkData, linkData.unlink);

      res.status(status).json(linkCreated);
    } catch (error) {
      next(error);
    }
  };

  export const getOne = async (req, res, next) => {
    const { groupId } = req.user;
    const { uuid: campaignUuid } = req.params;

    try {
      if (groupId != Roles.SuperAdmin) {
        res.status(403).send("unauthorized");
        return;
      }

      const campaign = await CampaignsService.getOne(campaignUuid, {
        groupCampaigns: true,
        leads: { user: true },
      });

      for (const lead of campaign.leads) {
        if (lead?.billUri && !lead.billUri.startsWith("https://bajatufactura")) {
          try {
            lead.billUri = AwsHelper.getPresignedUrl(lead.billUri);
          } catch (error) {
            console.error(`Error generating presigned URL for lead ID: ${lead.id}`, error);
          }
        }
      }

      res.json(campaign);
    } catch (error) {
      next(error);
    }
  };

  export const getAllWithPaginatedLeads = async (req, res, next) => {
    const { groupId } = req.user;

    const { leadPage = 1, leadLimit = 10 } = req.query;

    const leadPageNumber = parseInt(leadPage, 10);
    const leadLimitNumber = parseInt(leadLimit, 10);

    const leadSkip = (leadPageNumber - 1) * leadLimitNumber;

    try {
      if (groupId != Roles.SuperAdmin) {
        res.status(403).send("unauthorized");
        return;
      }

      const allCampaigns = await CampaignsService.getMany({
        groupCampaigns: true,
      });

      const response = [];

      for (const campaign of allCampaigns) {
        const [leads, totalLeads] = await CampaignsService.getLeadsForCampaignPaginated(
          campaign.id,
          leadSkip,
          leadLimitNumber
        );

        for (const lead of leads) {
          if (lead?.billUri && !lead.billUri.startsWith("https://crm")) {
            try {
              lead.billUri = AwsHelper.getPresignedUrl(lead.billUri);
            } catch (error) {
              console.error(`Error generating presigned URL for lead ID: ${lead.id}`, error);
            }
          }
        }

        const campaignWithLeads = {
          ...campaign,
          leads,
          leadPagination: {
            totalLeads,
            totalPages: Math.ceil(totalLeads / leadLimitNumber),
            currentPage: leadPageNumber,
          },
        };

        response.push(campaignWithLeads);
      }

      const [orphanLeads, totalOrphanLeads] = await CampaignsService.getOrphanLeadsPaginated();

      if (totalOrphanLeads > 0) {
        for (const lead of orphanLeads) {
          if (lead?.billUri && !lead.billUri.startsWith("https://crm")) {
            try {
              lead.billUri = AwsHelper.getPresignedUrl(lead.billUri);
            } catch (error) {
              console.error(`Error generating presigned URL for orphan lead ID: ${lead.id}`, error);
            }
          }
        }

        const fictionalCampaign = {
          id: 9999,
          uuid: "no-campaign-uuid",
          name: "Leads sin Campaña",
          type: "Automatic",
          leads: orphanLeads,
          leadPagination: {
            totalLeads: totalOrphanLeads,
            totalPages: Math.ceil(totalOrphanLeads / leadLimitNumber),
            currentPage: leadPageNumber,
          },
        };

        response.push(fictionalCampaign);
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  export const deleteCampaign = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      await CampaignsService.deleteByUuid(uuid);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
