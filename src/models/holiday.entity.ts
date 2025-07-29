import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("holidays")
export class Holiday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: string;

  @Column()
  name: string;
}
