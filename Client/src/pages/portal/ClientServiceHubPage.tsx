import React, { useState, useEffect } from 'react';
import { portalApi } from '../../api/portalApi';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import {
  PortalRequestType,
  PortalRequestTypeLabels,
  PortalRequestStatusLabels,
} from '../../types';
import type {
  PortalProjectSummary,
  PortalServiceRequest,
} from '../../types';

export const ClientServiceHubPage: React.FC = () => {
  const [requests, setRequests] = useState<PortalServiceRequest[]>([]);
  const [projects, setProjects] = useState<PortalProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PortalRequestType>(PortalRequestType.AddonModule);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [dash, reqList] = await Promise.all([
        portalApi.getDashboard(),
        portalApi.getServiceRequests(),
      ]);
      setProjects(dash.activeProjects || []);
      if (dash.activeProjects?.length > 0 && !selectedProjectId) {
        setSelectedProjectId(dash.activeProjects[0].id);
      }
      setRequests(reqList || []);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to load service hub data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSubmit = (type: PortalRequestType) => {
    setSelectedType(type);
    setRequestTitle('');
    setRequestDescription('');
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setSubmitError('Please select a project to proceed.');
      return;
    }
    if (!requestTitle.trim()) {
      setSubmitError('Please enter a title for your request.');
      return;
    }
    if (!requestDescription.trim()) {
      setSubmitError('Please describe the business requirement or details.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await portalApi.submitServiceRequest({
        projectId: selectedProjectId,
        requestType: selectedType,
        title: requestTitle.trim(),
        description: requestDescription.trim(),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to submit service request.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: number) => {
    switch (status) {
      case 3: // ApprovedCommercialLead
        return 'success';
      case 2: // InReview
        return 'warning';
      case 4: // Rejected
        return 'danger';
      case 5: // Completed
        return 'info';
      default:
        return 'neutral';
    }
  };

  const serviceCatalog = [
    {
      type: PortalRequestType.AddonModule,
      icon: '🧩',
      title: 'Add-on Software Modules',
      description: 'Expand your ERP capabilities with Inventory, Fixed Assets, Payroll & HR, or Advanced Analytics.',
      buttonText: 'Request Module Addition',
    },
    {
      type: PortalRequestType.SlaExpansion,
      icon: '🛡️',
      title: 'Warranty & SLA Extension',
      description: 'Renew annual support coverage, extend guaranteed response times, and retain dedicated priority engineers.',
      buttonText: 'Extend SLA Coverage',
    },
    {
      type: PortalRequestType.TrainingAssistance,
      icon: '🎓',
      title: 'Staff Training & Onboarding',
      description: 'Schedule refresher training for new employees or specialized masterclasses on newly released features.',
      buttonText: 'Book Training Session',
    },
    {
      type: PortalRequestType.CustomFeature,
      icon: '⚙️',
      title: 'Custom Feature / Integration',
      description: 'Commission bespoke workflow automations, third-party ERP integrations, or regulatory report formats.',
      buttonText: 'Propose Custom Feature',
    },
  ];

  return (
    <div className="client-service-hub" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
          Agreements & Service Expansion Hub
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
          Explore add-on modules, extend SLA warranty agreements, or request tailored engineering developments directly from DAFTECH.
        </p>
      </div>

      {/* Catalog Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {serviceCatalog.map((item) => (
          <div
            key={item.type}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {item.description}
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenSubmit(item.type)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {item.buttonText} →
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* History of Service Requests */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📋</span> Submitted Expansion Proposals & Requests
        </h2>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', margin: 0 }}>
              No service requests submitted yet. Select an option from the catalog above to submit a proposal.
            </p>
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Request Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Target System</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date Submitted</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Commercial Notes</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                      {req.requestTypeName || PortalRequestTypeLabels[req.requestType]}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#1e293b', fontWeight: 500 }}>
                      <div>{req.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {req.description}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>
                      {req.projectName}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <Badge variant={getStatusBadgeVariant(req.status)}>
                        {req.statusName || PortalRequestStatusLabels[req.status]}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#047857', fontSize: '0.8rem' }}>
                      {req.reviewNotes || 'Under standard commercial review'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Request: ${PortalRequestTypeLabels[selectedType]}`}
        description="Our commercial operations team will evaluate your proposal and reach out within 1 business day."
        size="md"
      >
        <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {submitError && <Alert variant="error" message={submitError} onClose={() => setSubmitError(null)} />}

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Target System / Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isSubmitting || projects.length === 0}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Summary / Specific Module *
            </label>
            <input
              type="text"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              placeholder="e.g. Add Fixed Assets Management module for 15 users"
              disabled={isSubmitting}
              required
              maxLength={150}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Details & Business Scope *
            </label>
            <textarea
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              placeholder="Provide background, estimated timelines, or specific department requirements..."
              rows={4}
              disabled={isSubmitting}
              required
              maxLength={2000}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Expansion Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
