export type TicketCategory =
  | 'SoftwareBug'
  | 'HardwareIssue'
  | 'NetworkInfrastructure'
  | 'TrainingRequest'
  | 'BillingInquiry'
  | 'SystemConfiguration';

export type FailureType =
  | 'CompleteOutage'
  | 'SevereDegradation'
  | 'IsolatedFailure'
  | 'MinorBug'
  | 'OperationalInquiry';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Blocker';

export type TicketStatus =
  | 'New'
  | 'Assigned'
  | 'InProgress'
  | 'PendingCustomer'
  | 'Resolved'
  | 'Closed';

export type SupportChannel =
  | 'WebPortal'
  | 'Phone'
  | 'Email'
  | 'ProactiveEscalation'
  | 'FieldVisit';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  isInternalNote: boolean;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;

  organizationId: string;
  organizationName: string;

  projectId: string;
  projectName: string;

  projectModuleId?: string;
  moduleName?: string;

  contactPersonId?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;

  title: string;
  description: string;

  category: TicketCategory;
  categoryName: string;

  failureType: FailureType;
  failureTypeName: string;

  priority: TicketPriority;
  priorityName: string;

  status: TicketStatus;
  statusName: string;

  channel: SupportChannel;
  channelName: string;

  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedToUserEmail?: string;

  slaDeadline: string;
  slaBreached: boolean;
  slaConsumedPercent: number;
  remainingWorkingHours: number;

  resolvedAt?: string;
  resolutionSummary?: string;

  isWarrantyCovered: boolean;
  outOfScopeQuoteETB?: number;
  outOfScopeQuoteApproved: boolean;

  escalatedFromFeedbackId?: string;

  createdAt: string;
  updatedAt?: string;

  messageCount: number;
  recentMessages?: TicketMessage[];
}

export interface CreateTicketRequest {
  organizationId: string;
  projectId: string;
  projectModuleId?: string;
  contactPersonId?: string;
  title: string;
  description: string;
  category?: TicketCategory;
  failureType?: FailureType;
  priority?: TicketPriority;
  channel?: SupportChannel;
  assignedToUserId?: string;
  escalatedFromFeedbackId?: string;
}

export interface UpdateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  failureType: FailureType;
  priority: TicketPriority;
  status: TicketStatus;
  assignedToUserId?: string;
  resolutionSummary?: string;
}

export interface TicketFilterParams {
  organizationId?: string;
  projectId?: string;
  projectModuleId?: string;
  assignedToUserId?: string;
  status?: string;
  priority?: string;
  category?: string;
  isWarrantyCovered?: boolean;
  slaBreachedOnly?: boolean;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  breachedTickets: number;
  criticalTickets: number;
  slaComplianceRate: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
}

export interface EscalateFeedbackRequest {
  overridePriority?: TicketPriority;
  additionalNotes?: string;
  assignedToUserId?: string;
}
