import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { schedulesApi } from '../../api/schedulesApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { ClockIcon, MessageSquareIcon, AlertCircleIcon, TrendingUpIcon } from '../../components/icons/Icons';
import type { SupportAssignment, WeeklySchedule } from '../../types';

export interface TeamOperationsPageProps {
  onNavigateToAssignments?: () => void;
  onNavigateToPlanner?: () => void;
}

export const TeamOperationsPage: React.FC<TeamOperationsPageProps> = ({
  onNavigateToAssignments,
  onNavigateToPlanner,
}) => {
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule | null>(null);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const [schedResult, assignResult] = await Promise.allSettled([
        schedulesApi.getCurrentSchedule(),
        assignmentsApi.getAssignments({ pageSize: 10 }),
      ]);

      if (schedResult.status === 'fulfilled') {
        setCurrentSchedule(schedResult.value);
      }
      if (assignResult.status === 'fulfilled') {
        setAssignments(assignResult.value.items || []);
      }
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to synchronize latest team operations data.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate delivery stats from real data
  const totalPlanned = currentSchedule?.totalItems || 0;
  const completed = currentSchedule?.completedItems || 0;
  const pending = currentSchedule?.pendingItems || 0;
  const skipped = currentSchedule?.skippedItems || 0;
  const completionRate = totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0;
  const activeAssignmentsCount = assignments.filter((a) => a.isActive).length;
  const uniqueProjectsCount = new Set(assignments.map((a) => a.projectId)).size;

  return (
    <div className="team-operations-view">
      {/* Page Title & Subtitle Banner */}
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">
            Operations & Quality Performance
          </h1>
          <p className="main-page-subtitle">
            Customer support delivery, team member allocation, and operational schedule execution.
          </p>
        </div>

        <div className="headline-actions">
          <div className="pill-date-button">
            <span>📅</span>
            <span>{currentSchedule ? `Week ${currentSchedule.weekNumber}, ${currentSchedule.year}` : 'Current Week'}</span>
          </div>
        </div>
      </div>

      {pageError && (
        <Alert
          variant="warning"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
          action={
            <Button size="sm" variant="outline" onClick={loadData}>
              Retry Connection
            </Button>
          }
        />
      )}

      {/* 4 KPI Summary Cards Row */}
      <div className="kpi-cards-grid">
        <StatCard
          label="Weekly completion"
          value={`${completionRate}%`}
          chartVariant="amber"
          subtext={`${completed} of ${totalPlanned} touchpoints completed`}
          subtextColor="muted"
        />
        <StatCard
          label="Open touchpoints"
          value={String(pending)}
          chartVariant="teal"
          subtext="Pending in specialist queue"
          subtextColor="accent"
        />
        <StatCard
          label="Active team assignments"
          value={String(activeAssignmentsCount)}
          subtext="Allocated agent-project pairs"
          icon={<AlertCircleIcon size={16} />}
        />
        <StatCard
          label="Supported customer projects"
          value={String(uniqueProjectsCount)}
          subtext="Across active client tenants"
          icon={<TrendingUpIcon size={16} />}
        />
      </div>

      {/* Real Operational Metrics Sub-row */}
      <div className="grid grid-cols-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <ClockIcon size={15} className="text-accent" />
            <span className="text-xs font-semibold text-muted">Weekly Schedule Cycle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">{currentSchedule ? `Week ${currentSchedule.weekNumber}` : '—'}</span>
            <span className="text-xs text-muted font-semibold">{currentSchedule?.statusName || 'No cycle'}</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareIcon size={15} className="text-primary" />
            <span className="text-xs font-semibold text-muted">Completed Touchpoints</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">{completed}</span>
            <span className="text-xs text-success font-semibold">Logged</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUpIcon size={15} className="text-accent" />
            <span className="text-xs font-semibold text-muted">Pending Delivery</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">{pending}</span>
            <span className="text-xs text-muted font-semibold">Scheduled</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircleIcon size={15} className="text-danger" />
            <span className="text-xs font-semibold text-muted">Deferred / Skipped</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">{skipped}</span>
            <span className="text-xs text-muted font-semibold">Touchpoints</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 2/3 Active Assignments, Right 1/3 Schedule Overview */}
      <div className="operations-split-grid">
        {/* Active Assignments Card */}
        <div className="dashboard-card agent-delivery-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Active Team Member Allocations</h3>
              <p className="card-subtitle">
                Project assignments and client coverage for your specialists.
              </p>
            </div>
            {onNavigateToAssignments && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToAssignments}
              >
                Manage assignments
              </Button>
            )}
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>SUPPORT AGENT</th>
                  <th>ASSIGNED PROJECT</th>
                  <th>MODULE / SCOPE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        compact
                        title="No active assignments"
                        description={isLoading ? 'Loading operational telemetry...' : 'No team member assignments configured yet.'}
                      />
                    </td>
                  </tr>
                ) : (
                  assignments.slice(0, 8).map((assign) => (
                  <tr key={assign.id}>
                    <td>
                      <div className="agent-cell">
                        <span className="agent-avatar">
                          {(assign.userFullName || assign.userName || 'U').charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="agent-name">{assign.userFullName || assign.userName}</div>
                          <div className="agent-role text-xs text-muted">{assign.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-dark">{assign.projectName}</td>
                    <td className="text-sm text-muted">{assign.moduleName || 'Entire Project'}</td>
                    <td>
                      <Badge variant={assign.isActive ? 'success' : 'neutral'} dot size="sm">
                        {assign.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Current Schedule Summary Card */}
        <div className="dashboard-card escalation-feed-card">
          <div className="card-header-with-badge">
            <div>
              <h3 className="card-title">Weekly Schedule Status</h3>
              <p className="card-subtitle">Current cycle operational health</p>
            </div>
            {currentSchedule && (
              <Badge variant={currentSchedule.status === 1 ? 'success' : 'neutral'} size="sm" dot>
                {currentSchedule.statusName}
              </Badge>
            )}
          </div>

          <div className="escalation-items-list mt-3">
            {currentSchedule ? (
              <div className="p-3 border rounded-md" style={{ background: 'var(--surface-subtle, rgba(255, 255, 255, 0.02))' }}>
                <div className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Cycle Window</div>
                <div className="font-semibold text-dark text-sm">
                  {new Date(currentSchedule.weekStartDate).toLocaleDateString()} — {new Date(currentSchedule.weekEndDate).toLocaleDateString()}
                </div>
                <div className="mt-3 flex justify-between text-xs text-muted border-t pt-2">
                  <span>Total Touchpoints</span>
                  <span className="font-bold text-dark">{currentSchedule.totalItems}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>Completed</span>
                  <span className="font-bold text-success">{currentSchedule.completedItems}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>Pending</span>
                  <span className="font-bold text-primary">{currentSchedule.pendingItems}</span>
                </div>
                {currentSchedule.notes && (
                  <div className="mt-2 text-xs text-muted italic border-t pt-1">
                    "{currentSchedule.notes}"
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                compact
                title="No active schedule"
                description="No weekly schedule cycle is currently running. Create one in the Schedule Planner."
              />
            )}
          </div>

          <div className="card-footer-link">
            <button
              type="button"
              className="btn-link text-accent font-semibold text-xs"
              onClick={onNavigateToPlanner}
            >
              Open Schedule Planner &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
