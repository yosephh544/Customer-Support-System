import { api } from './client';
import type {
  CreatePortalServiceRequest,
  CreatePortalTicketRequest,
  PagedResult,
  PortalDashboardDto,
  PortalServiceRequest,
  ReviewPortalServiceRequest,
  Ticket,
  TicketFilterParams,
  TicketMessage,
} from '../types';

export const portalApi = {
  getDashboard: (organizationId?: string) =>
    api.get<PortalDashboardDto>('/clientportal/dashboard', organizationId ? { organizationId } : undefined),

  getTickets: (params?: TicketFilterParams) =>
    api.get<PagedResult<Ticket>>('/clientportal/tickets', params),

  getTicketById: (id: string, organizationId?: string) =>
    api.get<Ticket>(`/clientportal/tickets/${id}`, organizationId ? { organizationId } : undefined),

  submitTicket: (data: CreatePortalTicketRequest, organizationId?: string) =>
    api.post<Ticket>(
      `/clientportal/tickets${organizationId ? `?organizationId=${organizationId}` : ''}`,
      data
    ),

  addTicketMessage: (ticketId: string, message: string, organizationId?: string) =>
    api.post<TicketMessage>(
      `/clientportal/tickets/${ticketId}/messages${organizationId ? `?organizationId=${organizationId}` : ''}`,
      { message }
    ),

  getServiceRequests: (organizationId?: string) =>
    api.get<PortalServiceRequest[]>(
      '/clientportal/requests',
      organizationId ? { organizationId } : undefined
    ),

  submitServiceRequest: (data: CreatePortalServiceRequest, organizationId?: string) =>
    api.post<PortalServiceRequest>(
      `/clientportal/requests${organizationId ? `?organizationId=${organizationId}` : ''}`,
      data
    ),

  reviewServiceRequest: (id: string, data: ReviewPortalServiceRequest) =>
    api.put<PortalServiceRequest>(`/clientportal/requests/${id}/review`, data),
};
