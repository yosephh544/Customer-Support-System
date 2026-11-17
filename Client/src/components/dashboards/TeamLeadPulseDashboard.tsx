import React, { useMemo } from 'react';
import type { WeeklySchedule, ScheduleItem } from '../../types';
import {
  isCompletedTouchpoint,
  isPendingTouchpoint,
  isSkippedTouchpoint,
} from '../../types';
import type { AgentPerformanceData } from '../common/AgentPerformanceGraph';
import { CalendarIcon, CheckIcon, ClockIcon, StarIcon } from '../icons/Icons';
import { BarChart, DonutChart, HBarList } from '../charts/Charts';
import { KpiTile, Panel, StatusPill } from './DashboardKit';
import { rateColor } from './dashboardUtils';

export interface TeamLeadPulseDashboardProps {
  currentSchedule?: WeeklySchedule | null;
  scheduleItems?: ScheduleItem[];
  agentPerformanceData?: AgentPerformanceData[];
  csatScore?: number | null;
  reviewCount?: number;
  onNavigateToAssignments?: () => void;
  onNavigateToPlanner?: () => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TeamLeadPulseDashboard: React.FC<TeamLeadPulseDashboardProps> = ({
  currentSchedule,
  scheduleItems = [],
  agentPerformanceData = [],
  csatScore = null,
  reviewCount = 0,
  onNavigateToAssignments,
  onNavigateToPlanner,
}) => {
  const metrics = useMemo(() => {
    const now = new Date().getTime();
    let completed = 0;
    let pending = 0;
    let skipped = 0;
    let overdue = 0;

    scheduleItems.forEach((item) => {
      if (isCompletedTouchpoint(item.status)) {
        completed += 1;
      } else if (isSkippedTouchpoint(item.status)) {
        skipped += 1;
      } else if (isPendingTouchpoint(item.status)) {
        pending += 1;
        if (item.scheduledDate && new Date(item.scheduledDate).getTime() < now) {
          overdue += 1;
        }
      }
    });

    const total =
      scheduleItems.length > 0
        ? scheduleItems.length
        : currentSchedule?.totalItems || 0;
    const completedTotal =
      scheduleItems.length > 0 ? completed : currentSchedule?.completedItems || 0;
    const pendingTotal =
      scheduleItems.length > 0 ? pending : currentSchedule?.pendingItems || 0;
    const skippedTotal =
      scheduleItems.length > 0 ? skipped : currentSchedule?.skippedItems || 0;
    const rate = total > 0 ? Math.round((completedTotal / total) * 100) : 0;

    const daily = DAY_NAMES.map((label) => ({ label, planned: 0, completed: 0 }));
    scheduleItems.forEach((item) => {
      if (!item.scheduledDate) return;
      const date = new Date(item.scheduledDate);
      if (Number.isNaN(date.getTime())) return;
      const index = (date.getDay() + 6) % 7;
      daily[index].planned += 1;
      if (isCompletedTouchpoint(item.status)) daily[index].completed += 1;
    });

    const todayIndex = (new Date().getDay() + 6) % 7;
    const dailyBars = daily.map((day, index) => {
      const dayRate = day.planned > 0 ? Math.round((day.completed / day.planned) * 100) : 0;
      return {
        label: day.label,
        value: dayRate,
        color: day.planned > 0 ? rateColor(dayRate) : 'var(--border-strong)',
        highlight: index === todayIndex,
      };
    });

    const attention = scheduleItems
      .filter((item) => {
        if (!isPendingTouchpoint(item.status)) return false;
        const isOverdue = item.scheduledDate
          ? new Date(item.scheduledDate).getTime() < now
          : false;
        const priority = String((item as { priority?: string }).priority ?? '').toLowerCase();
        const isHighPriority = /crit|block|high/.test(priority);
        return isOverdue || isHighPriority;
      })
      .sort((a, b) => {
        const aTime = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 5);

    const rankedAgents = [...agentPerformanceData]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 6);

    return {
      total,
      completed: completedTotal,
      pending: pendingTotal,
      skipped: skippedTotal,
      overdue,
      rate,
      dailyBars,
      attention,
      rankedAgents,
      now,
    };
  }, [scheduleItems, currentSchedule, agentPerformanceData]);

  const statusSegments = [
    { label: 'Completed', value: metrics.completed, color: '#10B981' },
    { label: 'Pending', value: metrics.pending, color: '#F59E0B' },
    { label: 'Skipped', value: metrics.skipped, color: '#EF4444' },
  ];

  const agentItems = metrics.rankedAgents.map((agent) => ({
    id: agent.agentId,
    label: agent.agentName,
    sub: `${agent.completed}/${agent.totalAssigned} touchpoints`,
    value: agent.completionRate,
    valueLabel: `${agent.completionRate}%`,
    color: rateColor(agent.completionRate),
  }));

  const weekLabel = currentSchedule
    ? `Week ${currentSchedule.weekNumber}, ${currentSchedule.year}`
    : 'Current week';

  return (
    <div className="pulse-dashboard pl-role-teamlead">
      <div className="pl-context">
        <span className="pl-context-left">
          <span className="pl-live-dot" />
          <strong>Live</strong>
          <span>{weekLabel} execution</span>
        </span>
        <span className="pl-context-note">{agentPerformanceData.length} specialists</span>
      </div>

      <div className="pl-kpis">
        <KpiTile
          label="Weekly completion"
          value={`${metrics.rate}%`}
          icon={<CheckIcon size={14} />}
          delta={{
            text: `${metrics.rate >= 85 ? '+' : ''}${metrics.rate - 85} pts vs target`,
            tone: metrics.rate >= 85 ? 'good' : metrics.rate >= 70 ? 'warn' : 'bad',
          }}
          sub="Target 85%"
          spark={metrics.dailyBars.map((day) => day.value)}
        />
        <KpiTile
          label="Touchpoints delivered"
          value={metrics.completed}
          unit={`/ ${metrics.total}`}
          icon={<CalendarIcon size={14} />}
          sub={`${metrics.pending} still in queue`}
        />
        <KpiTile
          label="Overdue contacts"
          value={metrics.overdue}
          icon={<ClockIcon size={14} />}
          delta={{
            text: metrics.overdue > 0 ? 'Action required' : 'Clear',
            tone: metrics.overdue > 0 ? 'bad' : 'good',
          }}
          sub="Past their scheduled window"
        />
        <KpiTile
          label="Team CSAT"
          value={csatScore !== null ? csatScore.toFixed(1) : '—'}
          unit={csatScore !== null ? '/ 5' : undefined}
          icon={<StarIcon size={14} />}
          delta={
            csatScore !== null
              ? {
                  text: csatScore >= 4.5 ? 'Above target' : 'Below target',
                  tone: csatScore >= 4.5 ? 'good' : csatScore >= 4 ? 'warn' : 'bad',
                }
              : { text: 'No reviews yet', tone: 'flat' }
          }
          sub={reviewCount > 0 ? `${reviewCount} customer reviews` : 'Awaiting first review'}
        />
      </div>

      <div className="pl-grid">
        <Panel
          span={7}
          title="Daily execution"
          subtitle="Completion rate for each scheduled day this week"
          meta="Target 85%"
        >
          <BarChart
            data={metrics.dailyBars}
            max={100}
            suffix="%"
            formatValue={(value) => `${value}%`}
          />
        </Panel>

        <Panel
          span={5}
          title="Delivery status"
          subtitle="Composition of this week's planned touchpoints"
          meta={`${metrics.total} planned`}
        >
          <DonutChart
            segments={statusSegments}
            centerValue={`${metrics.rate}%`}
            centerLabel="Complete"
          />
        </Panel>

        <Panel
          span={7}
          title="Specialist completion"
          subtitle="Ranked by touchpoints delivered this week"
          meta={
            onNavigateToAssignments ? (
              <button type="button" className="pl-inline-link" onClick={onNavigateToAssignments}>
                Manage rosters
              </button>
            ) : (
              `${metrics.rankedAgents.length} specialists`
            )
          }
        >
          <HBarList
            items={agentItems}
            max={100}
            emptyText="No specialist activity recorded for this cycle."
          />
        </Panel>

        <Panel
          span={5}
          title="Overdue & blockers"
          subtitle="Contacts that need team-lead intervention"
          meta={
            onNavigateToPlanner ? (
              <button type="button" className="pl-inline-link" onClick={onNavigateToPlanner}>
                Open planner
              </button>
            ) : (
              `${metrics.attention.length} items`
            )
          }
        >
          {metrics.attention.length === 0 ? (
            <div className="pl-empty">No overdue or high-priority contacts. The queue is clear.</div>
          ) : (
            <ul className="pl-list">
              {metrics.attention.map((item) => {
                const isOverdue = item.scheduledDate
                  ? new Date(item.scheduledDate).getTime() < metrics.now
                  : false;
                return (
                  <li key={item.id} className="pl-list-row">
                    <span className="pl-list-avatar">
                      {(item.organizationName || 'C').charAt(0).toUpperCase()}
                    </span>
                    <div className="pl-list-main">
                      <div className="pl-list-title">{item.organizationName || 'Client'}</div>
                      <div className="pl-list-sub">
                        {item.projectName || 'Project'} ·{' '}
                        {item.scheduledDate
                          ? new Date(item.scheduledDate).toLocaleDateString()
                          : 'Unscheduled'}
                      </div>
                    </div>
                    <div className="pl-list-side">
                      <StatusPill tone={isOverdue ? 'bad' : 'warn'}>
                        {isOverdue ? 'Overdue' : 'High priority'}
                      </StatusPill>
                      <span>{item.assignedUserFullName || item.assignedUserName || 'Unassigned'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};
