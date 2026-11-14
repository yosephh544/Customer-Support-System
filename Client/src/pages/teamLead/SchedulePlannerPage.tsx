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

export interface SchedulePlannerPageProps {
  readOnly?: boolean;
}

export const SchedulePlannerPage: React.FC<SchedulePlannerPageProps> = ({ readOnly = false }) => {
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
  const [endDate, setEndDate] = useState('');
  const [durationPreset, setDurationPreset] = useState<'3' | '5' | '7' | 'custom'>('7');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && durationPreset !== 'custom') {
      const days = parseInt(durationPreset, 10);
      const d = new Date(val);
      d.setDate(d.getDate() + (days - 1));
      setEndDate(d.toISOString().slice(0, 10));
    }
  };

  const handlePresetSelect = (preset: '3' | '5' | '7' | 'custom') => {
    setDurationPreset(preset);
    if (preset !== 'custom' && startDate) {
      const days = parseInt(preset, 10);
      const d = new Date(startDate);
      d.setDate(d.getDate() + (days - 1));
      setEndDate(d.toISOString().slice(0, 10));
    }
  };

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

    const startObj = new Date(startDate);
    if (isNaN(startObj.getTime())) {
      setFormError({ message: 'Valid cycle start date is required.' });
      return;
    }

    let endIso: string | undefined = undefined;
    if (endDate) {
      const endObj = new Date(endDate);
      if (isNaN(endObj.getTime())) {
        setFormError({ message: 'Valid cycle end date is required.' });
        return;
      }
      if (endObj < startObj) {
        setFormError({ message: 'Cycle end date cannot be earlier than start date.' });
        return;
      }
      endIso = endObj.toISOString();
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const newSched = await schedulesApi.createSchedule({
        weekStartDate: startObj.toISOString(),
        startDate: startObj.toISOString(),
        weekEndDate: endIso,
        endDate: endIso,
        notes: notes.trim() || undefined,
      });
      const endDisplay = endDate ? ` to ${new Date(endDate).toLocaleDateString()}` : '';
      setSuccessMessage(`Schedule cycle initialized for ${startObj.toLocaleDateString()}${endDisplay}.`);
      setIsNewCycleModalOpen(false);
      setStartDate('');
      setEndDate('');
      setNotes('');
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
      render: (item) => {
        const agentName = item.agentName || item.assignedUserFullName || item.assignedUserName || 'Assigned Agent';
        const dayStr = item.dayOfWeek || (item.scheduledDate && !isNaN(new Date(item.scheduledDate).getTime())
          ? new Date(item.scheduledDate).toLocaleDateString(undefined, { weekday: 'short' })
          : 'Flexible');
        return (
          <div className="agent-cell">
            <span className="agent-avatar">{agentName.charAt(0).toUpperCase()}</span>
            <div>
              <div className="font-semibold text-dark">{agentName}</div>
              <div className="text-xs text-muted">{dayStr}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'project',
      header: 'CUSTOMER ENGAGEMENT',
      render: (item) => (
        <div>
          <div className="font-semibold text-dark">{item.projectName || 'General Support'}</div>
          <div className="text-xs text-muted">
            {item.contactPersonName ? `${item.contactPersonName} • ` : ''}{item.organizationName}
          </div>
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
        const num = Number(item.status);
        if (num === 1 || item.status === 'Completed') return <Badge variant="success" dot>Completed</Badge>;
        if (num === 2 || item.status === 'Skipped') return <Badge variant="neutral">Skipped</Badge>;
        return <Badge variant="warning" dot>Pending</Badge>;
      },
    },
    {
      key: 'targetDate',
      header: 'SCHEDULED DATE',
      render: (item) => {
        const rawDate = item.scheduledDate || item.targetDate;
        return (
          <span className="text-xs text-muted">
            {rawDate && !isNaN(new Date(rawDate).getTime())
              ? new Date(rawDate).toLocaleDateString()
              : 'During cycle'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="schedule-planner-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">
            {readOnly ? 'Service Delivery & Weekly Schedules' : 'Weekly Schedule Planner'}
          </h2>
          <p className="main-page-subtitle">
            {readOnly
              ? 'Executive overview of scheduled client touchpoints, outreach cycles, and delivery tracking.'
              : 'Plan, balance, and generate customer touchpoint rotations across your support team.'}
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
            const rawStart = sc.startDate || sc.weekStartDate;
            const rawEnd = sc.endDate || sc.weekEndDate;

            const startLabel = rawStart && !isNaN(new Date(rawStart).getTime())
              ? new Date(rawStart).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : `Wk ${sc.weekNumber}`;

            const endLabel = rawEnd && !isNaN(new Date(rawEnd).getTime())
              ? new Date(rawEnd).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            const slotCount = sc.totalSlots ?? sc.totalItems ?? 0;

            return (
              <button
                key={sc.id}
                type="button"
                className={`cycle-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedSchedule(sc)}
              >
                <CalendarIcon size={13} />
                <span>{startLabel}{endLabel ? ` – ${endLabel}` : ''}</span>
                <span className="chip-badge">{slotCount} slots</span>
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
              {(() => {
                const rawStart = selectedSchedule.startDate || selectedSchedule.weekStartDate;
                const rawEnd = selectedSchedule.endDate || selectedSchedule.weekEndDate;
                const startStr = rawStart && !isNaN(new Date(rawStart).getTime())
                  ? new Date(rawStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : `Week ${selectedSchedule.weekNumber}, ${selectedSchedule.year}`;
                const endStr = rawEnd && !isNaN(new Date(rawEnd).getTime())
                  ? ` – ${new Date(rawEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : '';
                return `Plan: ${startStr}${endStr}`;
              })()}
              {(selectedSchedule.isPublished || selectedSchedule.status === 1) && (
                <span className="ml-2"><Badge variant="success" size="sm">Published to Team</Badge></span>
              )}
            </div>
          </div>
          <div className="banner-stats">
            <div className="stat-pill">
              <span className="pill-number text-primary">{selectedSchedule.totalSlots ?? selectedSchedule.totalItems ?? 0}</span>
              <span className="pill-label">Total Slots</span>
            </div>
            <div className="stat-pill">
              <span className="pill-number text-success">{selectedSchedule.completedSlots ?? selectedSchedule.completedItems ?? 0}</span>
              <span className="pill-label">Completed</span>
            </div>
            <div className="stat-pill">
              <span className="pill-number text-warning">{selectedSchedule.overdueSlots ?? selectedSchedule.pendingItems ?? 0}</span>
              <span className="pill-label">Pending</span>
            </div>
          </div>
        </div>
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actionButton={
          !readOnly ? (
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
          ) : undefined
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={items}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyIcon={<CalendarIcon size={26} />}
          searchTerm={searchTerm}
          emptyTitle={searchTerm ? `No touchpoints matching "${searchTerm}"` : 'No schedule touchpoints found'}
          emptyMessage={
            searchTerm
              ? `We couldn't find any touchpoints matching "${searchTerm}". Try checking your spelling or clear your filters.`
              : 'No touchpoint items exist for this cycle. Auto-generate slots to allocate touchpoints across available project agents.'
          }
          emptyAction={
            !readOnly ? (
              <Button
                size="sm"
                variant="primary"
                leftIcon={<RefreshIcon size={14} />}
                onClick={handleAutoGenerate}
                isLoading={isGenerating}
              >
                Auto-generate Slots
              </Button>
            ) : undefined
          }
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
          {/* Plan Duration Presets */}
          <div className="mb-3">
            <label className="input-label block mb-1.5 text-xs font-semibold text-dark">Plan Duration Period</label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className={`btn btn-sm ${durationPreset === '3' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handlePresetSelect('3')}
              >
                3 Days (Sprint)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${durationPreset === '5' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handlePresetSelect('5')}
              >
                5 Days (Workweek)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${durationPreset === '7' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handlePresetSelect('7')}
              >
                7 Days (Full Week)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${durationPreset === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handlePresetSelect('custom')}
              >
                Custom Range
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-1">
            <Input
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />

            <Input
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDurationPreset('custom');
              }}
            />
          </div>

          <p className="text-xs text-muted mb-3">
            {startDate && endDate
              ? `Coverage period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
              : 'Select start and end dates for this coverage cycle.'}
          </p>

          <Input
            label="Cycle Notes & Operational Priorities"
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
