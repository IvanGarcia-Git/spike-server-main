import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { GroupCampaign } from "./group-campaign.entity";
import { Lead } from "./lead.entity";

export enum CampaignType {
  AUTOMATIC = "Automatic",
  MANUAL = "Manual",
}

export enum CampaignSector {
  LUZ = "Luz",
  GAS = "Gas",
  PLACAS = "Placas",
  TELEFONIA = "Telefonia",
}

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", {
    length: 255,
  })
  name: string;

  @Column({
    type: "enum",
    enum: CampaignType,
    default: CampaignType.AUTOMATIC,
  })
  type: CampaignType;

  @Column({
    type: "enum",
    enum: CampaignSector,
    nullable: true,
  })
  sector?: CampaignSector;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  source?: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GroupCampaign, (groupCampaign) => groupCampaign.campaign)
  groupCampaigns: GroupCampaign[];

  @OneToMany(() => Lead, (lead) => lead.campaign)
  leads: Lead[];
}
