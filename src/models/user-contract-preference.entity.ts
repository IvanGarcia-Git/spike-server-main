import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserContractPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column("simple-json")
  columns: string[];

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
