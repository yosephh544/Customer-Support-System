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
  contactPersonName?: string;
  contactPersonPhone?: string;
  organizationName?: string;
  projectName?: string;
  moduleName?: string;
  assignedUserFullName?: string;
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

