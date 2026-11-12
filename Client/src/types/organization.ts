export interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  email?: string;
  phone?: string;
  address?: string;
  projectCount: number;
  createdAt: string;
  updatedAt?: string;
  projects?: Project[];
}

export type ProjectStatus = 1 | 2 | 3 | 4 | 5; // Active = 1, Maintenance = 2, OnHold = 3, Completed = 4, Archived = 5

export interface Project {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  statusName: string;
  startDate?: string;
  endDate?: string;
  moduleCount: number;
  createdAt: string;
  updatedAt?: string;
  modules?: ProjectModule[];
}

export interface ProjectModule {
  id: string;
  projectId: string;
  projectName?: string;
  name?: string;
  moduleName?: string;
  isEnabled: boolean;
  version?: string;
  description?: string;
  customNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Deprecated alias for backward compatibility
export type MasterModule = ProjectModule;

