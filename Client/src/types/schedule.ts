export type WeeklyScheduleStatus = 0 | 1 | 2 | 'Draft' | 'Active' | 'Completed' | string;

export const ScheduleItemStatus = {
  Pending: 0,
  Completed: 1,
  Skipped: 2,
} as const;
export type ScheduleItemStatus =
  | (typeof ScheduleItemStatus)[keyof typeof ScheduleItemStatus]
  | 'Pending'
  | 'Completed'
  | 'Skipped'
  | string;

export function isCompletedTouchpoint(status: any): boolean {
  if (status === 1 || status === '1') return true;
  if (typeof status === 'string' && (status.toLowerCase() === 'completed' || status.toLowerCase() === 'resolved')) {
    return true;
  }
  return false;
}

export function isSkippedTouchpoint(status: any): boolean {
  if (status === 2 || status === '2') return true;
  if (typeof status === 'string' && status.toLowerCase() === 'skipped') {
    return true;
  }
  return false;
}

export function isPendingTouchpoint(status: any): boolean {
  if (status === 0 || status === '0') return true;
  if (typeof status === 'string' && status.toLowerCase() === 'pending') {
    return true;
  }
  return !isCompletedTouchpoint(status) && !isSkippedTouchpoint(status);
}

export function isActiveSchedule(status: any): boolean {
  if (status === 1 || status === '1') return true;
  if (typeof status === 'string' && status.toLowerCase() === 'active') return true;
  return false;
}

export function isCompletedSchedule(status: any): boolean {
  if (status === 2 || status === '2') return true;
  if (typeof status === 'string' && status.toLowerCase() === 'completed') return true;
  return false;
}

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

  // Compatibility aliases
  startDate?: string;
  endDate?: string;
  totalSlots?: number;
  completedSlots?: number;
  overdueSlots?: number;
  isPublished?: boolean;
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

  // Compatibility aliases
  agentName?: string;
  targetDate?: string;
  dayOfWeek?: string;
}

export interface CreateScheduleRequest {
  weekStartDate?: string;
  weekEndDate?: string;
  startDate?: string;
  endDate?: string;
  weekNumber?: number;
  year?: number;
  status?: WeeklyScheduleStatus;
  notes?: string;
}

export interface UpdateScheduleItemStatusRequest {
  status: ScheduleItemStatus;
  notes?: string;
}

