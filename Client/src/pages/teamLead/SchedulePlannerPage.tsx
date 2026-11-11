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

  // Modal
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const res = await schedulesApi.getSchedules({ pageSize: 20 });
      setSchedules(res.items || []);
      if (res.items && res.items.length > 0 && !selectedSchedule) {
        setSelectedSchedule(res.items[0]);
      }
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedSchedule) {
      loadScheduleItems(selectedSchedule.id);
    }
  }, [selectedSchedule, page, pageSize, searchTerm]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSched = await schedulesApi.createSchedule({
        weekStartDate: startDate ? new Date(startDate).toISOString() : undefined,
        notes: notes.trim(),
      });
      setIsNewCycleModalOpen(false);
      setStartDate('');
      setNotes('');
      await loadSchedules();
      setSelectedSchedule(newSched);
    } catch (err: any) {
      alert(err.message || 'Failed to create weekly schedule.');
    }
  };

  const handleGenerateTouchpoints = async () => {
    if (!selectedSchedule) return;
    setIsGenerating(true);
    try {
      const updated = await schedulesApi.generateTouchpoints(selectedSchedule.id);
      setSelectedSchedule(updated);
      loadScheduleItems(updated.id);
      loadSchedules();
      alert(`Touchpoints generated successfully for Week ${updated.weekNumber}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to generate touchpoints.');
    } finally {
      setIsGenerating(false);
    }
  };

  const columns: Column<ScheduleItem>[] = [
    {
      key: 'assignedUser',
      header: 'ASSIGNED SPECIALIST',
      render: (i) => (
        <div className="agent-cell">
          <span className="agent-avatar">{i.assignedUserFullName.charAt(0) || 'A'}</span>
          <div>
            <div className="font-semibold text-dark">{i.assignedUserFullName}</div>
            <div className="text-xs text-muted">{i.assignedUserName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'CUSTOMER CONTACT',
      render: (i) => (
        <div>
          <div className="font-medium text-dark">{i.contactPersonName}</div>
          <div className="text-xs text-muted">
            {i.organizationName} {i.projectName ? `· ${i.projectName}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'SCHEDULED DATE',
      render: (i) => (
        <span className="text-sm font-medium">
          {i.scheduledDate ? new Date(i.scheduledDate).toLocaleDateString() : 'Unscheduled'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'EXECUTION STATUS',
      render: (i) => {
        const variant = i.status === 1 ? 'success' : i.status === 2 ? 'neutral' : 'warning';
        return <Badge variant={variant} dot>{i.statusName}</Badge>;
      },
    },
    {
      key: 'notes',
      header: 'NOTES / OUTCOME',
      render: (i) => (
        <span className="text-xs text-muted">
          {i.notes || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="schedule-planner-page">
      <div className="page-header-row">
        <div>
          <h2 className="section-title">Weekly Schedule Planner</h2>
          <p className="section-subtitle">
            Organize weekly customer touchpoints and balance delivery workload across specialists.
          </p>
        </div>

        <div className="header-actions">
          <Button
            variant="outline"
            leftIcon={<PlusIcon size={18} />}
            onClick={() => setIsNewCycleModalOpen(true)}
          >
            New weekly cycle
          </Button>
          {selectedSchedule && (
            <Button
              variant="primary"
              leftIcon={<RefreshIcon size={18} />}
              isLoading={isGenerating}
              onClick={handleGenerateTouchpoints}
            >
              Auto-generate touchpoints
            </Button>
          )}
        </div>
      </div>

      {/* Week Selector Ribbon */}
      <div className="week-selector-ribbon">
        <span className="ribbon-label">Planning cycles:</span>
        <div className="ribbon-items">
          {schedules.map((s) => {
            const isSelected = selectedSchedule?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`cycle-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedSchedule(s)}
              >
                <CalendarIcon size={15} />
                <span>Week {s.weekNumber}, {s.year}</span>
                <span className="chip-badge">{s.totalItems} items</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Schedule Header Summary */}
      {selectedSchedule && (
        <div className="schedule-summary-banner">
          <div className="banner-left">
            <h3>
              Week {selectedSchedule.weekNumber} · {new Date(selectedSchedule.weekStartDate).toLocaleDateString()} – {new Date(selectedSchedule.weekEndDate).toLocaleDateString()}
            </h3>
            <p className="text-muted text-sm mt-1">
              {selectedSchedule.notes || 'Weekly customer outreach schedule.'}
            </p>
          </div>
          <div className="banner-stats">
            <div className="stat-pill">
              <span className="pill-number">{selectedSchedule.totalItems}</span>
              <span className="pill-label">Total Touchpoints</span>
            </div>
            <div className="stat-pill">
              <span className="pill-number text-success">{selectedSchedule.completedItems}</span>
              <span className="pill-label">Completed</span>
            </div>
            <div className="stat-pill">
              <span className="pill-number text-warning">{selectedSchedule.pendingItems}</span>
              <span className="pill-label">Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Items Filter and Table */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search contact, agent, or account..."
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={items}
          keyExtractor={(i) => i.id}
          emptyMessage="No touchpoint items for this week. Click 'Auto-generate touchpoints' above to automatically populate this week based on active assignments."
        />
        <Pagination
          currentPage={page}
          totalCount={totalItemsCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create New Weekly Cycle Modal */}
      <Modal
        isOpen={isNewCycleModalOpen}
        onClose={() => setIsNewCycleModalOpen(false)}
        title="Create Weekly Planning Cycle"
        description="Pick a starting Monday or default to next upcoming week."
      >
        <form onSubmit={handleCreateCycle}>
          <Input
            label="Week Starting Date (Monday)"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            helperText="Leave empty to automatically schedule for the current/next week."
          />
          <Input
            label="Cycle Notes"
            placeholder="e.g. Focus on Q3 satisfaction and new module adoption"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewCycleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Initialize Cycle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
