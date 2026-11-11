import { api } from './client';
import type { MasterModule, PagedResult, PaginationParams } from '../types';

export interface CreateMasterModuleInput {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateMasterModuleInput {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export const modulesApi = {
  getMasterModules: (params?: PaginationParams & { isActive?: boolean }) =>
    api.get<PagedResult<MasterModule>>('/modules', params),

  getMasterModuleById: (id: string) =>
    api.get<MasterModule>(`/modules/${id}`),

  createMasterModule: (data: CreateMasterModuleInput) =>
    api.post<MasterModule>('/modules', data),

  updateMasterModule: (id: string, data: UpdateMasterModuleInput) =>
    api.put<MasterModule>(`/modules/${id}`, data),

  deleteMasterModule: (id: string) =>
    api.delete<void>(`/modules/${id}`),
};

