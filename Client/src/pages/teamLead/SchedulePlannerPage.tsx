import React, { useEffect, useState } from 'react';
import { schedulesApi } from '../../api/schedulesApi';
import { Button } from '../../components/common/Button';
import { FilterBar } from '../../components/common/FilterBar';
import { Table } from '../../components/common/Table';
import type { Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { PlusIcon, CalendarIcon, RefreshIcon } from '../../components/icons/Icons';
import type { ScheduleItem, WeeklySchedule } from '../../types';

export const SchedulePlannerPage: React.FC = () => {
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<WeeklySchedule | null>(null);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Errors & notifications
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSchedules = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await schedulesApi.getSchedules({ pageSize: 20 });
      setSchedules(res.items || []);
      if (res.items && res.items.length > 0 && !selectedSchedule) {
        setSelectedSchedule(res.items[0]);
      }
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load weekly schedule cycles.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadScheduleItems = async (scheduleId: string) => {
    try {
      const res = await schedulesApi.getScheduleItems(scheduleId, {
        pageNumber: page,
        pageSize,
        searchTerm,
      });
      setItems(res.items || []);
      setTotalItemsCount(res.totalCount || 0);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load items for the selected schedule.',
        details: err.errors,
      });
    }
  };

  useEffect(() => {
    if (selectedSchedule) {
      loadScheduleItems(selectedSchedule.id);
    }
  }, [selectedSchedule, page, pageSize, searchTerm]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      setFormError({ message: 'Cycle start date is required.' });
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const newSched = await schedulesApi.createSchedule({
        startDate: new Date(startDate).toISOString(),
        notes: notes.trim() || undefined,
      });
      setSuccessMessage(`Schedule cycle initialized for week of ${new Date(startDate).toLocaleDateString()}.`);
      setIsNewCycleModalOpen(false);
      await loadSchedules();
      setSelectedSchedule(newSched);
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to create schedule cycle.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedSchedule) return;
    setIsGenerating(true);
    try {
      await schedulesApi.autoGenerateSchedule(selectedSchedule.id);
      setSuccessMessage('Weekly touchpoint slots auto-generated across active team assignments.');
      loadScheduleItems(selectedSchedule.id);
      loadSchedules();
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to auto-generate schedule slots.',
        details: err.errors,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const columns: Column<ScheduleItem>[] = [
    {
      key: 'agent',
      header: 'SUPPORT AGENT',
      render: (item) => (
        <div className="agent-cell">
          <span className="agent-avatar">{item.agentName.charAt(0)}</span>
          <div>
            <div className="font-semibold text-dark">{item.agentName}</div>
            <div className="text-xs text-muted">{item.dayOfWeek}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'CUSTOMER ENGAGEMENT',
      render: (item) => (
        <div>
          <div className="font-semibold text-dark">{item.projectName}</div>
          <div className="text-xs text-muted">{item.organizationName}</div>
        </div>
      ),
    },
    {
      key: 'module',
      header: 'MODULE / FOCUS',
      render: (item) =>
        item.moduleName ? (
          <Badge variant="purple" size="sm">
            {item.moduleName}
          </Badge>
        ) : (
          <span className="text-xs text-muted">General outreach</span>
        ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (item) => {
        if (item.status === 'Completed') return <Badge variant="success" dot>Completed</Badge>;
        if (item.status === 'Overdue') return <Badge variant="danger" dot>Overdue</Badge>;
        if (item.status === 'InProgress') return <Badge variant="primary" dot>In Progress</Badge>;
        return <Badge variant="neutral" dot>Scheduled</Badge>;
      },
    },
    {
      key: 'targetDate',
      header: 'SCHEDULED DATE',
      render: (item) => (
        <span className="text-xs text-muted">
          {new Date(item.targetDate).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="schedule-planner-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">Weekly Schedule Planner</h2>
          <p className="main-page-subtitle">
            Plan, balance, and generate customer touchpoint rotations across your support team.
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
            <Button size="sm" variant="outline" onClick={loadSchedules}>
              Retry Connection
            </Button>
          }
        />
      )}

      {/* Cycle Selector Ribbon */}
      <div className="week-selector-ribbon">
        <span className="ribbon-label">Cycle:</span>
        <div className="ribbon-items">
          {schedules.map((sc) => {
            const isSelected = selectedSchedule?.id === sc.id;
            const startLabel = new Date(sc.startDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            const endLabel = new Date(sc.endDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            return (
              <button
                key={sc.id}
                type="button"
                className={`cycle-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedSchedule(sc)}
              >
                <CalendarIcon size={13} />
                <span>{startLabel} – {endLabel}</span>
                <span className="chip-badge">{sc.totalSlots} slots</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSchedule && (
        <div className="schedule-summary-banner">
          <div>
            <span className="text-xs text-muted font-bold uppercase tracking-wider block mb-1">Active Cycle Overview</span>
            <div className="font-bold text-dark text-sm">
              Week of {new Date(selectedSchedule.startDate).toLocaleDateString()}
              {selectedSchedule.isPublished && (
                <span className="ml-2"><Badge variant="success" size="sm">Published to Team</Badge></span>
              )}
            </div>
          </div>
          <div className="banner-stats">
            <div className="stat-pill">
              <span className="pill-number text-primary">{selectedSchedule.totalSlots}</span>
              <span className="pill-label">Total Slots</span>
            </div>
            <div className="stat-pill">
              <span className="pill-number text-success">{selectedSchedule.completedSlots}</span>
              <span className="pill-label">Completed</span>
            </div>
            <div className="stat-pill">
              <span className="pill-number text-danger">{selectedSchedule.overdueSlots}</span>
              <span className="pill-label">Overdue</span>
            </div>
          </div>
        </div>
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter items by agent, project, or module..."
        actionButton={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshIcon size={14} />}
              onClick={handleAutoGenerate}
              isLoading={isGenerating}
              disabled={!selectedSchedule}
              title="Automatically distribute touchpoints based on team member assignments"
            >
              Auto-generate Slots
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusIcon size={15} />}
              onClick={() => {
                setFormError(null);
                setIsNewCycleModalOpen(true);
              }}
            >
              New Cycle
            </Button>
          </div>
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={items}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No touchpoint items for this cycle. Click 'Auto-generate Slots' to generate assignments."
        />
        <Pagination
          currentPage={page}
          totalCount={totalItemsCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* New Cycle Modal */}
      <Modal
        isOpen={isNewCycleModalOpen}
        onClose={() => setIsNewCycleModalOpen(false)}
        title="Initialize New Schedule Cycle"
        description="Team Leads define weekly support coverage periods."
      >
        {formError && (
          <Alert
            variant="error"
            message={formError.message}
            details={formError.details}
            onClose={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleCreateSchedule}>
          <Input
            label="Cycle Start Date (Monday recommended)"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="Cycle Notes & Priorities"
            placeholder="e.g. Focus on post-upgrade customer validation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCycleModalOpen(false)}
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
              Create Cycle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
