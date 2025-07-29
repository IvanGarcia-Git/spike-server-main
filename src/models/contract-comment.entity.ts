import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from "typeorm";
  import { User } from "./user.entity";
  import { Contract } from "./contract.entity";
  
  @Entity()
  export class ContractComment {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column("text")
    text: string;
  
    @Column("varchar", { length: 255, nullable: true })
    documentUri?: string;
  
    @Column()
    contractId: number;
  
    @Column()
    userId: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @ManyToOne(() => Contract, (contract) => contract.comments, { onDelete: "CASCADE" })
    contract: Contract;
  
    @ManyToOne(() => User, (user) => user.comments, { onDelete: "CASCADE" })
    user: User;
  }
  