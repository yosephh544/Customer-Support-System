export type WeeklyScheduleStatus = 0 | 1 | 2; // Draft = 0, Active = 1, Completed = 2
export type ScheduleItemStatus = 0 | 1 | 2; // Pending = 0, Completed = 1, Skipped = 2

export interface WeeklySchedule {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  weekNumber: number;
  year: number;
  status: WeeklyScheduleStatus;
  statusName: string;
  notes?: string;
  totalItems: number;
  pendingItems: number;
  completedItems: number;
  skippedItems: number;
  createdAt: string;
  updatedAt?: string;
  items?: ScheduleItem[];
}

export interface ScheduleItem {
  id: string;
  weeklyScheduleId: string;
  weekNumber: number;
  year: number;
  assignedUserId: string;
  assignedUserName: string;
  assignedUserFullName: string;
  contactPersonId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail?: string;
  contactPersonJobTitle?: string;
  organizationId: string;
  organizationName: string;
  projectId?: string;
  projectName?: string;
  projectModuleId?: string;
  moduleName?: string;
  scheduledDate?: string;
  status: ScheduleItemStatus;
  statusName: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateScheduleRequest {
  weekStartDate?: string;
  weekEndDate?: string;
  weekNumber?: number;
  year?: number;
  status?: WeeklyScheduleStatus;
  notes?: string;
}

export interface UpdateScheduleItemStatusRequest {
  status: ScheduleItemStatus;
  notes?: string;
}

