import { Roles } from "../enums/roles.enum";
import { AgentUserVisibleUserService } from "../services/user-agent-visible-user.service";

export module AgentUserVisibleUserController {
  export const createBatch = async (req, res, next) => {
    const { agentId, visibleUserIds } = req.body;

    try {
      const { groupId } = req.user;

      if (groupId != Roles.Admin) {
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
