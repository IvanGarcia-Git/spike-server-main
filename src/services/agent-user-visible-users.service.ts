import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { AgentUserVisibleUser } from "../models/agent-user-visible-user.entity";

export module AgentUserVisibleUsersService {
  export const getVisibleUsersIds = async (
    where: FindOptionsWhere<AgentUserVisibleUser>,
    relations: FindOptionsRelations<AgentUserVisibleUser> = {}
  ): Promise<number[]> => {
    try {
      const agentUserVisibleUserRepository =
        dataSource.getRepository(AgentUserVisibleUser);

      const resultsFound = await agentUserVisibleUserRepository.find({
        where,
        relations,
      });

      const visibleUsersIds: number[] = [];

      for (const visibility of resultsFound) {
        visibleUsersIds.push(visibility.visibleUserId);
      }

      return visibleUsersIds;
    } catch (error) {
      throw error;
    }
  };
}
