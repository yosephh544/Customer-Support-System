import React, { useState, useEffect } from 'react';
import { portalApi } from '../../api/portalApi';
import { GuidedTicketWizardModal } from '../../components/portal/GuidedTicketWizardModal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import type { PortalDashboardDto, Ticket } from '../../types';

interface ClientPortalDashboardProps {
  onNavigateToTickets?: () => void;
  onNavigateToServices?: () => void;
  onSelectTicket?: (ticket: Ticket) => void;
}

export const ClientPortalDashboard: React.FC<ClientPortalDashboardProps> = ({
  onNavigateToTickets,
  onNavigateToServices,
  onSelectTicket,
}) => {
  const [dashboard, setDashboard] = useState<PortalDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await portalApi.getDashboard();
      setDashboard(data);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to load customer portal dashboard.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'success';
      case 'InProgress':
      case 'PendingClient':
        return 'warning';
      case 'Breached':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'Blocker':
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>Loading your DAFTECH Client Support Portal...</p>
      </div>
    );
  }

  return (
    <div className="client-portal-dashboard" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      {/* Hero Welcome Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <span>🏢</span>
            <span>Customer Organization: <strong>{dashboard?.organizationName || 'Client Portal'}</strong></span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
            Welcome to DAFTECH Client Support Hub
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', maxWidth: '650px' }}>
            Track engineering tickets in real-time, view your software warranty SLA compliance, and request new module additions or refresher trainings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => setIsTicketModalOpen(true)}
            style={{
              backgroundColor: '#2563eb',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            }}
          >
            ⚡ Submit Support Ticket
          </Button>
          {onNavigateToServices && (
            <Button
              variant="outline"
              onClick={onNavigateToServices}
              style={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                padding: '0.75rem 1.25rem',
                fontWeight: 600,
              }}
            >
              ✨ Request Expansion
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Active Tickets
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>
            {dashboard?.activeTicketsCount || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Currently under engineering resolution
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            SLA At Risk / Breached
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: (dashboard?.breachedTicketsCount || 0) > 0 ? '#ef4444' : '#10b981' }}>
            {dashboard?.breachedTicketsCount || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Tickets exceeding standard resolution hours
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Active Software Systems
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>
            {dashboard?.activeProjects.length || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Deployed projects in production
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Pending Service Requests
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6366f1' }}>
            {dashboard?.pendingRequestsCount || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Add-on modules & trainings in review
          </div>
        </div>
      </div>

      {/* Systems & Warranty Protection Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🛡️</span> Your Supported Systems & Warranty Windows
        </h2>

        {dashboard?.activeProjects.length === 0 ? (
          <div style={{ background: '#f8fafc', padding: '2rem', textAlign: 'center', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', margin: 0 }}>No active software projects registered under this organization.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
            {dashboard?.activeProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${project.isWarrantyActive ? '#cbd5e1' : '#fecaca'}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {project.name}
                    </h3>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: project.isWarrantyActive ? '#dcfce7' : '#fee2e2',
                        color: project.isWarrantyActive ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {project.isWarrantyActive ? '✅ Active Warranty' : '⚠️ Expired'}
                    </span>
                  </div>

                  {project.description && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      {project.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                    {project.moduleNames.map((modName, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.25rem',
                        }}
                      >
                        {modName}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Warranty Expiry:</span>
                    <strong style={{ color: '#1e293b' }}>
                      {new Date(project.warrantyExpiryDate).toLocaleDateString()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '0.25rem' }}>
                    <span>Days Remaining:</span>
                    <strong style={{ color: project.isWarrantyActive ? '#15803d' : '#b91c1c' }}>
                      {project.daysRemainingInWarranty > 0
                        ? `${project.daysRemainingInWarranty} days`
                        : 'Support Window Expired'}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Tickets Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎫</span> Recent Support Tickets
          </h2>
          {onNavigateToTickets && (
            <Button variant="outline" size="sm" onClick={onNavigateToTickets}>
              View All Tickets →
            </Button>
          )}
        </div>

        {dashboard?.recentTickets.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', margin: '0 0 1rem 0' }}>No tickets logged yet. Need assistance with your software?</p>
            <Button variant="primary" size="sm" onClick={() => setIsTicketModalOpen(true)}>
              Submit First Ticket
            </Button>
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Ticket Number</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                  <th style={{ padding: '0.75rem 1rem' }}>System</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>SLA Target</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.recentTickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                      {ticket.ticketNumber}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#1e293b', fontWeight: 500 }}>
                      {ticket.title}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>
                      {ticket.projectName}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: ticket.slaBreached ? '#dc2626' : '#16a34a' }}>
                      {ticket.slaBreached
                        ? '⚠️ SLA Breached'
                        : `${ticket.remainingWorkingHours.toFixed(1)}h remaining`}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onSelectTicket) onSelectTicket(ticket);
                          else if (onNavigateToTickets) onNavigateToTickets();
                        }}
                      >
                        View Thread
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guided Ticket Submission Modal */}
      {dashboard && (
        <GuidedTicketWizardModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          projects={dashboard.activeProjects}
          onTicketCreated={loadDashboard}
        />
      )}
    </div>
  );
};
