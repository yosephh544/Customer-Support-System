import React, { useState, useEffect } from 'react';
import { portalApi } from '../../api/portalApi';
import { ClientTicketDetailModal } from '../../components/portal/ClientTicketDetailModal';
import { GuidedTicketWizardModal } from '../../components/portal/GuidedTicketWizardModal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Pagination } from '../../components/common/Pagination';
import type { Ticket, TicketStatus, PortalProjectSummary } from '../../types';

export const ClientTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<PortalProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');

  // Modals
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [pageNumber, statusFilter]);

  const loadProjects = async () => {
    try {
      const dashboardData = await portalApi.getDashboard();
      setProjects(dashboardData.activeProjects || []);
    } catch {
      // Non-critical
    }
  };

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await portalApi.getTickets({
        pageNumber,
        pageSize,
        status: statusFilter ? statusFilter : undefined,
      });
      setTickets(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to load organization support tickets.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return <Badge variant="success">{status}</Badge>;
      case 'InProgress':
      case 'PendingClient':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Blocker':
      case 'High':
        return <Badge variant="danger">{priority}</Badge>;
      case 'Medium':
        return <Badge variant="warning">{priority}</Badge>;
      default:
        return <Badge variant="neutral">{priority}</Badge>;
    }
  };

  return (
    <div className="client-tickets-page" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Support Tickets
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            View progress, chat with engineers, and submit technical queries for your software deployments.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          ⚡ Submit New Ticket
        </Button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Filter Status:</span>
        {(['', 'New', 'Assigned', 'InProgress', 'PendingClient', 'Resolved'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => {
              setStatusFilter(st as TicketStatus | '');
              setPageNumber(1);
            }}
            style={{
              background: statusFilter === st ? '#2563eb' : 'transparent',
              color: statusFilter === st ? '#ffffff' : '#475569',
              border: statusFilter === st ? '1px solid #2563eb' : '1px solid #cbd5e1',
              borderRadius: '9999px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {st === '' ? 'All Tickets' : st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 1rem 0' }}>
              No support tickets found matching your selection.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              Submit a Ticket
            </Button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.75rem 1rem' }}>Ticket Number</th>
                <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                <th style={{ padding: '0.75rem 1rem' }}>System</th>
                <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => handleTicketClick(t)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                    {t.ticketNumber}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#1e293b', fontWeight: 500 }}>
                    {t.title}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>
                    {t.projectName}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {getPriorityBadge(t.priority)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {getStatusBadge(t.status)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTicketClick(t);
                      }}
                    >
                      Open Thread
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalCount > pageSize && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            currentPage={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPageNumber}
          />
        </div>
      )}

      {/* Ticket Details & Conversation Modal */}
      <ClientTicketDetailModal
        ticketId={selectedTicketId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTicketId(null);
        }}
        onTicketUpdated={loadTickets}
      />

      {/* Create Ticket Modal */}
      <GuidedTicketWizardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        onTicketCreated={() => {
          loadTickets();
          setPageNumber(1);
        }}
      />
    </div>
  );
};
