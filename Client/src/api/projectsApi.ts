import { api } from './client';
import type { PagedResult, PaginationParams, Project, ProjectModule, ProjectStatus } from '../types';

export interface CreateProjectModuleItemInput {
  name: string;
  version?: string;
  description?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  secondaryContactPersonName?: string;
  secondaryContactPersonPhone?: string;
}

export interface CreateProjectInput {
  organizationId: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  secondaryContactPersonName?: string;
  secondaryContactPersonPhone?: string;
  modules?: CreateProjectModuleItemInput[];
}

export interface UpdateProjectInput {
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  secondaryContactPersonName?: string;
  secondaryContactPersonPhone?: string;
}

export interface CreateProjectModuleInput {
  name: string;
  version?: string;
  description?: string;
  isEnabled?: boolean;
  contactPersonName?: string;
  contactPersonPhone?: string;
  secondaryContactPersonName?: string;
  secondaryContactPersonPhone?: string;
}

export interface UpdateProjectModuleInput {
  name: string;
  version?: string;
  description?: string;
  isEnabled: boolean;
  contactPersonName?: string;
  contactPersonPhone?: string;
  secondaryContactPersonName?: string;
  secondaryContactPersonPhone?: string;
}

export type AssignProjectModuleInput = CreateProjectModuleInput;

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

  createProjectModule: (projectId: string, data: CreateProjectModuleInput) =>
    api.post<ProjectModule>(`/projects/${projectId}/modules`, data),

  assignModule: (projectId: string, data: any) =>
    api.post<ProjectModule>(`/projects/${projectId}/modules`, data),

  updateProjectModule: (projectId: string, moduleId: string, data: UpdateProjectModuleInput) =>
    api.put<ProjectModule>(`/projects/${projectId}/modules/${moduleId}`, data),

  removeModule: (projectId: string, moduleId: string) =>
    api.delete<void>(`/projects/${projectId}/modules/${moduleId}`),
};

