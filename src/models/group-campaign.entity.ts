import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { Group } from "./group.entity";
import { Campaign } from "./campaign.entity";

@Entity()
export class GroupCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column()
  campaignId: number;

  @ManyToOne(() => Group, (group) => group.groupCampaigns, { onDelete: "CASCADE" })
  @JoinColumn({ name: "groupId" })
  group: Group;

  @ManyToOne(() => Campaign, (campaign) => campaign.groupCampaigns, { onDelete: "CASCADE" })
  @JoinColumn({ name: "campaignId" })
  campaign: Campaign;
}
