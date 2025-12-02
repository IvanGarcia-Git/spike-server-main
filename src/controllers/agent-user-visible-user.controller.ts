import { Roles } from "../enums/roles.enum";
import { AgentUserVisibleUserService } from "../services/user-agent-visible-user.service";

export module AgentUserVisibleUserController {
  const SUPER_ADMIN_GROUP_ID = 1;
  export const createBatch = async (req, res, next) => {
    const { agentId, visibleUserIds } = req.body;

    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const accessCreated = await AgentUserVisibleUserService.createBatch(
        agentId,
        visibleUserIds
      );

      res.json(accessCreated);
    } catch (error) {
      next(error);
    }
  };
}
