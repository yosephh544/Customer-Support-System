import { Ticket, TicketCategory, TicketPriority, FailureType } from './ticket';

export enum PortalRequestType {
  AddonModule = 1,
  SlaExpansion = 2,
  TrainingAssistance = 3,
  CustomFeature = 4,
}

export const PortalRequestTypeLabels: Record<PortalRequestType, string> = {
  [PortalRequestType.AddonModule]: 'Add-on Software Module',
  [PortalRequestType.SlaExpansion]: 'SLA / Warranty Extension',
  [PortalRequestType.TrainingAssistance]: 'User Training & Onboarding',
  [PortalRequestType.CustomFeature]: 'Custom Feature / Enhancement',
};

export enum PortalRequestStatus {
  Submitted = 1,
  InReview = 2,
  ApprovedCommercialLead = 3,
  Rejected = 4,
  Completed = 5,
}

export const PortalRequestStatusLabels: Record<PortalRequestStatus, string> = {
  [PortalRequestStatus.Submitted]: 'Submitted',
  [PortalRequestStatus.InReview]: 'In Commercial Review',
  [PortalRequestStatus.ApprovedCommercialLead]: 'Opportunity Generated',
  [PortalRequestStatus.Rejected]: 'Declined',
  [PortalRequestStatus.Completed]: 'Fulfilled',
};

export interface PortalProjectSummary {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  supportWindowMonths: number;
  warrantyExpiryDate: string;
  isWarrantyActive: boolean;
  daysRemainingInWarranty: number;
  moduleNames: string[];
}

export interface PortalDashboardDto {
  organizationId: string;
  organizationName: string;
  email?: string;
  phone?: string;
  address?: string;
  activeTicketsCount: number;
  pendingRequestsCount: number;
  breachedTicketsCount: number;
  activeProjects: PortalProjectSummary[];
  recentTickets: Ticket[];
}

export interface CreatePortalTicketRequest {
  projectId: string;
  projectModuleId?: string;
  title: string;
  description: string;
  category: TicketCategory;
  failureType: FailureType;
  priority: TicketPriority;
}

export interface PortalServiceRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  projectId: string;
  projectName: string;
  requestType: PortalRequestType;
  requestTypeName: string;
  title: string;
  description: string;
  status: PortalRequestStatus;
  statusName: string;
  submittedByUserId: string;
  submittedByUserName: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface CreatePortalServiceRequest {
  projectId: string;
  requestType: PortalRequestType;
  title: string;
  description: string;
}

export interface ReviewPortalServiceRequest {
  status: PortalRequestStatus;
  reviewNotes?: string;
}
