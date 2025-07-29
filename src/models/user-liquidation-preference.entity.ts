// src/entities/user-liquidation-preference.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserLiquidationPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  userId: number;

  /**
   * E.J.: ["creationDate", "totalAmount", "status", "channelName", ...]
   */
  @Column("simple-json")
  columns: string[];

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
