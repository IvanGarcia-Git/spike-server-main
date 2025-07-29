// src/entities/user-document.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column()
  userId: number;

  @Column("varchar", {
    length: 255,
  })
  documentUri: string;

  @Column("varchar", {
    length: 255,
  })
  originalName: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.documents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;
}
