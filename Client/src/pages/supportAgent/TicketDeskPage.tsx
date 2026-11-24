import React, { useState, useEffect } from 'react';
import { ticketsApi } from '../../api/ticketsApi';
import { organizationsApi } from '../../api/organizationsApi';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Pagination } from '../../components/common/Pagination';
import { TicketDetailsModal } from '../../components/tickets/TicketDetailsModal';
import { CreateTicketModal } from '../../components/tickets/CreateTicketModal';
import type {
  Ticket,
  TicketAnalytics,
  Organization,
  TicketPriority,
  TicketStatus,
  TicketCategory,
} from '../../types';

export const TicketDeskPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Filter States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadOrganizations();
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [
    page,
    pageSize,
    searchTerm,
    selectedOrgId,
    selectedPriority,
    selectedStatus,
    selectedCategory,
    slaBreachedOnly,
  ]);

  const loadOrganizations = async () => {
    try {
      const res = await organizationsApi.getOrganizations({ pageSize: 100 });
      setOrganizations(res.items || []);
    } catch {
      // Non-critical
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await ticketsApi.getAnalytics();
      setAnalytics(data);
    } catch {
      // Non-critical
    }
  };

  const loadTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ticketsApi.getTickets({
        pageNumber: page,
        pageSize,
        searchTerm: searchTerm.trim() || undefined,
        organizationId: selectedOrgId || undefined,
        priority: selectedPriority || undefined,
        status: selectedStatus || undefined,
        category: selectedCategory || undefined,
        slaBreachedOnly: slaBreachedOnly || undefined,
      });
      setTickets(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setIsDetailsOpen(true);
  };

  const handleTicketUpdated = () => {
    loadTickets();
    loadAnalytics();
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'Blocker':
        return <Badge variant="blocker" dot>Blocker</Badge>;
      case 'High':
        return <Badge variant="danger" dot>High</Badge>;
      case 'Medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'Low':
      default:
        return <Badge variant="success">Low</Badge>;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'Resolved':
      case 'Closed':
        return <Badge variant="success" dot>{s}</Badge>;
      case 'InProgress':
        return <Badge variant="purple" dot>In Progress</Badge>;
      case 'Assigned':
        return <Badge variant="info">Assigned</Badge>;
      case 'PendingCustomer':
        return <Badge variant="warning">Pending Customer</Badge>;
      case 'New':
      default:
        return <Badge variant="neutral">New</Badge>;
    }
  };

  return (
    <div className="ticket-desk-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-color, #111827)' }}>
            Reactive Support Desk & SLA Management
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            Unified ticketing, Ethiopian working-hour SLA telemetry, and escalation tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
          >
            + Log Support Ticket
          </Button>
        </div>
      </div>

      {toastMessage && <Alert variant="success" message={toastMessage} />}
      {error && <Alert variant="danger" message={error} />}

      {/* Analytics KPI Bento Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Total Tickets</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
            {analytics?.totalTickets ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
            {analytics?.openTickets ?? 0} active / in triage
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', textTransform: 'uppercase' }}>In Progress</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>
            {analytics?.inProgressTickets ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Under active investigation</div>
        </div>

        <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>Critical / Blocker</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
            {analytics?.criticalTickets ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>4h - 8h SLA threshold</div>
        </div>

        <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase' }}>SLA Breached</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
            {analytics?.breachedTickets ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Requires immediate escalation</div>
        </div>

        <div className="stat-card" style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>SLA Compliance</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
            {analytics ? `${analytics.slaComplianceRate}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>Resolved within deadline</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
          placeholder="Search ticket #, title, client, project..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          style={{ minWidth: '240px', flex: 1, fontSize: '0.85rem' }}
        />

        <select
          className="form-input"
          value={selectedOrgId}
          onChange={(e) => {
            setSelectedOrgId(e.target.value);
            setPage(1);
          }}
          style={{ fontSize: '0.85rem' }}
        >
          <option value="">All Organizations</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>

        <select
          className="form-input"
          value={selectedPriority}
          onChange={(e) => {
            setSelectedPriority(e.target.value);
            setPage(1);
          }}
          style={{ fontSize: '0.85rem' }}
        >
          <option value="">All Priorities</option>
          <option value="Blocker">Blocker (4h)</option>
          <option value="High">High (8h)</option>
          <option value="Medium">Medium (24h)</option>
          <option value="Low">Low (48h)</option>
        </select>

        <select
          className="form-input"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          style={{ fontSize: '0.85rem' }}
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Assigned">Assigned</option>
          <option value="InProgress">In Progress</option>
          <option value="PendingCustomer">Pending Customer</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', marginLeft: '6px' }}>
          <input
            type="checkbox"
            checked={slaBreachedOnly}
            onChange={(e) => {
              setSlaBreachedOnly(e.target.checked);
              setPage(1);
            }}
          />
          <span style={{ fontWeight: 500, color: slaBreachedOnly ? '#ef4444' : '#4b5563' }}>
            ⚠️ Breached SLA Only
          </span>
        </label>
      </div>

      {/* Ticket Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner spinner-lg" />
            <p className="text-muted text-sm mt-3">Loading tickets from database...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#374151' }}>No tickets match your filter criteria</div>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 16px 0' }}>Try adjusting your search query, priority, or status filters.</p>
            <Button variant="outline" size="sm" onClick={() => {
              setSearchTerm('');
              setSelectedOrgId('');
              setSelectedPriority('');
              setSelectedStatus('');
              setSelectedCategory('');
              setSlaBreachedOnly(false);
            }}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>TICKET</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>CUSTOMER / SCOPE</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>PRIORITY</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>ETHIOPIAN SLA</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>WARRANTY</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>SPECIALIST</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: t.slaBreached ? 'rgba(239, 68, 68, 0.03)' : undefined,
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>
                        {t.ticketNumber}
                      </div>
                      <div style={{ fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                        {t.title}
                      </div>
                      <div className="text-xs text-muted">
                        Category: {t.categoryName}
                        {t.escalatedFromFeedbackId && ' · ⚡ Escalated'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{t.organizationName}</div>
                      <div className="text-xs text-muted">
                        {t.projectName} {t.moduleName ? `(${t.moduleName})` : ''}
                      </div>
                      {t.contactPersonName && (
                        <div className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                          Contact: {t.contactPersonName}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {getPriorityBadge(t.priority)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {getStatusBadge(t.status)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {t.status === 'Resolved' || t.status === 'Closed' ? (
                        <div className="text-xs" style={{ color: t.slaBreached ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          {t.slaBreached ? '⚠️ Resolved (Breached)' : '✓ Met SLA'}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: t.slaBreached ? '#ef4444' : '#059669' }}>
                            {t.slaBreached ? '⚠️ BREACHED' : `⏱️ ${t.remainingWorkingHours}h left`}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                            Due: {new Date(t.slaDeadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {t.isWarrantyCovered ? (
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
                          ✓ Active Warranty
                        </span>
                      ) : (
                        <Badge variant="purple" size="sm">
                          💳 Out of Scope
                        </Badge>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {t.assignedToUserName ? (
                        <span style={{ fontWeight: 500, color: '#374151' }}>{t.assignedToUserName}</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(t.id)}
                      >
                        View & Respond
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
            <Pagination
              currentPage={page}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <TicketDetailsModal
        ticketId={activeTicketId}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setActiveTicketId(null);
        }}
        onTicketUpdated={handleTicketUpdated}
      />

      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTicketCreated={() => {
          setToastMessage('New support ticket logged and SLA countdown initiated.');
          setTimeout(() => setToastMessage(null), 4000);
          loadTickets();
          loadAnalytics();
        }}
      />
    </div>
  );
};
