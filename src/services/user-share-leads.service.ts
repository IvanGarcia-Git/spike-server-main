import { UserShareLead } from "../models/user-share-lead.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";

export module UserShareLeadsService {
  export const createBatch = async (
    userId: number,
    visibleUserIds: number[]
  ): Promise<UserShareLead[]> => {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const agentUserVisibleUserRepository =
        queryRunner.manager.getRepository(UserShareLead);

      await agentUserVisibleUserRepository.delete({ userId });

      const newVisibleUsers = visibleUserIds.map((visibleUserId) => {
        return agentUserVisibleUserRepository.create({
          userId,
          visibleShareLeadUserId: visibleUserId,
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
    where: FindOptionsWhere<UserShareLead>,
    relations: FindOptionsRelations<UserShareLead> = {}
  ): Promise<UserShareLead[]> => {
    try {
      const accessRepository = dataSource.getRepository(UserShareLead);

      return await accessRepository.find({
        where,
        relations,
      });
    } catch (error) {
      throw error;
    }
  };
}
