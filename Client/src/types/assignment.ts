export interface SupportAssignment {
  id: string;
  userId: string;
  userName: string;
  userFullName: string;
  userEmail: string;
  userPhoneNumber?: string;
  projectId: string;
  projectName: string;
  organizationName?: string;
  projectModuleId?: string;
  moduleName?: string;
  isActive: boolean;
  assignedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;

  // Frontend convenience properties
  agentName?: string;
  agentEmail?: string;
  assignedByName?: string;
}

export interface CreateAssignmentRequest {
  userId: string;
  supportAgentId?: string;
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

