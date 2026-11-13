import { api } from './client';
import type {
  CreateScheduleRequest,
  PagedResult,
  PaginationParams,
  ScheduleItem,
  ScheduleItemStatus,
  UpdateScheduleItemStatusRequest,
  WeeklySchedule,
  WeeklyScheduleStatus,
} from '../types';

export interface CreateScheduleItemInput {
  assignedUserId: string;
  contactPersonId: string;
  scheduledDate?: string;
  notes?: string;
}

export interface UpdateScheduleItemInput {
  assignedUserId: string;
  contactPersonId: string;
  scheduledDate?: string;
  status: ScheduleItemStatus;
  notes?: string;
}

export const schedulesApi = {
  // Weekly Schedules
  getSchedules: (params?: PaginationParams & { year?: number; weekNumber?: number; status?: WeeklyScheduleStatus }) =>
    api.get<PagedResult<WeeklySchedule>>('/schedules', params),

  getCurrentSchedule: () =>
    api.get<WeeklySchedule>('/schedules/current'),

  getScheduleById: (id: string) =>
    api.get<WeeklySchedule>(`/schedules/${id}`),

  createSchedule: (data: CreateScheduleRequest) =>
    api.post<WeeklySchedule>('/schedules', data),

  updateSchedule: (id: string, data: Partial<CreateScheduleRequest>) =>
    api.put<WeeklySchedule>(`/schedules/${id}`, data),

  deleteSchedule: (id: string) =>
    api.delete<void>(`/schedules/${id}`),

  generateTouchpoints: (id: string) =>
    api.post<WeeklySchedule>(`/schedules/${id}/generate`),

  autoGenerateSchedule: (id: string) =>
    api.post<WeeklySchedule>(`/schedules/${id}/generate`),

  // Schedule Items
  getScheduleItems: (scheduleId: string, params?: PaginationParams & { assignedUserId?: string; status?: ScheduleItemStatus }) =>
    api.get<PagedResult<ScheduleItem>>(`/schedules/${scheduleId}/items`, params),

  getItemById: (itemId: string) =>
    api.get<ScheduleItem>(`/schedules/items/${itemId}`),

  getMyItems: (params?: PaginationParams & { status?: ScheduleItemStatus }) =>
    api.get<PagedResult<ScheduleItem>>('/schedules/my-items', params),

  createItem: (scheduleId: string, data: CreateScheduleItemInput) =>
    api.post<ScheduleItem>(`/schedules/${scheduleId}/items`, data),

  updateItem: (itemId: string, data: UpdateScheduleItemInput) =>
    api.put<ScheduleItem>(`/schedules/items/${itemId}`, data),

  updateItemStatus: (itemId: string, data: UpdateScheduleItemStatusRequest) =>
    api.patch<ScheduleItem>(`/schedules/items/${itemId}/status`, data),

  deleteItem: (itemId: string) =>
    api.delete<void>(`/schedules/items/${itemId}`),
};

