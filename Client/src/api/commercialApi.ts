import { api } from './client';
import type {
  Campaign,
  ConvertLeadRequest,
  ConvertLeadResult,
  CreateCampaignRequest,
  CreateLeadRequest,
  Lead,
  LeadFilterParams,
  LeadPipelineSummary,
  PagedResult,
  PublicLeadSubmissionRequest,
  UpdateCampaignRequest,
  UpdateLeadRequest,
} from '../types';

export const campaignsApi = {
  getCampaigns: () =>
    api.get<Campaign[]>('/campaigns'),

  getCampaignById: (id: string) =>
    api.get<Campaign>(`/campaigns/${id}`),

  createCampaign: (data: CreateCampaignRequest) =>
    api.post<Campaign>('/campaigns', data),

  updateCampaign: (id: string, data: UpdateCampaignRequest) =>
    api.put<Campaign>(`/campaigns/${id}`, data),

  deleteCampaign: (id: string) =>
    api.delete<void>(`/campaigns/${id}`),
};

export const leadsApi = {
  getLeads: (params?: LeadFilterParams) =>
    api.get<PagedResult<Lead>>('/leads', params),

  getPipelineSummary: () =>
    api.get<LeadPipelineSummary>('/leads/pipeline-summary'),

  getLeadById: (id: string) =>
    api.get<Lead>(`/leads/${id}`),

  createLead: (data: CreateLeadRequest) =>
    api.post<Lead>('/leads', data),

  updateLead: (id: string, data: UpdateLeadRequest) =>
    api.put<Lead>(`/leads/${id}`, data),

  convertToClient: (id: string, data?: ConvertLeadRequest) =>
    api.post<ConvertLeadResult>(`/leads/${id}/convert-to-client`, data || {}),
};

export const publicApi = {
  submitLeadInquiry: (data: PublicLeadSubmissionRequest) =>
    api.post<Lead>('/public/leads', data),
};
