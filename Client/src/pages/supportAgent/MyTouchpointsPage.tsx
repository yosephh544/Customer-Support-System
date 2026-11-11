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
import { CheckIcon, CloseIcon, PhoneIcon } from '../../components/icons/Icons';
import type { ScheduleItem, ScheduleItemStatus } from '../../types';

export const MyTouchpointsPage: React.FC = () => {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Execution Modal
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [status, setStatus] = useState<ScheduleItemStatus>(1); // Completed
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const res = await schedulesApi.getMyItems({
        pageNumber: page,
        pageSize,
        searchTerm,
        status: filterStatus ? (Number(filterStatus) as ScheduleItemStatus) : undefined,
      });
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [page, pageSize, searchTerm, filterStatus]);

  const handleOpenExecuteModal = (item: ScheduleItem) => {
    setSelectedItem(item);
    setStatus(item.status === 0 ? 1 : item.status);
    setNotes(item.notes || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await schedulesApi.updateItemStatus(selectedItem.id, {
        status,
        notes: notes.trim(),
      });
      setSelectedItem(null);
      loadItems();
    } catch (err: any) {
      alert(err.message || 'Failed to update touchpoint status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<ScheduleItem>[] = [
    {
      key: 'contact',
      header: 'CUSTOMER CONTACT',
      render: (i) => (
        <div>
          <div className="font-semibold text-dark">{i.contactPersonName}</div>
          <div className="text-xs text-muted flex items-center gap-1">
            <span>📞 {i.contactPersonPhone}</span>
            {i.contactPersonEmail && <span>· {i.contactPersonEmail}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'account',
      header: 'ORGANIZATION & PROJECT',
      render: (i) => (
        <div>
          <div className="font-medium text-dark">{i.organizationName}</div>
          <div className="text-xs text-muted">
            {i.projectName ? `${i.projectName}` : 'General support'} {i.moduleName ? `· ${i.moduleName}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'SCHEDULED DATE',
      render: (i) => (
        <span className="text-sm font-medium">
          {i.scheduledDate ? new Date(i.scheduledDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (i) => {
        const variant = i.status === 1 ? 'success' : i.status === 2 ? 'neutral' : 'warning';
        return <Badge variant={variant} dot>{i.statusName}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'EXECUTION',
      align: 'right',
      render: (i) => (
        <Button
          variant={i.status === 0 ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleOpenExecuteModal(i)}
        >
          {i.status === 0 ? 'Conduct call' : 'Update notes'}
        </Button>
      ),
    },
  ];

  return (
    <div className="my-touchpoints-page">
      <div className="page-header-row">
        <div>
          <h2 className="section-title">My Customer Touchpoints</h2>
          <p className="section-subtitle">
            Execute outreach calls, register feedback notes, and update resolution outcomes.
          </p>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customer, phone, or organization..."
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="0">Pending</option>
          <option value="1">Completed</option>
          <option value="2">Skipped</option>
        </select>
      </FilterBar>

      <div className="content-card">
        <Table
          columns={columns}
          data={items}
          keyExtractor={(i) => i.id}
          isLoading={isLoading}
          emptyMessage="No touchpoint items assigned to you matching the filter."
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Execute Touchpoint Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Execute Customer Touchpoint"
        description={`Record outcome for ${selectedItem?.contactPersonName} (${selectedItem?.organizationName})`}
      >
        <form onSubmit={handleUpdateStatus}>
          <div className="customer-info-box mb-4">
            <div className="text-sm">
              <span className="font-semibold">Phone:</span> {selectedItem?.contactPersonPhone}
            </div>
            {selectedItem?.contactPersonEmail && (
              <div className="text-sm">
                <span className="font-semibold">Email:</span> {selectedItem.contactPersonEmail}
              </div>
            )}
            {selectedItem?.projectName && (
              <div className="text-sm">
                <span className="font-semibold">Project:</span> {selectedItem.projectName}
              </div>
            )}
          </div>

          <Select
            label="Outcome Status"
            required
            options={[
              { value: 1, label: 'Completed (Call conducted successfully)' },
              { value: 2, label: 'Skipped / Postponed (Client unreachable)' },
              { value: 0, label: 'Pending (In progress)' },
            ]}
            value={status}
            onChange={(e) => setStatus(Number(e.target.value) as ScheduleItemStatus)}
          />

          <Input
            label="Call Notes / Customer Feedback"
            placeholder="e.g. Client confirmed system is operating smoothly, requested documentation for billing module"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedItem(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Outcome
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
