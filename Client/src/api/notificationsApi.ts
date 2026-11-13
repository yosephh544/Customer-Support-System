import { api } from './client';
import type { NotificationListResult } from '../types';

export const notificationsApi = {
  getMyNotifications: (params?: { unreadOnly?: boolean; limit?: number }) =>
    api.get<NotificationListResult>('/notifications', params),

  getUnreadCount: () =>
    api.get<number>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.put<{ success: boolean; id: string }>(`/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    api.put<{ success: boolean; updatedCount: number }>('/notifications/read-all', {}),

  deleteNotification: (id: string) =>
    api.delete<{ success: boolean }>(`/notifications/${id}`),
};

