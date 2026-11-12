export interface SupportAssignment {
  id: string;
  userId: string;
  userName: string;
  userFullName: string;
  userEmail: string;
  userPhoneNumber?: string;
  projectId: string;
  projectName: string;
  projectModuleId?: string;
  moduleName?: string;
  isActive: boolean;
  assignedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAssignmentRequest {
  userId: string;
  projectId: string;
  projectModuleId?: string;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateAssignmentRequest {
  projectModuleId?: string;
  isActive: boolean;
  notes?: string;
}

