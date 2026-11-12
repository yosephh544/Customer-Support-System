import { api } from './client';
import type { PagedResult, PaginationParams, UserProfile, UserRole } from '../types';

export interface CreateUserInput {
  fullName: string;
  userName: string;
  email?: string;
  password: string;
  phoneNumber?: string;
  role: UserRole;
  directPermissions?: string[];
}

export interface UpdateUserInput {
  fullName: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  role?: UserRole;
  password?: string;
  isActive?: boolean;
}

export const usersApi = {
  getUsers: (params?: PaginationParams & { role?: string; isActive?: boolean }) =>
    api.get<PagedResult<UserProfile>>('/users', params),

  getUserById: (id: string) =>
    api.get<UserProfile>(`/users/${id}`),

  createUser: (data: CreateUserInput) =>
    api.post<UserProfile>('/users', {
      ...data,
      role: Number(data.role),
    }),

  updateUser: (id: string, data: UpdateUserInput) =>
    api.put<UserProfile>(`/users/${id}`, {
      ...data,
      role: data.role !== undefined ? Number(data.role) : undefined,
    }),

  changePassword: (id: string, newPassword: string) =>
    api.put<{ success: boolean; message: string }>(`/users/${id}/password`, { newPassword }),

  updateUserRole: (id: string, role: UserRole) =>
    api.put<void>(`/users/${id}/roles`, { role: Number(role) }),

  deleteUser: (id: string) =>
    api.delete<void>(`/users/${id}`),

  getRolesCatalog: () =>
    api.get<any>('/permissions/catalog'),
};
