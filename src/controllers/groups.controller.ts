import { Roles } from "../enums/roles.enum";
import { GroupsService } from "../services/groups.service";

export module GroupsController {
  export const createOrUpdate = async (req, res, next) => {
    const groupData = req.body;

    try {
      const groupCreated = await GroupsService.createOrUpdate(groupData);

      res.status(201).json(groupCreated);
    } catch (error) {
      next(error);
    }
  };

  export const linkUser = async (req, res, next) => {
    const linkData = req.body;

    try {
      const linkCreated = await GroupsService.linkUser(linkData);

      res.status(201).json(linkCreated);
    } catch (error) {
      next(error);
    }
  };

  export const unlinkUser = async (req, res, next) => {
    const linkData = req.body;

    try {
      const linkRemoved = await GroupsService.unlinkUser(linkData);

      res.json({ linkRemoved });
    } catch (error) {
      next(error);
    }
  };

  export const getUserGroups = async (req, res, next) => {
    const { userId } = req.params;

    try {
      const groupsFound = await GroupsService.getUserGroups(userId);

      res.json(groupsFound);
    } catch (error) {
      next(error);
    }
  };

  export const getOne = async (req, res, next) => {
    const { groupId } = req.user;
    const { groupUuid } = req.params;

    try {
      if (groupId != Roles.Admin) {
        res.status(403).send("unauthorized");
        return;
      }

      const groupFound = await GroupsService.getOne(
        groupUuid,
        {
          groupCampaigns: {
            campaign: true,
          },
          groupUsers: {
            user: true,
          },
        },
        true
      );

      res.json(groupFound);
    } catch (error) {
      next(error);
    }
  };

  export const getAll = async (req, res, next) => {
    const { groupId } = req.user;

    try {
      if (groupId != Roles.Admin) {
        res.status(403).send("unauthorized");
        return;
      }

      const allGroups = await GroupsService.getMany({ groupUsers: true }, true);

      res.json(allGroups);
    } catch (error) {
      next(error);
    }
  };

  export const deleteGroup = async (req, res, next) => {
    try {
      const { groupUuid } = req.params;
      const deleted = await GroupsService.deleteGroup(groupUuid);

      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };
}
