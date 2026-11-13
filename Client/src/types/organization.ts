export interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  projectCount: number;
  createdAt: string;
  updatedAt?: string;
  projects?: Project[];
}

export type ProjectStatus = 1 | 2 | 3 | 4 | 5 | 'Active' | 'Maintenance' | 'OnHold' | 'Completed' | 'Archived' | string;

export function isActiveProject(status: any): boolean {
  if (status === 1 || status === '1') return true;
  if (typeof status === 'string' && status.toLowerCase() === 'active') return true;
  return false;
}

export function isMaintenanceProject(status: any): boolean {
  if (status === 2 || status === '2') return true;
  if (typeof status === 'string' && status.toLowerCase() === 'maintenance') return true;
  return false;
}

export function isCompletedProject(status: any): boolean {
  if (status === 4 || status === '4' || status === 3 || status === '3') return true;
  if (typeof status === 'string' && (status.toLowerCase() === 'completed' || status.toLowerCase() === 'onhold')) return true;
  return false;
}

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
  contactPersonName?: string;
  contactPersonPhone?: string;
  secondaryContactPersonName?: string;
  secondaryContactPersonPhone?: string;
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
  contactPersonName?: string;
  contactPersonPhone?: string;
  secondaryContactPersonName?: string;
  secondaryContactPersonPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

// Deprecated alias for backward compatibility
export type MasterModule = ProjectModule;

