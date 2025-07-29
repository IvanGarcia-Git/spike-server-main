import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from "typeorm";
import { Channel } from "./channel.entity";
import { Rate } from "./rate.entity";
import { User } from "./user.entity";

@Entity()
@Unique(["channel", "rate", "user"])
export class CommissionAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Channel, (channel) => channel.commissionAssignments, {
    onDelete: "CASCADE"
  })
  channel: Channel;

  @ManyToOne(() => Rate, (rate) => rate.commissionAssignments, {
    onDelete: "CASCADE"
  })
  rate: Rate;

  @ManyToOne(() => User, (user) => user.commissionAssignments, {
    onDelete: "SET NULL"
  })
  user: User;

  @Column("int")
  amount: number;
}
