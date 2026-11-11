import { api } from './client';
import type { PagedResult, PaginationParams, Project, ProjectModule, ProjectStatus } from '../types';

export interface CreateProjectInput {
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectInput {
  name: string;
  code?: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface AssignProjectModuleInput {
  masterModuleId: string;
  isEnabled?: boolean;
  version?: string;
  customNotes?: string;
}

export interface UpdateProjectModuleInput {
  isEnabled: boolean;
  version?: string;
  customNotes?: string;
}

export const projectsApi = {
  getProjects: (params?: PaginationParams & { organizationId?: string; status?: ProjectStatus }) =>
    api.get<PagedResult<Project>>('/projects', params),

  getProjectById: (id: string) =>
    api.get<Project>(`/projects/${id}`),

  getProjectsByOrganization: (organizationId: string) =>
    api.get<Project[]>(`/projects/by-organization/${organizationId}`),

  createProject: (data: CreateProjectInput) =>
    api.post<Project>('/projects', data),

  updateProject: (id: string, data: UpdateProjectInput) =>
    api.put<Project>(`/projects/${id}`, data),

  deleteProject: (id: string) =>
    api.delete<void>(`/projects/${id}`),

  // Project Modules
  getProjectModules: (projectId: string) =>
    api.get<ProjectModule[]>(`/projects/${projectId}/modules`),

  assignModule: (projectId: string, data: AssignProjectModuleInput) =>
    api.post<ProjectModule>(`/projects/${projectId}/modules`, data),

  updateProjectModule: (projectId: string, moduleId: string, data: UpdateProjectModuleInput) =>
    api.put<ProjectModule>(`/projects/${projectId}/modules/${moduleId}`, data),

  removeModule: (projectId: string, moduleId: string) =>
    api.delete<void>(`/projects/${projectId}/modules/${moduleId}`),
};

