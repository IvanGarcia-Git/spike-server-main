import { AgentUserVisibleUser } from "../models/agent-user-visible-user.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";

export module AgentUserVisibleUserService {
  export const createBatch = async (
    agentId: number,
    visibleUserIds: number[]
  ): Promise<AgentUserVisibleUser[]> => {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const agentUserVisibleUserRepository =
        queryRunner.manager.getRepository(AgentUserVisibleUser);

      await agentUserVisibleUserRepository.delete({ agentId });

      const newVisibleUsers = visibleUserIds.map((visibleUserId) => {
        return agentUserVisibleUserRepository.create({
          agentId,
          visibleUserId,
        });
      });

      const savedVisibleUsers = await agentUserVisibleUserRepository.save(
        newVisibleUsers
      );

      await queryRunner.commitTransaction();

      return savedVisibleUsers;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<AgentUserVisibleUser>,
    relations: FindOptionsRelations<AgentUserVisibleUser> = {}
  ): Promise<AgentUserVisibleUser[]> => {
    try {
      const accessRepository = dataSource.getRepository(AgentUserVisibleUser);

      return await accessRepository.find({
        where,
        relations,
      });
    } catch (error) {
      throw error;
    }
  };
}
