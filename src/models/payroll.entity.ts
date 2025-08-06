import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Generated,
  } from "typeorm";
  import { User } from "./user.entity";
  import { PayrollState } from "../enums/payroll-state.enum";
  
  @Entity({ name: "payroll" })
  export class Payroll {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column("varchar", { length: 36 })
    @Generated("uuid")
    uuid: string;
  
    @Column()
    userId: number;
  
    @Column({
      type: "varchar", default: PayrollState.Pendiente,
    })
    state: PayrollState;
  
    @Column("decimal", { precision: 10, scale: 2 })
    qty: number;
  
    @Column({ type: "date" })
    date: string;
  
    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
  
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
  
    @ManyToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;
  }
  