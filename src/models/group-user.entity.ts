import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { Group } from "./group.entity";
import { User } from "./user.entity";

@Entity()
export class GroupUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Group, (group) => group.groupUsers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "groupId" })
  group: Group;

  @ManyToOne(() => User, (user) => user.groupUsers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
