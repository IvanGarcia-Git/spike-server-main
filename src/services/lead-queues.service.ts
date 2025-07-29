import { LeadQueue } from "../models/lead-queue.entity";
import { dataSource } from "../../app-data-source";

export module LeadQueuesService {
  export const create = async (
    leadId: number,
    userId: number
  ): Promise<LeadQueue> => {
    try {
      const leadQueueRepository = dataSource.getRepository(LeadQueue);

      const newLeadQueue = leadQueueRepository.create({
        leadId,
        userId,
      });

      return await leadQueueRepository.save(newLeadQueue);
    } catch (error) {
      throw new Error(`Error creating LeadQueue: ${error.message}`);
    }
  };

  export const deleteFirst = async (userId: number): Promise<void> => {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const leadQueueRepository = queryRunner.manager.getRepository(LeadQueue);

      const firstElement = await leadQueueRepository.findOne({
        where: {
          userId,
        },
        order: { position: "ASC" },
      });

      if (!firstElement) {
        throw new Error("No lead queue entry found for the specified userId.");
      }

      await leadQueueRepository.remove(firstElement);

      await leadQueueRepository
        .createQueryBuilder()
        .update(LeadQueue)
        .set({ position: () => "`position` - 1" })
        .where("userId = :userId", { userId })
        .andWhere("position > :deletedPosition", {
          deletedPosition: firstElement.position,
        })
        .execute();

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  };
}
