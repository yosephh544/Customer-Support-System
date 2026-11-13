export type FeedbackPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type FeedbackStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export interface Feedback {
  id: string;
  scheduleItemId: string;
  rating: number; // 1 - 5
  priority: FeedbackPriority;
  priorityName: string;
  status: FeedbackStatus;
  statusName: string;
  remarks: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;

  // Metadata
  organizationId?: string;
  organizationName?: string;
  projectId?: string;
  projectName?: string;
  projectModuleId?: string;
  moduleName?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonJobTitle?: string;
  assignedUserId?: string;
  assignedUserFullName?: string;
  assignedUserEmail?: string;
  scheduledDate?: string;
}

export interface FeedbackFilterParams {
  organizationId?: string;
  projectId?: string;
  projectModuleId?: string;
  assignedUserId?: string;
  rating?: number;
  priority?: string;
  status?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface FeedbackAnalytics {
  averageRating: number;
  totalReviews: number;
  positivePercentage: number;
  ratingDistribution: Record<number, number>;
  priorityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  recentFeedbacks: Feedback[];
}

