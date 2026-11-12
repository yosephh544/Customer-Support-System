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

  // Calculate delivery stats
  const totalPlanned = currentSchedule?.totalSlots || 120;
  const completed = currentSchedule?.completedSlots || 106;
  const completionRate = Math.round((completed / (totalPlanned || 1)) * 100);

  // Delivery signals for active agents
  const agentSignals = [
    {
      name: 'Aisha Patel',
      role: 'Senior Specialist',
      planned: 24,
      completed: 20,
      rate: '83%',
      rating: '4.7',
      issues: 1,
    },
    {
      name: 'Marcus Reed',
      role: 'Support Specialist',
      planned: 22,
      completed: 21,
      rate: '95%',
      rating: '4.6',
      issues: 0,
    },
    {
      name: 'Elena Rossi',
      role: 'Implementation Specialist',
      planned: 26,
      completed: 19,
      rate: '73%',
      rating: '4.2',
      issues: 3,
    },
    {
      name: 'Noah Williams',
      role: 'Customer Success',
      planned: 24,
      completed: 23,
      rate: '96%',
      rating: '4.5',
      issues: 1,
    },
  ];

  return (
    <div className="team-operations-view">
      {/* Page Title & Subtitle Banner */}
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">
            Operations & Quality Performance
          </h1>
          <p className="main-page-subtitle">
            Customer support delivery, SLA monitoring, and blocker resolution across your team.
          </p>
        </div>

        <div className="headline-actions">
          <div className="pill-date-button">
            <span>📅</span>
            <span>Current week cycle</span>
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

      {/* 4 KPI Summary Cards Row (matching the YAOUWIZ reference design) */}
      <div className="kpi-cards-grid">
        <StatCard
          label="Weekly completion"
          value={`${completionRate}%`}
          trend="+2.11%"
          trendDirection="up"
          chartVariant="amber"
          subtext={`${completed} of ${totalPlanned} tickets completed`}
          subtextColor="muted"
        />
        <StatCard
          label="Open touchpoints"
          value={String(totalPlanned - completed)}
          trend="-1.74%"
          trendDirection="down"
          chartVariant="teal"
          subtext="Active in specialist queue"
          subtextColor="accent"
        />
        <StatCard
          label="Active blockers"
          value="2"
          subtext="Requires leadership intervention"
          subtextColor="danger"
          icon={<AlertCircleIcon size={16} />}
        />
        <StatCard
          label="Average CSAT"
          value="4.6"
          subValue="/ 5"
          trend="+0.2"
          trendDirection="up"
          subtext="Across 18 customer reviews"
          subtextColor="success"
        />
      </div>

      {/* SLA Benchmarks Sub-row */}
      <div className="grid grid-cols-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <ClockIcon size={15} className="text-accent" />
            <span className="text-xs font-semibold text-muted">First Response SLA</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">18 mins</span>
            <span className="text-xs text-success font-semibold">98.2% on target</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareIcon size={15} className="text-primary" />
            <span className="text-xs font-semibold text-muted">Avg. Resolution Time</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">3.4 hrs</span>
            <span className="text-xs text-success font-semibold">-24m vs last week</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUpIcon size={15} className="text-accent" />
            <span className="text-xs font-semibold text-muted">First Contact Resolution</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">89%</span>
            <span className="text-xs text-muted font-semibold">Tier-1 resolved</span>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '12px 16px' }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircleIcon size={15} className="text-danger" />
            <span className="text-xs font-semibold text-muted">Escalation Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-dark">2.4%</span>
            <span className="text-xs text-success font-semibold">Low volatility</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 2/3 Agent Delivery, Right 1/3 Escalations */}
      <div className="operations-split-grid">
        {/* Agent Delivery Card */}
        <div className="dashboard-card agent-delivery-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Agent delivery & workload</h3>
              <p className="card-subtitle">
                Completion rates and satisfaction signals for active specialists.
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
                  <th>PLANNED</th>
                  <th>COMPLETED</th>
                  <th>RATE</th>
                  <th>RATING</th>
                  <th>OPEN ISSUES</th>
                </tr>
              </thead>
              <tbody>
                {agentSignals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        compact
                        title="No agent signals"
                        description={isLoading ? 'Loading operational telemetry...' : 'No active agent activity records found for this period.'}
                      />
                    </td>
                  </tr>
                ) : (
                  agentSignals.map((agent) => (
                  <tr key={agent.name}>
                    <td>
                      <div className="agent-cell">
                        <span className="agent-avatar">
                          {agent.name.charAt(0)}
                        </span>
                        <div>
                          <div className="agent-name">{agent.name}</div>
                          <div className="agent-role">{agent.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-dark">{agent.planned}</td>
                    <td className="font-medium text-dark">{agent.completed}</td>
                    <td>
                      <span
                        className={`font-bold ${
                          parseInt(agent.rate) >= 90
                            ? 'text-success'
                            : parseInt(agent.rate) < 80
                            ? 'text-danger'
                            : 'text-accent'
                        }`}
                      >
                        {agent.rate}
                      </span>
                    </td>
                    <td className="font-semibold text-dark">⭐ {agent.rating}</td>
                    <td>
                      {agent.issues > 0 ? (
                        <span className="badge badge-danger">
                          {agent.issues} blocker
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          Clear
                        </span>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Escalation Feed Card */}
        <div className="dashboard-card escalation-feed-card">
          <div className="card-header-with-badge">
            <div>
              <h3 className="card-title">Escalation & blocker feed</h3>
              <p className="card-subtitle">Urgent customer issues requiring action</p>
            </div>
            <Badge variant="danger" size="sm" dot>
              2 active
            </Badge>
          </div>

          <div className="escalation-items-list mt-3">
            {/* Blocker 1 */}
            <div className="escalation-item">
              <div className="escalation-header">
                <span className="ticket-ref-pill">#TKT-1042</span>
                <Badge variant="blocker" size="sm">
                  Blocker
                </Badge>
              </div>
              <div className="font-semibold text-dark mt-1">Invoice export sync failures</div>
              <div className="escalation-account">
                Northwind Logistics · Billing API Module
              </div>
              <div className="escalation-owner">
                Owner: Platform Team · Update due today 17:00
              </div>
            </div>

            {/* Blocker 2 */}
            <div className="escalation-item">
              <div className="escalation-header">
                <span className="ticket-ref-pill">#TKT-1088</span>
                <Badge variant="high" size="sm">
                  High Priority
                </Badge>
              </div>
              <div className="font-semibold text-dark mt-1">Claims report data pipeline latency</div>
              <div className="escalation-account">
                Aster Health Group · Claims Hub
              </div>
              <div className="escalation-owner">
                Owner: Elena Rossi · Update due today 15:00
              </div>
            </div>
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
