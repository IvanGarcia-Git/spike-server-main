export interface TaskSearchDTO {
  from?: Date;
  to?: Date;
  subject?: string;
  assigneeUserId?: number;
  taskStateId?: number;
}
