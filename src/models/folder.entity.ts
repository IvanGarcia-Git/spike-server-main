import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Generated,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { File } from "./file.entity";

@Entity()
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "enum", enum: ["private", "shared"], default: "private" })
  type: "private" | "shared";

  @Column("boolean", {
    default: false,
  })
  locked: boolean;

  @Column("int", { nullable: true })
  ownerUserId?: number;

  @Column("int", { nullable: true })
  parentFolderId?: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.folders, { onDelete: "SET NULL" })
  ownerUser: User;

  @ManyToOne(() => Folder, (folder) => folder.subfolders, {
    nullable: true,
    onDelete: "CASCADE",
  })
  parentFolder: Folder | null;

  @OneToMany(() => Folder, (folder) => folder.parentFolder)
  subfolders: Folder[];

  @OneToMany(() => File, (file) => file.folder)
  files: File[];
}
