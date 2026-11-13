import { api } from './client';
import type { Feedback, FeedbackAnalytics, PagedResult, PaginationParams } from '../types';

export const feedbacksApi = {
  getFeedbacks: (params?: PaginationParams & { rating?: number; priority?: string; status?: string }) =>
    api.get<PagedResult<Feedback>>('/feedbacks', params),

  getAnalytics: () =>
    api.get<FeedbackAnalytics>('/feedbacks/analytics'),

  getFeedbackById: (id: string) =>
    api.get<Feedback>(`/feedbacks/${id}`),

  getFeedbackByScheduleItemId: (scheduleItemId: string) =>
    api.get<Feedback>(`/feedbacks/by-schedule-item/${scheduleItemId}`),
};

