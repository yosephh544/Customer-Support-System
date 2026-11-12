import { api } from './client';
import type { Organization, PagedResult, PaginationParams } from '../types';

export interface CreateOrganizationInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateOrganizationInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export const organizationsApi = {
  getOrganizations: (params?: PaginationParams & { isActive?: boolean }) =>
    api.get<PagedResult<Organization>>('/organizations', params),

  getOrganizationById: (id: string) =>
    api.get<Organization>(`/organizations/${id}`),

  createOrganization: (data: CreateOrganizationInput) =>
    api.post<Organization>('/organizations', data),

  updateOrganization: (id: string, data: UpdateOrganizationInput) =>
    api.put<Organization>(`/organizations/${id}`, data),

  deleteOrganization: (id: string) =>
    api.delete<void>(`/organizations/${id}`),
};

