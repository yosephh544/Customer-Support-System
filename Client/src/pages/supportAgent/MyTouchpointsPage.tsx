import React, { useEffect, useState } from 'react';
import { schedulesApi } from '../../api/schedulesApi';
import { Button } from '../../components/common/Button';
import { FilterBar } from '../../components/common/FilterBar';
import { Table } from '../../components/common/Table';
import type { Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  MessageSquareIcon,
  CheckIcon,
  ClockIcon,
  AlertCircleIcon,
  TagIcon,
  PhoneIcon,
  BuildingIcon,
  StarIcon,
} from '../../components/icons/Icons';
import type { ScheduleItem, ScheduleItemStatus } from '../../types';

export const MyTouchpointsPage: React.FC = () => {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Errors & notifications
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Detailed Ticket Inspection & Conversation Modal
  const [selectedTicket, setSelectedTicket] = useState<ScheduleItem | null>(null);
  const [modalTab, setModalTab] = useState<'conversation' | 'resolution' | 'customer'>('conversation');
  const [status, setStatus] = useState<ScheduleItemStatus>(1);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newReplyText, setNewReplyText] = useState('');
  const [replyType, setReplyType] = useState<'reply' | 'note'>('reply');
  const [csatRating, setCsatRating] = useState<number>(5);
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock conversation history entries for interactive helpdesk experience
  const [conversations, setConversations] = useState<Record<string, Array<{
    id: string;
    author: string;
    role: 'customer' | 'agent' | 'internal';
    time: string;
    text: string;
  }>>>({});

  const loadItems = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await schedulesApi.getMyItems({
        pageNumber: page,
        pageSize,
        searchTerm,
        status: filterStatus ? (Number(filterStatus) as ScheduleItemStatus) : undefined,
      });
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load assigned support tickets.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [page, pageSize, searchTerm, filterStatus]);

  const handleOpenTicketDetails = (item: ScheduleItem) => {
    setSelectedTicket(item);
    setStatus(item.status === 0 ? 1 : item.status);
    setResolutionNotes(item.notes || '');
    setFormError(null);
    setModalTab('conversation');

    // Initialize conversation timeline if not already created
    if (!conversations[item.id]) {
      setConversations((prev) => ({
        ...prev,
        [item.id]: [
          {
            id: '1',
            author: item.organizationName + ' (Customer Contact)',
            role: 'customer',
            time: 'Yesterday 14:20',
            text: `Inquiry regarding ${item.moduleName || 'system integration'}: Requesting support touchpoint to review latest weekly release updates and resolve export latency.`,
          },
          {
            id: '2',
            author: item.agentName + ' (Specialist Reply)',
            role: 'agent',
            time: 'Yesterday 15:05',
            text: 'Hello, our team has reviewed the telemetry logs. We have scheduled this dedicated touchpoint session to review configuration settings together.',
          },
        ],
      }));
    }
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newReplyText.trim()) return;

    const newEntry = {
      id: String(Date.now()),
      author: replyType === 'reply' ? `${selectedTicket.agentName} (Specialist Reply)` : 'Internal Team Note',
      role: (replyType === 'reply' ? 'agent' : 'internal') as 'agent' | 'internal',
      time: 'Just now',
      text: newReplyText.trim(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedTicket.id]: [...(prev[selectedTicket.id] || []), newEntry],
    }));

    setNewReplyText('');
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await schedulesApi.updateScheduleItemStatus(selectedTicket.id, {
        status,
        notes: resolutionNotes.trim() || undefined,
      });
      setSuccessMessage(`Ticket #${selectedTicket.id.slice(0, 8).toUpperCase()} updated successfully.`);
      setSelectedTicket(null);
      loadItems();
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to update ticket status.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s: ScheduleItemStatus | string | number) => {
    if (s === 1 || s === 'Completed') return <Badge variant="success" dot>Resolved</Badge>;
    if (s === 2 || s === 'Overdue') return <Badge variant="danger" dot>Overdue</Badge>;
    if (s === 3 || s === 'InProgress') return <Badge variant="primary" dot>In Progress</Badge>;
    if (s === 4 || s === 'Skipped') return <Badge variant="neutral">Closed</Badge>;
    return <Badge variant="warning" dot>Pending</Badge>;
  };

  const getPriorityBadge = (index: number) => {
    if (index % 4 === 0) return <Badge variant="danger">Urgent</Badge>;
    if (index % 3 === 0) return <Badge variant="warning">High</Badge>;
    return <Badge variant="neutral">Normal</Badge>;
  };

  const columns: Column<ScheduleItem>[] = [
    {
      key: 'ref',
      header: 'TICKET REF',
      render: (item) => (
        <span className="ticket-ref-pill">
          #TKT-{item.id.slice(0, 6).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'project',
      header: 'CUSTOMER / SUBJECT',
      render: (item) => (
        <div>
          <div className="font-semibold text-dark">{item.projectName}</div>
          <div className="text-xs text-muted">
            {item.organizationName} · {item.moduleName ? `Module: ${item.moduleName}` : 'General support'}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'PRIORITY',
      render: (_, index) => getPriorityBadge(index),
    },
    {
      key: 'schedule',
      header: 'SCHEDULED TARGET',
      render: (item) => (
        <div>
          <span className="font-medium text-dark text-xs">{item.dayOfWeek}</span>
          <div className="text-xs text-muted">
            {new Date(item.targetDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'ACTION',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenTicketDetails(item)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="my-touchpoints-page">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Support Ticket & Touchpoint Queue</h1>
          <p className="main-page-subtitle">
            Manage inbound customer communications, log resolution outcomes, and resolve escalations.
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {pageError && (
        <Alert
          variant="error"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
          action={
            <Button size="sm" variant="outline" onClick={loadItems}>
              Retry Connection
            </Button>
          }
        />
      )}

      {/* Ticket Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: '0', label: 'Pending Tickets' },
              { value: '3', label: 'In-Progress Tickets' },
              { value: '1', label: 'Resolved Tickets' },
              { value: '2', label: 'Overdue / Escalated' },
            ]}
          />
        }
      />

      {/* Ticket List Table */}
      <div className="content-card">
        <Table
          columns={columns}
          data={items}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyIcon={<CheckIcon size={26} />}
          emptyTitle="Your queue is clear!"
          emptyMessage="No customer touchpoint tickets match your current filters. All assigned engagements are up to date."
          emptySecondaryAction={
            (searchTerm || filterStatus) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                }}
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Structured Ticket Details & Conversation Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Ticket #TKT-${selectedTicket.id.slice(0, 6).toUpperCase()} · ${selectedTicket.projectName}` : 'Ticket Details'}
        description={selectedTicket ? `Customer: ${selectedTicket.organizationName} · Scheduled for ${selectedTicket.dayOfWeek}` : ''}
        size="lg"
      >
        {formError && (
          <Alert
            variant="error"
            message={formError.message}
            details={formError.details}
            onClose={() => setFormError(null)}
          />
        )}

        {selectedTicket && (
          <div>
            {/* Modal Navigation Tabs */}
            <div className="flex gap-2 border-b pb-2 mb-3">
              <button
                type="button"
                className={`btn btn-sm ${modalTab === 'conversation' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setModalTab('conversation')}
              >
                Conversation & Replies ({conversations[selectedTicket.id]?.length || 0})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${modalTab === 'resolution' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setModalTab('resolution')}
              >
                Resolution & Status
              </button>
              <button
                type="button"
                className={`btn btn-sm ${modalTab === 'customer' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setModalTab('customer')}
              >
                Customer Profile
              </button>
            </div>

            {/* Tab 1: Conversation & Timeline */}
            {modalTab === 'conversation' && (
              <div>
                <div className="ticket-conversation-panel" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {(conversations[selectedTicket.id] || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`timeline-entry ${
                        msg.role === 'customer'
                          ? 'customer-message'
                          : msg.role === 'internal'
                          ? 'internal-note'
                          : 'agent-reply'
                      }`}
                    >
                      <div className="timeline-avatar">
                        {msg.author.charAt(0)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-author">{msg.author}</span>
                          <span className="timeline-time">{msg.time}</span>
                        </div>
                        <div className="timeline-text">{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Composer */}
                <form onSubmit={handlePostReply} className="mt-3 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted">Post a response:</span>
                    <div className="flex gap-2 text-xs">
                      <label className="checkbox-label">
                        <input
                          type="radio"
                          name="replyType"
                          checked={replyType === 'reply'}
                          onChange={() => setReplyType('reply')}
                        />
                        <span>Reply to Customer</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="radio"
                          name="replyType"
                          checked={replyType === 'note'}
                          onChange={() => setReplyType('note')}
                        />
                        <span>Internal Note</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="form-input"
                      aria-label="Message input"
                      value={newReplyText}
                      onChange={(e) => setNewReplyText(e.target.value)}
                    />
                    <Button type="submit" variant="accent" size="sm" disabled={!newReplyText.trim()}>
                      Send
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Resolution & Status Management */}
            {modalTab === 'resolution' && (
              <form onSubmit={handleSaveResolution}>
                <div className="form-group">
                  <label className="form-label">Update Ticket Lifecycle Status</label>
                  <Select
                    value={String(status)}
                    onChange={(e) => setStatus(Number(e.target.value) as ScheduleItemStatus)}
                    options={[
                      { value: '1', label: 'Resolved (Issue resolved, client notified)' },
                      { value: '3', label: 'In Progress (Investigation or patch in testing)' },
                      { value: '2', label: 'Overdue / Escalated (Requires team lead assistance)' },
                      { value: '4', label: 'Closed / Deferred' },
                    ]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Satisfaction Rating (CSAT)</label>
                  <div className="flex gap-2 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCsatRating(star)}
                        className={`btn btn-sm ${star <= csatRating ? 'text-amber' : 'text-muted'}`}
                        style={{ border: 'none', background: 'transparent', padding: '2px 4px' }}
                      >
                        <StarIcon size={20} fill={star <= csatRating ? '#D97706' : 'none'} />
                      </button>
                    ))}
                    <span className="text-xs text-muted ml-2">{csatRating} of 5 Stars</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Resolution Notes & Findings</label>
                  <Input
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>

                <div className="modal-actions-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                  >
                    Save Status Changes
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 3: Customer Information */}
            {modalTab === 'customer' && (
              <div className="p-2">
                <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="p-3 border rounded-md">
                    <div className="text-xs font-semibold text-muted mb-1">Customer Organization</div>
                    <div className="font-bold text-dark text-sm">{selectedTicket.organizationName}</div>
                    <div className="text-xs text-muted mt-1">Tenant ID: {selectedTicket.id.slice(0, 8)}</div>
                  </div>

                  <div className="p-3 border rounded-md">
                    <div className="text-xs font-semibold text-muted mb-1">Contracted SLA Tier</div>
                    <div className="font-bold text-dark text-sm">Enterprise 24/7 SLA</div>
                    <div className="text-xs text-success mt-1">Response Target: &lt; 30 mins</div>
                  </div>
                </div>

                <div className="mt-3 p-3 border rounded-md">
                  <div className="text-xs font-semibold text-muted mb-1">Target Module & Scope</div>
                  <div className="font-medium text-dark text-sm">{selectedTicket.moduleName || 'Platform Core Service'}</div>
                  <div className="text-xs text-muted mt-1">Managed under Project: {selectedTicket.projectName}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
