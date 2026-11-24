export type CampaignType =
  | 'EmailBlast'
  | 'TradeEvent'
  | 'DirectFieldVisit'
  | 'Digital'
  | 'Referral';

export type CampaignStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export type LeadSource =
  | 'Website'
  | 'Campaign'
  | 'DirectReferral'
  | 'FieldSales'
  | 'InboundInquiry';

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'DemoScheduled'
  | 'ProposalSent'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export interface Campaign {
  id: string;
  title: string;
  type: CampaignType;
  typeName: string;
  budgetETB: number;
  actualSpendETB: number;
  targetRegion: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  statusName: string;
  description?: string;
  leadCount: number;
  wonLeadCount: number;
  wonRevenueETB: number;
  roiPercentage: number;
  createdAt: string;
}

export interface CreateCampaignRequest {
  title: string;
  type: CampaignType;
  budgetETB: number;
  targetRegion: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface UpdateCampaignRequest {
  title: string;
  type: CampaignType;
  budgetETB: number;
  actualSpendETB: number;
  targetRegion: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  description?: string;
}

export interface Lead {
  id: string;
  fullName: string;
  organizationName: string;
  email: string;
  phoneNumber: string;
  region: string;
  source: LeadSource;
  sourceName: string;
  stage: LeadStage;
  stageName: string;
  campaignId?: string;
  campaignTitle?: string;
  estimatedValueETB: number;
  interestedModules?: string;
  notes?: string;
  lostReason?: string;
  assignedSalesUserId?: string;
  assignedSalesUserName?: string;
  convertedOrganizationId?: string;
  convertedDate?: string;
  createdAt: string;
}

export interface CreateLeadRequest {
  fullName: string;
  organizationName: string;
  email: string;
  phoneNumber: string;
  region?: string;
  source?: LeadSource;
  campaignId?: string;
  estimatedValueETB?: number;
  interestedModules?: string;
  notes?: string;
  assignedSalesUserId?: string;
}

export interface UpdateLeadRequest {
  fullName: string;
  organizationName: string;
  email: string;
  phoneNumber: string;
  region?: string;
  source: LeadSource;
  stage: LeadStage;
  campaignId?: string;
  estimatedValueETB: number;
  interestedModules?: string;
  notes?: string;
  lostReason?: string;
  assignedSalesUserId?: string;
}

export interface LeadFilterParams {
  stage?: string;
  source?: string;
  campaignId?: string;
  region?: string;
  assignedSalesUserId?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface LeadPipelineSummary {
  totalLeads: number;
  totalPipelineValueETB: number;
  wonRevenueETB: number;
  winRatePercentage: number;
  stageCounts: Record<string, number>;
  stageValuesETB: Record<string, number>;
  sourceDistribution: Record<string, number>;
}

export interface ConvertLeadRequest {
  supportWindowMonths?: number;
  primarySupportSpecialistUserId?: string;
}

export interface ConvertLeadResult {
  organizationId: string;
  organizationName: string;
  projectId: string;
  projectName: string;
  contactPersonId: string;
  contactPersonName: string;
  modulesProvisionedCount: number;
  message: string;
}

export interface PublicLeadSubmissionRequest {
  fullName: string;
  organizationName: string;
  email: string;
  phoneNumber: string;
  region?: string;
  interestedModules?: string;
  notes?: string;
  campaignId?: string;
}
