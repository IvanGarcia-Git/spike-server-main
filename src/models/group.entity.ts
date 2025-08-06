import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Generated,
} from "typeorm";
import { GroupCampaign } from "./group-campaign.entity";
import { GroupUser } from "./group-user.entity";

export enum GroupShift {
  MORNING = "morning",
  EVENING = "evening",
  ALL = "all"
}

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", { length: 100 })
  name: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({
    type: "varchar"
  })
  shift: GroupShift;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GroupCampaign, (groupCampaign) => groupCampaign.group)
  groupCampaigns: GroupCampaign[];

  @OneToMany(() => GroupUser, (groupUser) => groupUser.group)
  groupUsers: GroupUser[];
}
