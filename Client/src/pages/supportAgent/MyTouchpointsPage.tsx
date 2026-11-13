import React, { useEffect, useState } from 'react';
import { schedulesApi } from '../../api/schedulesApi';
import { feedbacksApi } from '../../api/feedbacksApi';
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
  CalendarIcon,
  CheckIcon,
  StarIcon,
} from '../../components/icons/Icons';
import type { Feedback, FeedbackPriority, ScheduleItem, ScheduleItemStatus } from '../../types';

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

  // Detailed Ticket Inspection Modal
  const [selectedTicket, setSelectedTicket] = useState<ScheduleItem | null>(null);
  const [status, setStatus] = useState<ScheduleItemStatus>(1);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Feedback States
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackPriority, setFeedbackPriority] = useState<FeedbackPriority>('Medium');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await schedulesApi.getMyItems({
        pageNumber: page,
        pageSize,
        searchTerm,
        status: filterStatus !== '' ? (Number(filterStatus) as ScheduleItemStatus) : undefined,
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

  const handleOpenTicketDetails = async (item: ScheduleItem) => {
    setSelectedTicket(item);
    setStatus(item.status);
    setResolutionNotes(item.notes || '');
    setFormError(null);
    setExistingFeedback(null);
    setFeedbackRating(5);
    setFeedbackPriority('Medium');
    setFeedbackRemarks('');
    setIsLoadingFeedback(true);

    try {
      const fb = await feedbacksApi.getFeedbackByScheduleItemId(item.id);
      if (fb) {
        setExistingFeedback(fb);
        setFeedbackRating(fb.rating || 5);
        setFeedbackPriority(fb.priority || 'Medium');
        setFeedbackRemarks(fb.remarks || '');
      }
    } catch {
      // Feedback does not exist yet for this item (expected for new touchpoints)
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      // 1. Update schedule item status and notes
      await schedulesApi.updateScheduleItemStatus(selectedTicket.id, {
        status,
        notes: resolutionNotes.trim() || undefined,
      });

      // 2. Only record Customer Feedback when status is Completed (contact was reached)
      if (status === 1 && feedbackRemarks.trim()) {
        if (existingFeedback) {
          await feedbacksApi.updateFeedback(existingFeedback.id, {
            rating: feedbackRating,
            priority: feedbackPriority,
            status: 'Resolved',
            remarks: feedbackRemarks.trim(),
            resolutionNotes: resolutionNotes.trim() || undefined,
          });
        } else {
          await feedbacksApi.createFeedback({
            scheduleItemId: selectedTicket.id,
            rating: feedbackRating,
            priority: feedbackPriority,
            status: 'Resolved',
            remarks: feedbackRemarks.trim(),
            resolutionNotes: resolutionNotes.trim() || undefined,
          });
        }
      }

      const statusLabel = status === 1 ? 'completed' : status === 2 ? 'marked as skipped' : 'updated';
      setSuccessMessage(
        `Touchpoint for "${selectedTicket.contactPersonName || selectedTicket.organizationName}" ${statusLabel}${
          status === 1 && feedbackRemarks.trim() ? ' and customer feedback logged' : ''
        }.`
      );
      setSelectedTicket(null);
      loadItems();
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to update touchpoint status.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s: ScheduleItemStatus | string | number) => {
    const num = Number(s);
    if (num === 1 || s === 'Completed') return <Badge variant="success" dot>Completed</Badge>;
    if (num === 2 || s === 'Skipped') return <Badge variant="neutral">Skipped</Badge>;
    return <Badge variant="warning" dot>Pending</Badge>;
  };

  const columns: Column<ScheduleItem>[] = [
    {
      key: 'ref',
      header: 'TOUCHPOINT REF',
      render: (item) => (
        <span className="ticket-ref-pill">
          #{item.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'CONTACT PERSON',
      render: (item) => (
        <div>
          <div className="font-semibold text-dark">{item.contactPersonName || 'Client Contact'}</div>
          <div className="text-xs text-muted">
            {item.contactPersonPhone || item.contactPersonEmail || 'No direct phone'}
          </div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'CUSTOMER / PROJECT',
      render: (item) => (
        <div>
          <div className="font-semibold text-dark">{item.projectName || '—'}</div>
          <div className="text-xs text-muted">
            {item.organizationName}{item.moduleName ? ` · Module: ${item.moduleName}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'SCHEDULED DATE',
      render: (item) => (
        <div>
          <span className="font-medium text-dark text-xs">
            {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
          </span>
          <div className="text-xs text-muted">
            {item.scheduledDate ? new Date(item.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
          View / Update
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
          searchTerm={searchTerm}
          emptyTitle={searchTerm ? `No touchpoints matching "${searchTerm}"` : 'Your queue is clear!'}
          emptyMessage={
            searchTerm
              ? `We couldn't find any touchpoints matching "${searchTerm}". Try checking your spelling or clear your filters.`
              : 'No customer touchpoint tickets match your current filters. All assigned engagements are up to date.'
          }
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

      {/* Touchpoint Details & Status Update Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Touchpoint #${selectedTicket.id.slice(0, 8).toUpperCase()}` : 'Touchpoint Details'}
        description={selectedTicket ? `Customer: ${selectedTicket.organizationName} · ${selectedTicket.projectName || 'General Support'}` : ''}
        size="md"
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
          <form onSubmit={handleSaveResolution} className="space-y-4">
            {/* Compact Header Summary */}
            <div
              className="p-3 rounded-md"
              style={{
                background: 'var(--surface-subtle, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-dark text-sm">
                    {selectedTicket.contactPersonName || 'Client Contact'}
                  </span>
                  {selectedTicket.contactPersonJobTitle && (
                    <span className="text-xs text-muted ml-1.5">
                      ({selectedTicket.contactPersonJobTitle})
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted font-medium">
                  {selectedTicket.moduleName ? `Module: ${selectedTicket.moduleName}` : 'Project-wide'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted mt-1.5 flex-wrap">
                <span>🏢 {selectedTicket.organizationName}</span>
                <span>📁 {selectedTicket.projectName || 'General Solution'}</span>
                {selectedTicket.contactPersonPhone && <span>📞 {selectedTicket.contactPersonPhone}</span>}
                {selectedTicket.contactPersonEmail && <span>✉️ {selectedTicket.contactPersonEmail}</span>}
              </div>
            </div>

            {/* Status Segmented Buttons */}
            <div className="form-group">
              <label className="form-label text-xs font-semibold uppercase tracking-wider text-muted">
                Touchpoint Outcome
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setStatus(1)}
                  className={`btn btn-sm ${status === 1 ? 'btn-primary' : 'btn-outline'}`}
                  style={{ justifyContent: 'center', fontWeight: status === 1 ? 600 : 400 }}
                >
                  ✅ Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(0)}
                  className={`btn btn-sm ${status === 0 ? 'btn-primary' : 'btn-outline'}`}
                  style={{ justifyContent: 'center', fontWeight: status === 0 ? 600 : 400 }}
                >
                  ⏳ Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(2)}
                  className={`btn btn-sm ${status === 2 ? 'btn-primary' : 'btn-outline'}`}
                  style={{ justifyContent: 'center', fontWeight: status === 2 ? 600 : 400 }}
                >
                  ⛔ Skipped
                </button>
              </div>
            </div>

            {/* CONDITIONAL BODY BASED ON STATUS */}

            {/* CASE 1: SKIPPED -> Contact was NOT reached -> No customer feedback */}
            {status === 2 && (
              <div className="space-y-3">
                <div
                  className="p-3 rounded-md text-xs text-muted"
                  style={{
                    background: 'var(--surface-subtle, rgba(255, 255, 255, 0.02))',
                    borderLeft: '3px solid var(--text-muted, #71717a)',
                  }}
                >
                  <strong className="text-dark">Contact not reached:</strong> This touchpoint is marked as skipped. Customer feedback is disabled because the customer was not engaged.
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-medium">
                    Reason for Skipping / Rescheduling <span className="text-muted">(Optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. Client unreachable, phone went to voicemail, client out of office"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* CASE 2: PENDING -> Scheduled / Upcoming -> No customer feedback yet */}
            {status === 0 && (
              <div className="space-y-3">
                <div
                  className="p-3 rounded-md text-xs text-muted"
                  style={{
                    background: 'var(--surface-subtle, rgba(255, 255, 255, 0.02))',
                    borderLeft: '3px solid var(--warning-color, #eab308)',
                  }}
                >
                  <strong className="text-dark">Upcoming Engagement:</strong> Scheduled for delivery. Once you connect with the client, switch status to <strong>Completed</strong> to log feedback.
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-medium">
                    Preparation / Schedule Note <span className="text-muted">(Optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. Follow up on database migration status or verify credentials prior to call"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* CASE 3: COMPLETED -> Contact reached -> Record Customer CSAT & Feedback */}
            {status === 1 && (
              <div className="space-y-3">
                <div
                  className="p-3 rounded-md border"
                  style={{
                    background: 'var(--surface-subtle, rgba(255, 255, 255, 0.02))',
                    borderColor: 'var(--border-color, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-dark flex items-center gap-1">
                      <StarIcon size={13} className="text-warning" /> Customer CSAT Feedback
                    </span>
                    {existingFeedback && (
                      <Badge variant="success" size="sm">
                        Feedback Recorded
                      </Badge>
                    )}
                  </div>

                  {/* 1-5 Star Selection */}
                  <div className="form-group mb-3">
                    <label className="form-label text-xs">Customer Satisfaction Rating</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`btn btn-sm ${feedbackRating >= star ? 'btn-primary' : 'btn-outline'}`}
                          style={{
                            padding: '4px 9px',
                            minWidth: '32px',
                            justifyContent: 'center',
                          }}
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          <StarIcon size={12} />
                          <span className="ml-1 text-xs">{star}</span>
                        </button>
                      ))}
                      <span className="text-xs text-muted ml-2 font-medium">
                        {feedbackRating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                        {feedbackRating === 4 && '⭐⭐⭐⭐ Good'}
                        {feedbackRating === 3 && '⭐⭐⭐ Neutral'}
                        {feedbackRating === 2 && '⭐⭐ Unsatisfied'}
                        {feedbackRating === 1 && '⭐ Critical Issue'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Feedback Remarks */}
                  <div className="form-group mb-1">
                    <label className="form-label text-xs">
                      Customer Feedback / Remarks <span className="text-muted">(Optional)</span>
                    </label>
                    <textarea
                      className="form-input w-full"
                      rows={2}
                      style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem' }}
                      placeholder="e.g. Client confirmed system working smoothly, requested report export guide..."
                      value={feedbackRemarks}
                      onChange={(e) => setFeedbackRemarks(e.target.value)}
                    />
                  </div>
                </div>

                {/* Internal Agent Notes */}
                <div className="form-group">
                  <label className="form-label text-xs font-medium">
                    Internal Resolution Notes <span className="text-muted">(Optional)</span>
                  </label>
                  <Input
                    placeholder="Internal summary, action items taken, or escalation notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="modal-actions-right mt-4">
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
                {status === 1 ? 'Save Touchpoint & Feedback' : status === 2 ? 'Save as Skipped' : 'Save Touchpoint'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
