import { dataSource } from "../../app-data-source";
import { CommissionAssignment } from "../models/commission-assignment.entity";
import { Channel } from "../models/channel.entity";
import { Rate } from "../models/rate.entity";
import { User } from "../models/user.entity";

export interface UpsertCommissionDTO {
  channelId: number;
  rateId: number;
  userId: number;
  amount: number;
}

export module CommissionAssignmentsService {
  export const listByChannel = async (channelId: number) => {
    const repo = dataSource.getRepository(CommissionAssignment);
    const assignments = await repo.find({
      where: { channel: { id: channelId } },
      relations: ["rate", "user"],
    });

    // Sólo devolvemos lo que necesita el front
    return assignments.map((a) => ({
      rateId: a.rate.id,
      userId: a.user?.id ?? null,
      amount: a.amount,
    }));
  };

  export const upsert = async (dto: UpsertCommissionDTO) => {
    const repo = dataSource.getRepository(CommissionAssignment);

    // ¿Ya existe una asignación para este canal + esta rate?
    let assignment = await repo.findOne({
      where: {
        channel: { id: dto.channelId } as Channel,
        rate: { id: dto.rateId } as Rate,
        user:    { id: dto.userId }   as User,
      },
      relations: ["channel", "rate", "user"],
    });

    if (assignment) {
      // Actualizamos usuario y cantidad
      assignment.user = { id: dto.userId } as User;
      assignment.amount = dto.amount;
    } else {
      // Creamos nueva
      assignment = repo.create({
        channel: { id: dto.channelId } as Channel,
        rate: { id: dto.rateId } as Rate,
        user: { id: dto.userId } as User,
        amount: dto.amount,
      });
    }

    const saved = await repo.save(assignment);
    return {
      id: saved.id,
      rateId: saved.rate.id,
      userId: saved.user.id,
      amount: saved.amount,
    };
  };
}
