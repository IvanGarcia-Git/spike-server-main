import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Generated } from "typeorm";
import { User } from "./user.entity";

@Entity("note_folder")
export class NoteFolder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", generated: "uuid" })
  @Generated("uuid")
  uuid: string;

  @Column({ type: "varchar", length: 255 })
  folderId: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  parentId: string;

  @ManyToOne(() => User, user => user.noteFolders)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}