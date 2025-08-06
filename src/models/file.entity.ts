import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Generated,
} from "typeorm";
import { User } from "./user.entity";
import { Folder } from "./folder.entity";

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", default: "private" })
  type: "private" | "shared";

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  uri: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: "bigint" })
  size: number;

  @Column("int", { nullable: true })
  folderId?: number;

  @Column("int")
  ownerUserId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
  ownerUser: User;

  @ManyToOne(() => Folder, (folder) => folder.files, {
    nullable: true,
    onDelete: "CASCADE",
  })
  folder: Folder | null;
}
