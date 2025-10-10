import { Roles } from "../enums/roles.enum";
import { User } from "../models/user.entity";
import { UserShareLeadsService } from "../services/user-share-leads.service";
import { UsersService } from "../services/users.service";

export module UserShareLeadsController {
  export const createBatch = async (req, res, next) => {
    const { userId, visibleUserIds } = req.body;

    try {
      const { groupId } = req.user;

      if (groupId != Roles.Admin) {
        res.status(403).send("unauthorized");
        return;
      }

      const accessCreated = await UserShareLeadsService.createBatch(
        userId,
        visibleUserIds
      );

      res.json(accessCreated);
    } catch (error) {
      next(error);
    }
  };

  export const getList = async (req, res, next) => {
    const { userId } = req.body;

    try {
      const visibleUsersShareLeads = await UserShareLeadsService.getMany(
        {
          userId,
        },
        { visibleShareLeadUser: true }
      );

      const visibleUsersShareLeadsIds: number[] = visibleUsersShareLeads.map(
        (visibleShareUser) => visibleShareUser.visibleShareLeadUserId
      );

      res.json({ visibleUsersShareLeadsIds, visibleUsersShareLeads });
    } catch (err) {
      next(err);
    }
  };
}
