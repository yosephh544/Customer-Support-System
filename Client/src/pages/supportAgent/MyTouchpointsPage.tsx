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
  CalendarIcon,
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

  // Detailed Ticket Inspection Modal
  const [selectedTicket, setSelectedTicket] = useState<ScheduleItem | null>(null);
  const [status, setStatus] = useState<ScheduleItemStatus>(1);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleOpenTicketDetails = (item: ScheduleItem) => {
    setSelectedTicket(item);
    setStatus(item.status);
    setResolutionNotes(item.notes || '');
    setFormError(null);
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
      setSuccessMessage(`Touchpoint for "${selectedTicket.contactPersonName || selectedTicket.organizationName}" updated successfully.`);
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
            {/* Contact Person Details */}
            <div className="p-3 border rounded-md" style={{ background: 'var(--surface-subtle, rgba(255, 255, 255, 0.02))' }}>
              <div className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Customer Contact Information</div>
              <div className="grid grid-cols-2 gap-2 text-sm" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span className="text-xs text-muted block">Contact Person</span>
                  <span className="font-semibold text-dark">{selectedTicket.contactPersonName || 'Client Contact'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Phone</span>
                  <span className="font-medium text-dark">{selectedTicket.contactPersonPhone || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Email</span>
                  <span className="font-medium text-dark">{selectedTicket.contactPersonEmail || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Module / Scope</span>
                  <span className="font-medium text-dark">{selectedTicket.moduleName || 'Project-wide'}</span>
                </div>
              </div>
            </div>

            {/* Status Selector */}
            <div className="form-group">
              <label className="form-label">Touchpoint Delivery Status</label>
              <Select
                value={String(status)}
                onChange={(e) => setStatus(Number(e.target.value) as ScheduleItemStatus)}
                options={[
                  { value: '0', label: 'Pending (Scheduled / Upcoming)' },
                  { value: '1', label: 'Completed (Contact reached & touchpoint delivered)' },
                  { value: '2', label: 'Skipped (Contact unavailable / deferred)' },
                ]}
              />
            </div>

            {/* Live Recorded Notes */}
            <div className="form-group">
              <label className="form-label">Interaction Notes & Findings</label>
              <Input
                placeholder="Log discussion summary, action items, or follow-up needs"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

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
                Save Touchpoint Status
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
