import { api } from './client';
import type { CreateAssignmentRequest, PagedResult, PaginationParams, SupportAssignment, UpdateAssignmentRequest } from '../types';

export const assignmentsApi = {
  getAssignments: (params?: PaginationParams & { projectId?: string; projectModuleId?: string; userId?: string; isActive?: boolean }) =>
    api.get<PagedResult<SupportAssignment>>('/assignments', params),

  getAssignmentById: (id: string) =>
    api.get<SupportAssignment>(`/assignments/${id}`),

  getAssignmentsByProject: (projectId: string) =>
    api.get<SupportAssignment[]>(`/assignments/by-project/${projectId}`),

  getAssignmentsByUser: (userId: string) =>
    api.get<SupportAssignment[]>(`/assignments/by-user/${userId}`),

  createAssignment: (data: CreateAssignmentRequest) =>
    api.post<SupportAssignment>('/assignments', data),

  updateAssignment: (id: string, data: UpdateAssignmentRequest) =>
    api.put<SupportAssignment>(`/assignments/${id}`, data),

  deleteAssignment: (id: string) =>
    api.delete<void>(`/assignments/${id}`),
};

