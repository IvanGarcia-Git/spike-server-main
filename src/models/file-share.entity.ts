import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";
import { File } from "./file.entity";

export enum SharePermission {
  READ = "read",
  WRITE = "write",
}

@Entity("file_share")
@Unique(["fileId", "sharedWithUserId"]) // Un archivo solo puede compartirse una vez con cada usuario
export class FileShare {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  fileId: number;

  @Column("int")
  sharedByUserId: number;

  @Column("int")
  sharedWithUserId: number;

  @Column({
    type: "varchar",
    length: 10,
    default: SharePermission.READ,
  })
  permission: SharePermission;

  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => File, (file) => file.shares, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fileId" })
  file: File;

  @ManyToOne(() => User, (user) => user.sharedFiles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sharedByUserId" })
  sharedByUser: User;

  @ManyToOne(() => User, (user) => user.receivedShares, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sharedWithUserId" })
  sharedWithUser: User;
}
