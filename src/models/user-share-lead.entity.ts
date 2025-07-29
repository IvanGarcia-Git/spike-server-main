import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserShareLead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  visibleShareLeadUserId: number;

  @ManyToOne(() => User, (user) => user.visibleShareLeadUsers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "visibleShareLeadUserId" })
  visibleShareLeadUser: User;
}
