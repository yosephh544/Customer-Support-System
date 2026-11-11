import { api } from './client';
import type { PagedResult, PaginationParams, UserProfile, UserRole } from '../types';

export interface CreateUserInput {
  fullName: string;
  userName?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: UserRole;
  directPermissions?: string[];
}

export interface UpdateUserInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
}

export const usersApi = {
  getUsers: (params?: PaginationParams & { role?: string; isActive?: boolean }) =>
    api.get<PagedResult<UserProfile>>('/users', params),

  getUserById: (id: string) =>
    api.get<UserProfile>(`/users/${id}`),

  createUser: (data: CreateUserInput) =>
    api.post<UserProfile>('/users', data),

  updateUser: (id: string, data: UpdateUserInput) =>
    api.put<UserProfile>(`/users/${id}`, data),

  updateUserRole: (id: string, role: UserRole) =>
    api.put<void>(`/users/${id}/role`, { role }),

  deleteUser: (id: string) =>
    api.delete<void>(`/users/${id}`),

  getRolesCatalog: () =>
    api.get<any>('/permissions/catalog'),
};

