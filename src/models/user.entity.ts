import { Contract } from "./contract.entity";
import { dataSource } from "../../app-data-source";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  Generated,
  OneToMany,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Task } from "./task.entity";
import { TaskComment } from "./task-comment.entity";
import { Notification } from "./notification.entity";
import { AgentUserVisibleUser } from "./agent-user-visible-user.entity";
import { Reminder } from "./reminder.entity";
import { GroupUser } from "./group-user.entity";
import { LeadLog } from "./lead-log.entity";
import { LeadQueue } from "./lead-queue.entity";
import { Lead } from "./lead.entity";
import { UserShareLead } from "./user-share-lead.entity";
import { File } from "./file.entity";
import { Folder } from "./folder.entity";
import { Absence } from "./absence.entity";
import { UserShift } from "../enums/user-shift.enum";
import { Roles } from "../enums/roles.enum";
import { CommissionAssignment } from "./commission-assignment.entity";
import { Liquidation } from "./liquidation.entity";
import { UserDocument } from "./user-document.entity";
import { Note } from "./note.entity";
import { NoteFolder } from "./note-folder.entity";

//Also dynamic keys for user groups e.j "group${group.id}"
export enum LeadPriority {
  RECENT_FIRST = "recent_first",
  OLDEST_FIRST = "oldest_first",
  WITH_ATTACHMENTS = "with_attachments",
  FROM_QUEUE = "from_queue",
  MORNING_SHIFT = "morning_shift",
  EVENING_SHIFT = "evening_shift",
  NOT_RESPONDING = "not_responding",
}

export enum NotificationPreference {
  REMINDER = "reminder",
  TASK = "task",
  VACATION_REQUEST = "vacation_request",
  LEAD_CALL = "lead_call",
  COMMUNICATION = "communication",
  CONTRACT_EXPIRATION = "contract_expiration",
  CONTRACT_ACTIVATED = "contract_activated",
  CONTRACT_COMMENTED = "contract_commented",
  STATE_CHANGE = "state_change",
  RENEW_PAYMENT = "renew_payment",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", {
    length: 36,
  })
  @Generated("uuid")
  uuid: string;

  @Column("varchar", {
    length: 50,
  })
  name: string;

  @Column("varchar", {
    length: 50,
  })
  firstSurname: string;

  @Column("varchar", {
    length: 50,
  })
  secondSurname: string;

  @Column("varchar", {
    length: 50,
    unique: true,
  })
  username: string;

  @Column("varchar", {
    length: 50,
    unique: true,
  })
  email: string;

  @Column("varchar", {
    length: 255,
  })
  password: string;

  @Column("boolean")
  isManager: boolean;

  @Column({
    type: "varchar",
    length: 50,
    default: Roles.Colaborador
  })
  role: Roles;

  @Column("varchar", {
    length: 255,
    nullable: true,
  })
  imageUri?: string;

  @Column({ type: "int", unsigned: true })
  groupId: number;

  @Column({ type: "int", unsigned: true, nullable: true })
  parentGroupId?: number;

  @Column({ nullable: true })
  leadId?: number;

  @Column("simple-json")
  leadPriorities: LeadPriority[];

  @Column("simple-json", { nullable: true })
  notificationsPreferences?: NotificationPreference[];

  @Column({ type: "date", name: "start_date", nullable: true })
  startDate?: string;

  @Column("varchar", { length: 30, nullable: true })
  days?: string;

  @Column("varchar", { length: 20, nullable: true })
  time?: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  shift?: UserShift;

  @Column("varchar", { length: 20, nullable: true })
  phone?: string;

  @Column("varchar", { length: 34, nullable: true })
  iban?: string;

  @Column("varchar", { length: 255, nullable: true })
  address?: string;

  @Column("varchar", { length: 50, nullable: true })
  cif?: string;

  @Column("simple-json", { nullable: true })
  notificationsEmailPreferences?: NotificationPreference[];

  //Relations
  @OneToOne(() => Lead, (lead) => lead.user, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "leadId" })
  lead?: Lead;

  @OneToMany(() => Contract, (contract) => contract.user)
  contracts: Contract[];

  @OneToMany(() => Task, (task) => task.assigneeUser)
  assignedTasks: Task[];

  @OneToMany(() => Task, (task) => task.creatorUser)
  createdTasks: Task[];

  @OneToMany(() => TaskComment, (taskComment) => taskComment.user)
  comments: TaskComment[];

  @OneToMany(() => Folder, (folder) => folder.ownerUser)
  folders: Folder[];

  @OneToMany(() => File, (file) => file.ownerUser)
  files: File[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Reminder, (reminder) => reminder.user)
  reminders: Reminder[];

  @OneToMany(() => AgentUserVisibleUser, (agentUserVisibleUser) => agentUserVisibleUser.agentId)
  visibleUsers: AgentUserVisibleUser[];

  @OneToMany(
    () => UserShareLead,
    (visibleShareLeadUser) => visibleShareLeadUser.visibleShareLeadUser
  )
  visibleShareLeadUsers: UserShareLead[];

  @OneToMany(() => GroupUser, (groupUser) => groupUser.user)
  groupUsers: GroupUser[];

  @OneToMany(() => LeadLog, (leadLog) => leadLog.user)
  leadLogs: LeadLog[];

  @OneToMany(() => LeadQueue, (leadQueue) => leadQueue.user)
  leadQueues: LeadQueue[];

  @OneToMany(() => Absence, (absence) => absence.user)
  absences: Absence[];

  @OneToMany(() => CommissionAssignment, (ca) => ca.user)
  commissionAssignments: CommissionAssignment[];

  @OneToMany(() => Liquidation, (liquidation) => liquidation.user)
  liquidations: Liquidation[];

  @OneToMany(() => UserDocument, (document) => document.user)
  documents: UserDocument[];

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];

  @OneToMany(() => NoteFolder, (noteFolder) => noteFolder.user)
  noteFolders: NoteFolder[];

  @BeforeInsert()
  @BeforeUpdate()
  async generateGroupId() {
    if (!this.groupId) {
      const lastUser = await dataSource.getRepository(User).find({
        order: { groupId: "DESC" },
        take: 1,
      });

      if (lastUser.length > 0) {
        this.groupId = lastUser[0].groupId + 1;
      } else {
        this.groupId = 1;
      }
    }
  }
}
