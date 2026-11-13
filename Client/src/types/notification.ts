export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string; // ScheduleAssignment, ScheduleUpdate, NewOrganization, TaskIncomplete, ProjectAssignment, CriticalFeedback
  isRead: boolean;
  relatedEntityId?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResult {
  items: AppNotification[];
  totalCount: number;
  unreadCount: number;
}

