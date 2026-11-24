import { api } from './client';
import type {
  CreateTicketRequest,
  EscalateFeedbackRequest,
  PagedResult,
  Ticket,
  TicketAnalytics,
  TicketFilterParams,
  TicketMessage,
  UpdateTicketRequest,
} from '../types';

export const ticketsApi = {
  getTickets: (params?: TicketFilterParams) =>
    api.get<PagedResult<Ticket>>('/tickets', params),

  getAnalytics: () =>
    api.get<TicketAnalytics>('/tickets/analytics'),

  getTicketById: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`),

  createTicket: (data: CreateTicketRequest) =>
    api.post<Ticket>('/tickets', data),

  updateTicket: (id: string, data: UpdateTicketRequest) =>
    api.put<Ticket>(`/tickets/${id}`, data),

  assignTicket: (id: string, assignedToUserId: string) =>
    api.post<Ticket>(`/tickets/${id}/assign`, { assignedToUserId }),

  resolveTicket: (id: string, resolutionSummary: string) =>
    api.post<Ticket>(`/tickets/${id}/resolve`, { resolutionSummary }),

  escalateFromFeedback: (feedbackId: string, data?: EscalateFeedbackRequest) =>
    api.post<Ticket>(`/tickets/escalate-from-feedback/${feedbackId}`, data || {}),

  getMessages: (ticketId: string, includeInternalNotes: boolean = true) =>
    api.get<TicketMessage[]>(`/tickets/${ticketId}/messages`, { includeInternalNotes }),

  addMessage: (ticketId: string, message: string, isInternalNote: boolean = false, attachmentUrl?: string) =>
    api.post<TicketMessage>(`/tickets/${ticketId}/messages`, {
      message,
      isInternalNote,
      attachmentUrl,
    }),
};
