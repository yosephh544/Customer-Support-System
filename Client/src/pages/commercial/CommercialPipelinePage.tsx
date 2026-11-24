import React, { useState, useEffect } from 'react';
import { leadsApi, campaignsApi, publicApi } from '../../api/commercialApi';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Pagination } from '../../components/common/Pagination';
import { ConvertLeadModal } from '../../components/commercial/ConvertLeadModal';
import { CreateLeadModal } from '../../components/commercial/CreateLeadModal';
import { CreateCampaignModal } from '../../components/commercial/CreateCampaignModal';
import type {
  Campaign,
  Lead,
  LeadPipelineSummary,
  LeadSource,
  LeadStage,
} from '../../types';

export const CommercialPipelinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'campaigns' | 'gateway'>('pipeline');

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [pipelineSummary, setPipelineSummary] = useState<LeadPipelineSummary | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Public Gateway State
  const [publicName, setPublicName] = useState('');
  const [publicOrg, setPublicOrg] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [publicPhone, setPublicPhone] = useState('');
  const [publicRegion, setPublicRegion] = useState('Addis Ababa');
  const [publicModules, setPublicModules] = useState('');
  const [publicNotes, setPublicNotes] = useState('');
  const [isSubmittingPublic, setIsSubmittingPublic] = useState(false);
  const [publicSuccess, setPublicSuccess] = useState<string | null>(null);

  // Modals state
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<Lead | null>(null);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPipelineSummary();
    loadLeads();
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (activeTab === 'pipeline') {
      loadLeads();
    }
  }, [page, pageSize, searchTerm, selectedStage, selectedSource, activeTab]);

  const loadPipelineSummary = async () => {
    try {
      const data = await leadsApi.getPipelineSummary();
      setPipelineSummary(data);
    } catch {
      // Non-critical
    }
  };

  const loadLeads = async () => {
    setIsLoadingLeads(true);
    setError(null);
    try {
      const res = await leadsApi.getLeads({
        pageNumber: page,
        pageSize,
        searchTerm: searchTerm.trim() || undefined,
        stage: selectedStage || undefined,
        source: selectedSource || undefined,
      });
      setLeads(res.items || []);
      setTotalLeadsCount(res.totalCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commercial leads.');
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const loadCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const data = await campaignsApi.getCampaigns();
      setCampaigns(data || []);
    } catch {
      // Non-critical
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleStageChange = async (lead: Lead, newStage: LeadStage) => {
    try {
      await leadsApi.updateLead(lead.id, {
        fullName: lead.fullName,
        organizationName: lead.organizationName,
        email: lead.email,
        phoneNumber: lead.phoneNumber,
        region: lead.region,
        source: lead.source,
        stage: newStage,
        campaignId: lead.campaignId,
        estimatedValueETB: lead.estimatedValueETB,
        interestedModules: lead.interestedModules,
        notes: lead.notes,
        assignedSalesUserId: lead.assignedSalesUserId,
      });
      setToastMessage(`Opportunity stage advanced to ${newStage}.`);
      setTimeout(() => setToastMessage(null), 3000);
      loadLeads();
      loadPipelineSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to update opportunity stage.');
    }
  };

  const handleOpenConvert = (lead: Lead) => {
    setSelectedLeadForConvert(lead);
    setIsConvertOpen(true);
  };

  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicName.trim() || !publicOrg.trim() || !publicEmail.trim() || !publicPhone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsSubmittingPublic(true);
    setError(null);
    setPublicSuccess(null);
    try {
      await publicApi.submitLeadInquiry({
        fullName: publicName.trim(),
        organizationName: publicOrg.trim(),
        email: publicEmail.trim(),
        phoneNumber: publicPhone.trim(),
        region: publicRegion,
        interestedModules: publicModules.trim() || undefined,
        notes: publicNotes.trim() || undefined,
      });
      setPublicSuccess('Inquiry successfully ingested into Commercial Lead pipeline!');
      setPublicName('');
      setPublicOrg('');
      setPublicEmail('');
      setPublicPhone('');
      setPublicModules('');
      setPublicNotes('');
      loadLeads();
      loadPipelineSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to submit public inquiry.');
    } finally {
      setIsSubmittingPublic(false);
    }
  };

  const getStageBadge = (stage: LeadStage) => {
    switch (stage) {
      case 'Won':
        return <Badge variant="success" dot>Won / Converted</Badge>;
      case 'Lost':
        return <Badge variant="danger">Lost</Badge>;
      case 'Negotiation':
        return <Badge variant="purple" dot>Negotiation</Badge>;
      case 'ProposalSent':
        return <Badge variant="info">Proposal Sent</Badge>;
      case 'DemoScheduled':
        return <Badge variant="warning">Demo Scheduled</Badge>;
      case 'Contacted':
        return <Badge variant="neutral">Contacted</Badge>;
      case 'New':
      default:
        return <Badge variant="primary" dot>New Lead</Badge>;
    }
  };

  return (
    <div className="commercial-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-color, #111827)' }}>
            Commercial Acquisition & Marketing Suite
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            Marketing campaigns, ETB opportunity pipeline, and 1-Click Client Onboarding.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'pipeline' && (
            <Button variant="primary" size="md" onClick={() => setIsCreateLeadOpen(true)}>
              + Log Opportunity
            </Button>
          )}
          {activeTab === 'campaigns' && (
            <Button variant="primary" size="md" onClick={() => setIsCreateCampaignOpen(true)}>
              + Launch Campaign
            </Button>
          )}
        </div>
      </div>

      {toastMessage && <Alert variant="success" message={toastMessage} />}
      {error && <Alert variant="danger" message={error} />}

      {/* Primary Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          style={{
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            borderBottom: activeTab === 'pipeline' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'pipeline' ? '#2563eb' : '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Commercial Pipeline & Leads
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            borderBottom: activeTab === 'campaigns' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'campaigns' ? '#2563eb' : '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Marketing Campaigns & Channels
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gateway')}
          style={{
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            borderBottom: activeTab === 'gateway' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'gateway' ? '#2563eb' : '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Public Lead Capture Gateway
        </button>
      </div>

      {/* TAB 1: PIPELINE & LEADS */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Commercial KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Active Opportunities</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                {pipelineSummary?.totalLeads ?? '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Prospective client organizations</div>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase' }}>Pipeline Value</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                {pipelineSummary ? `${pipelineSummary.totalPipelineValueETB.toLocaleString()} ETB` : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Total unclosed deal pipeline</div>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>Won Revenue</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {pipelineSummary ? `${pipelineSummary.wonRevenueETB.toLocaleString()} ETB` : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Converted customer contracts</div>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase' }}>Conversion Win Rate</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#8b5cf6', marginTop: '4px' }}>
                {pipelineSummary ? `${pipelineSummary.winRatePercentage}%` : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Deals won vs closed</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Search opportunity, company, email, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{ minWidth: '240px', flex: 1, fontSize: '0.85rem' }}
            />

            <select
              className="form-input"
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setPage(1);
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">All Pipeline Stages</option>
              <option value="New">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="DemoScheduled">Demo Scheduled</option>
              <option value="ProposalSent">Proposal Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>

            <select
              className="form-input"
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setPage(1);
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">All Acquisition Sources</option>
              <option value="Website">Website Form</option>
              <option value="Campaign">Marketing Campaign</option>
              <option value="DirectReferral">Direct Referral</option>
              <option value="FieldSales">Field Sales</option>
              <option value="InboundInquiry">Inbound Inquiry</option>
            </select>
          </div>

          {/* Leads Data Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {isLoadingLeads ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner spinner-lg" />
                <p className="text-muted text-sm mt-3">Loading commercial opportunities...</p>
              </div>
            ) : leads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💼</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#374151' }}>No commercial opportunities found</div>
                <p style={{ fontSize: '0.85rem', margin: '4px 0 16px 0' }}>Log a new deal or adjust your filter query.</p>
                <Button variant="primary" size="sm" onClick={() => setIsCreateLeadOpen(true)}>
                  + Log Opportunity
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>PROSPECT & CONTACT</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>SOURCE / CAMPAIGN</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>ESTIMATED VALUE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>STAGE & STATUS</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>INTERESTED SCOPE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>
                            {l.organizationName}
                          </div>
                          <div style={{ color: '#4b5563', marginTop: '2px' }}>
                            {l.fullName} · {l.phoneNumber}
                          </div>
                          <div className="text-xs text-muted">{l.email} · {l.region}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant="navy" size="sm">{l.sourceName}</Badge>
                          {l.campaignTitle && (
                            <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                              Campaign: {l.campaignTitle}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>
                            {l.estimatedValueETB > 0 ? `${l.estimatedValueETB.toLocaleString()} ETB` : 'Quote Pending'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {getStageBadge(l.stage)}
                          {l.convertedOrganizationId && (
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                              ✓ Active Customer Account
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                            {l.interestedModules || 'General Enterprise Inquiry'}
                          </div>
                          {l.notes && (
                            <div className="text-xs text-muted" style={{ fontStyle: 'italic', marginTop: '2px' }}>
                              "{l.notes.substring(0, 40)}..."
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                            {/* Stage progression quick dropdown */}
                            {!l.convertedOrganizationId && l.stage !== 'Won' && l.stage !== 'Lost' && (
                              <select
                                className="form-input"
                                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                value={l.stage}
                                onChange={(e) => handleStageChange(l, e.target.value as LeadStage)}
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="DemoScheduled">Demo</option>
                                <option value="ProposalSent">Proposal</option>
                                <option value="Negotiation">Negotiate</option>
                                <option value="Won">Mark Won</option>
                                <option value="Lost">Mark Lost</option>
                              </select>
                            )}

                            {/* 1-Click Conversion Bridge */}
                            {!l.convertedOrganizationId ? (
                              <Button
                                variant={l.stage === 'Won' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleOpenConvert(l)}
                              >
                                ⚡ Convert to Client
                              </Button>
                            ) : (
                              <Badge variant="success" size="sm">✓ Converted</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalLeadsCount > pageSize && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                <Pagination
                  currentPage={page}
                  totalCount={totalLeadsCount}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MARKETING CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Active Campaigns</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
                {campaigns.length}
              </div>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase' }}>Total Budget Allocated</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                {campaigns.reduce((acc, c) => acc + c.budgetETB, 0).toLocaleString()} ETB
              </div>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>Won Revenue Attributed</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {campaigns.reduce((acc, c) => acc + c.wonRevenueETB, 0).toLocaleString()} ETB
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {isLoadingCampaigns ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📢</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#374151' }}>No marketing campaigns active</div>
                <p style={{ fontSize: '0.85rem', margin: '4px 0 16px 0' }}>Create your first targeted Ethiopian marketing campaign.</p>
                <Button variant="primary" size="sm" onClick={() => setIsCreateCampaignOpen(true)}>
                  + Launch Campaign
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>CAMPAIGN TITLE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>CHANNEL & REGION</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>TIMELINE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>BUDGET / SPEND</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>LEADS ATTRIBUTED</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>WON REVENUE (ETB)</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{c.title}</div>
                          {c.description && <div className="text-xs text-muted">{c.description}</div>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant="navy" size="sm">{c.typeName}</Badge>
                          <div className="text-xs text-muted" style={{ marginTop: '2px' }}>{c.targetRegion}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.75rem' }}>
                            {new Date(c.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                            {new Date(c.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600 }}>{c.budgetETB.toLocaleString()} ETB</div>
                          <div className="text-xs text-muted">Spend: {c.actualSpendETB.toLocaleString()} ETB</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>{c.leadCount} leads</span>
                          <div className="text-xs text-muted">{c.wonLeadCount} won deals</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: '#059669' }}>{c.wonRevenueETB.toLocaleString()} ETB</span>
                          {c.roiPercentage > 0 && (
                            <div className="text-xs text-success" style={{ fontWeight: 600 }}>
                              +{c.roiPercentage}% ROI
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={c.status === 'Active' ? 'success' : 'neutral'} dot={c.status === 'Active'}>
                            {c.statusName}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PUBLIC GATEWAY HARNESS */}
      {activeTab === 'gateway' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
              Public Web Form Simulator (Unauthenticated /api/public/leads)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '16px' }}>
              This form tests the public gateway endpoint used on the public website and landing pages for quote and demo bookings.
            </p>

            {publicSuccess && <Alert variant="success" message={publicSuccess} />}

            <form onSubmit={handlePublicSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label text-xs">Full Name *</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    placeholder="e.g. Almaz Tesfaye"
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Organization Name *</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    placeholder="e.g. Nile Logistics PLC"
                    value={publicOrg}
                    onChange={(e) => setPublicOrg(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label text-xs">Business Email *</label>
                  <input
                    type="email"
                    className="form-input w-full"
                    placeholder="e.g. info@nilelogistics.et"
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input w-full"
                    placeholder="e.g. +251 92 345 6789"
                    value={publicPhone}
                    onChange={(e) => setPublicPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs">Region</label>
                <select
                  className="form-input w-full"
                  value={publicRegion}
                  onChange={(e) => setPublicRegion(e.target.value)}
                >
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Oromia">Oromia</option>
                  <option value="Amhara">Amhara</option>
                  <option value="Sidama">Sidama</option>
                  <option value="Dire Dawa">Dire Dawa</option>
                </select>
              </div>

              <div>
                <label className="form-label text-xs">Modules of Interest</label>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="e.g. Fleet Management, Billing, Support Desk"
                  value={publicModules}
                  onChange={(e) => setPublicModules(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label text-xs">Project Goals / Timeline</label>
                <textarea
                  className="form-input w-full"
                  rows={3}
                  placeholder="Describe your organization's timeline and goals..."
                  value={publicNotes}
                  onChange={(e) => setPublicNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingPublic}>
                  Submit Inbound Inquiry
                </Button>
              </div>
            </form>
          </div>

          <div
            style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              fontSize: '0.82rem',
              lineHeight: '1.6',
            }}
          >
            <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Security & Tenant Safety Architecture</h4>
            <ul style={{ paddingLeft: '18px', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Public Endpoint Isolation:</strong> <code>/api/public/leads</code> does not expose internal system IDs, tenant metadata, or staff directories.
              </li>
              <li>
                <strong>Automatic Pipeline Routing:</strong> Inbound submissions are tagged with <code>Source: Website</code> and <code>Stage: New</code>, notifying the leadership queue.
              </li>
              <li>
                <strong>Zero-Duplicate Onboarding:</strong> Upon closing the deal, 1-Click conversion immediately creates the corresponding <code>Organization</code>, <code>ContactPerson</code>, and <code>Project</code> with an active 12-Month Support Window.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConvertLeadModal
        lead={selectedLeadForConvert}
        isOpen={isConvertOpen}
        onClose={() => {
          setIsConvertOpen(false);
          setSelectedLeadForConvert(null);
        }}
        onLeadConverted={() => {
          setToastMessage('Opportunity successfully converted to Active Client Account!');
          setTimeout(() => setToastMessage(null), 4000);
          loadLeads();
          loadPipelineSummary();
        }}
      />

      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onLeadCreated={() => {
          setToastMessage('New commercial opportunity registered in pipeline.');
          setTimeout(() => setToastMessage(null), 4000);
          loadLeads();
          loadPipelineSummary();
        }}
      />

      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        onCampaignCreated={() => {
          setToastMessage('New marketing campaign launched.');
          setTimeout(() => setToastMessage(null), 4000);
          loadCampaigns();
        }}
      />
    </div>
  );
};
