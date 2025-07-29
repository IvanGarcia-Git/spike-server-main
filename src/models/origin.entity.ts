import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Customer } from "./customer.entity";

@Entity()
export class Origin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 50,
  })
  name: string;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  extraInfo?: string;

  @OneToMany(() => Customer, (customers) => customers.origin)
  customers: Customer[];
}
