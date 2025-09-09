import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Generated } from "typeorm";
import { User } from "./user.entity";

@Entity("note")
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", generated: "uuid" })
  @Generated("uuid")
  uuid: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "boolean", default: false })
  isFavorite: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  folderId: string;

  @ManyToOne(() => User, user => user.notes)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}