import { api } from './client';
import type {
  CreateFeedbackRequest,
  Feedback,
  FeedbackAnalytics,
  FeedbackFilterParams,
  PagedResult,
  UpdateFeedbackRequest,
} from '../types';

export const feedbacksApi = {
  getFeedbacks: (params?: FeedbackFilterParams) =>
    api.get<PagedResult<Feedback>>('/feedbacks', params),

  getAnalytics: () =>
    api.get<FeedbackAnalytics>('/feedbacks/analytics'),

  getFeedbackById: (id: string) =>
    api.get<Feedback>(`/feedbacks/${id}`),

  getFeedbackByScheduleItemId: (scheduleItemId: string) =>
    api.get<Feedback>(`/feedbacks/by-schedule-item/${scheduleItemId}`),

  createFeedback: (data: CreateFeedbackRequest) =>
    api.post<Feedback>('/feedbacks', data),

  updateFeedback: (id: string, data: UpdateFeedbackRequest) =>
    api.put<Feedback>(`/feedbacks/${id}`, data),
};

