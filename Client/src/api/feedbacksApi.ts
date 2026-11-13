import { api } from './client';
import type { Feedback, FeedbackAnalytics, FeedbackFilterParams, PagedResult } from '../types';

export const feedbacksApi = {
  getFeedbacks: (params?: FeedbackFilterParams) =>
    api.get<PagedResult<Feedback>>('/feedbacks', params),

  getAnalytics: () =>
    api.get<FeedbackAnalytics>('/feedbacks/analytics'),

  getFeedbackById: (id: string) =>
    api.get<Feedback>(`/feedbacks/${id}`),

  getFeedbackByScheduleItemId: (scheduleItemId: string) =>
    api.get<Feedback>(`/feedbacks/by-schedule-item/${scheduleItemId}`),
};

