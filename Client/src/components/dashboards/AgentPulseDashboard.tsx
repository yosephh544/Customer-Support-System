import React, { useMemo } from 'react';
import type { ScheduleItem, SupportAssignment } from '../../types';
import {
  isCompletedTouchpoint,
  isPendingTouchpoint,
  isSkippedTouchpoint,
} from '../../types';
import { CheckIcon, ClockIcon, HeadphonesIcon, StarIcon } from '../icons/Icons';
import { BarChart, GaugeChart, HBarList } from '../charts/Charts';
import { KpiTile, Panel, StatusPill } from './DashboardKit';

export interface AgentPulseDashboardProps {
  items?: ScheduleItem[];
  assignments?: SupportAssignment[];
  avgRating?: number | null;
  reviewCount?: number;
  weekLabel?: string;
  onNavigateToTouchpoints?: () => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AgentPulseDashboard: React.FC<AgentPulseDashboardProps> = ({
  items = [],
  assignments = [],
  avgRating = null,
  reviewCount = 0,
  weekLabel = 'Current week',
  onNavigateToTouchpoints,
}) => {
  const metrics = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let skipped = 0;

    items.forEach((item) => {
      if (isCompletedTouchpoint(item.status)) completed += 1;
      else if (isSkippedTouchpoint(item.status)) skipped += 1;
      else pending += 1;
    });

    const total = items.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const daily = DAY_NAMES.map((label) => ({ label, planned: 0, completed: 0 }));
    items.forEach((item) => {
      if (!item.scheduledDate) return;
      const date = new Date(item.scheduledDate);
      if (Number.isNaN(date.getTime())) return;
      const index = (date.getDay() + 6) % 7;
      daily[index].planned += 1;
      if (isCompletedTouchpoint(item.status)) daily[index].completed += 1;
    });

    const todayIndex = (new Date().getDay() + 6) % 7;
    const dailyBars = daily.map((day, index) => ({
      label: day.label,
      value: day.planned > 0 ? Math.round((day.completed / day.planned) * 100) : 0,
      color:
        day.planned === 0
          ? 'var(--border-strong)'
          : day.completed / day.planned >= 0.9
          ? '#10B981'
          : day.completed / day.planned >= 0.7
          ? '#F59E0B'
          : '#EF4444',
      highlight: index === todayIndex,
    }));

    const nextCalls = items
      .filter((item) => isPendingTouchpoint(item.status))
      .sort((a, b) => {
        const aTime = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 5);

    const projectCounts = new Map<string, number>();
    items
      .filter((item) => isPendingTouchpoint(item.status))
      .forEach((item) => {
        const project = item.projectName || 'General support';
        projectCounts.set(project, (projectCounts.get(project) ?? 0) + 1);
      });

    const queueByProject = Array.from(projectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([project, count]) => ({
        id: project,
        label: project,
        sub: `${count} pending contact${count === 1 ? '' : 's'}`,
        value: count,
        valueLabel: `${count}`,
        color: 'var(--pl-accent)',
      }));

    const latestRemark = items
      .filter((item) => item.notes && item.notes.trim().length > 0)
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.scheduledDate || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.scheduledDate || b.createdAt || 0).getTime();
        return bTime - aTime;
      })[0]?.notes;

    const activeAssignments = assignments.filter((assignment) => assignment.isActive).length;
    const activeDays = dailyBars.filter((day) => day.value > 0).length;

    const today = daily[todayIndex];
    const todayCompleted = today.completed;
    const todayPlanned = today.planned;
    const todayRate = todayPlanned > 0 ? Math.round((todayCompleted / todayPlanned) * 100) : 0;

    return {
      total,
      completed,
      pending,
      skipped,
      rate,
      dailyBars,
      nextCalls,
      queueByProject,
      latestRemark,
      activeAssignments,
      activeDays,
      todayCompleted,
      todayPlanned,
      todayRate,
    };
  }, [items, assignments]);

  return (
    <div className="pulse-dashboard pl-role-agent">
      <div className="pl-context">
        <span className="pl-context-left">
          <span className="pl-live-dot" />
          <strong>Live</strong>
          <span>{weekLabel} execution and call queue</span>
        </span>
        <span className="pl-context-note">{metrics.activeAssignments} active assignments</span>
      </div>

      <div className="pl-kpis">
        <KpiTile
          label="Assigned touchpoints"
          value={metrics.total}
          icon={<HeadphonesIcon size={14} />}
          sub={`${metrics.activeAssignments} active project assignments`}
          spark={metrics.dailyBars.map((day) => day.value)}
        />
        <KpiTile
          label="Completed"
          value={metrics.completed}
          icon={<CheckIcon size={14} />}
          delta={{
            text: `${metrics.rate}% completion`,
            tone: metrics.rate >= 90 ? 'good' : metrics.rate >= 70 ? 'warn' : 'bad',
          }}
          sub={`${metrics.activeDays} active days this week`}
        />
        <KpiTile
          label="Pending calls"
          value={metrics.pending}
          icon={<ClockIcon size={14} />}
          delta={{
            text: metrics.pending > 0 ? 'In queue' : 'Queue clear',
            tone: metrics.pending > 0 ? 'warn' : 'good',
          }}
          sub={`${metrics.skipped} skipped this cycle`}
        />
        <KpiTile
          label="Avg client rating"
          value={avgRating !== null ? avgRating.toFixed(1) : '—'}
          unit={avgRating !== null ? '/ 5' : undefined}
          icon={<StarIcon size={14} />}
          delta={
            avgRating !== null
              ? {
                  text: avgRating >= 4.5 ? 'Strong CSAT' : 'Needs focus',
                  tone: avgRating >= 4.5 ? 'good' : avgRating >= 4 ? 'warn' : 'bad',
                }
              : { text: 'No reviews yet', tone: 'flat' }
          }
          sub={reviewCount > 0 ? `${reviewCount} customer reviews` : 'Awaiting first customer review'}
        />
      </div>

      <div className="pl-grid">
        <Panel
          span={4}
          title="Today's progress"
          subtitle="Calls completed against today's schedule"
          meta={`${metrics.todayCompleted}/${metrics.todayPlanned} today`}
        >
          <GaugeChart
            value={metrics.todayRate}
            color="#0D9488"
            colorEnd="#22C55E"
            label="Complete"
            caption={metrics.todayPlanned > 0 ? 'Today’s execution' : 'No calls today'}
          />
          <div className="pl-gauge-note">
            <span>
              <strong>{metrics.todayCompleted}</strong> of {metrics.todayPlanned} done today
            </span>
            <span>
              <strong>{metrics.pending}</strong> pending overall
            </span>
            {onNavigateToTouchpoints && (
              <button type="button" className="pl-inline-link" onClick={onNavigateToTouchpoints}>
                Open queue
              </button>
            )}
          </div>
        </Panel>

        <Panel
          span={8}
          title="This week"
          subtitle="Daily completion rate for your scheduled touchpoints"
          meta="Mon – Sun"
        >
          <BarChart
            data={metrics.dailyBars}
            max={100}
            suffix="%"
            formatValue={(value) => `${value}%`}
          />
        </Panel>

        <Panel
          span={7}
          title="Next touchpoints"
          subtitle="Your upcoming calls, soonest first"
          meta={`${metrics.pending} pending`}
        >
          {metrics.nextCalls.length === 0 ? (
            <div className="pl-empty">No pending calls. Your queue is complete.</div>
          ) : (
            <ul className="pl-list">
              {metrics.nextCalls.map((item) => (
                <li key={item.id} className="pl-list-row">
                  <span className="pl-list-avatar">
                    {(item.organizationName || 'C').charAt(0).toUpperCase()}
                  </span>
                  <div className="pl-list-main">
                    <div className="pl-list-title">{item.organizationName || 'Client'}</div>
                    <div className="pl-list-sub">
                      {item.projectName || 'Project'} · {item.contactPersonName || 'Contact'}
                    </div>
                  </div>
                  <div className="pl-list-side">
                    <StatusPill tone="accent">Pending</StatusPill>
                    <span>
                      {item.scheduledDate
                        ? new Date(item.scheduledDate).toLocaleDateString()
                        : 'Unscheduled'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          span={5}
          title="Queue by project"
          subtitle="Where your pending contacts are concentrated"
          meta={`${metrics.queueByProject.length} projects`}
        >
          <HBarList
            items={metrics.queueByProject}
            emptyText="No pending contacts across your projects."
          />
          {metrics.latestRemark && (
            <div className="pl-quote">"{metrics.latestRemark}"</div>
          )}
        </Panel>
      </div>
    </div>
  );
};
