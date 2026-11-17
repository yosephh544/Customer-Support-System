import React, { useMemo } from 'react';
import type {
  Feedback,
  FeedbackAnalytics,
  Project,
  ProjectModule,
  ScheduleItem,
  WeeklySchedule,
} from '../../types';
import {
  isActiveProject,
  isCompletedProject,
  isCompletedTouchpoint,
} from '../../types';
import type { AgentPerformanceData } from '../common/AgentPerformanceGraph';
import { BuildingIcon, CheckIcon, ProjectIcon, StarIcon } from '../icons/Icons';
import { GaugeChart, HBarList, TrendChart } from '../charts/Charts';
import { KpiTile, Panel, StatusPill } from './DashboardKit';
import { rateColor } from './dashboardUtils';

export interface DirectorPulseDashboardProps {
  overallRate: number;
  completedTouchpoints: number;
  totalTouchpoints: number;
  averageCsat: string;
  positiveSentimentRate: number;
  reviewCount?: number;
  feedbacks?: Feedback[];
  feedbackAnalytics?: FeedbackAnalytics | null;
  schedules?: WeeklySchedule[];
  scheduleItems?: ScheduleItem[];
  agentPerformanceData?: AgentPerformanceData[];
  projects?: Project[];
  projectModulesMap?: Record<string, ProjectModule[]>;
  onNavigateToFeedback?: () => void;
  onNavigateToProjects?: () => void;
}

export const DirectorPulseDashboard: React.FC<DirectorPulseDashboardProps> = ({
  overallRate,
  completedTouchpoints,
  totalTouchpoints,
  averageCsat,
  positiveSentimentRate,
  reviewCount = 0,
  feedbacks = [],
  feedbackAnalytics,
  schedules = [],
  scheduleItems = [],
  agentPerformanceData = [],
  projects = [],
  projectModulesMap = {},
  onNavigateToFeedback,
  onNavigateToProjects,
}) => {
  const metrics = useMemo(() => {
    const weekBuckets = new Map<
      string,
      { year: number; week: number; planned: number; completed: number }
    >();
    schedules.forEach((schedule) => {
      if (!schedule.weekNumber || !schedule.year) return;
      const key = `${schedule.year}-${schedule.weekNumber}`;
      const bucket =
        weekBuckets.get(key) ?? {
          year: schedule.year,
          week: schedule.weekNumber,
          planned: 0,
          completed: 0,
        };
      bucket.planned += schedule.totalItems || 0;
      bucket.completed += schedule.completedItems || 0;
      weekBuckets.set(key, bucket);
    });

    let labels: string[];
    let values: number[];

    if (weekBuckets.size > 0) {
      const recent = Array.from(weekBuckets.values())
        .sort((a, b) => a.year - b.year || a.week - b.week)
        .slice(-6);
      labels = recent.map((bucket) => `W${bucket.week}`);
      values = recent.map((bucket) =>
        bucket.planned > 0 ? Math.round((bucket.completed / bucket.planned) * 100) : 0
      );
    } else {
      const buckets = new Map<string, { week: number; planned: number; completed: number }>();
      scheduleItems.forEach((item) => {
        if (!item.weekNumber || !item.year) return;
        const key = `${item.year}-${item.weekNumber}`;
        const bucket = buckets.get(key) ?? { week: item.weekNumber, planned: 0, completed: 0 };
        bucket.planned += 1;
        if (isCompletedTouchpoint(item.status)) bucket.completed += 1;
        buckets.set(key, bucket);
      });
      const recent = Array.from(buckets.values()).sort((a, b) => a.week - b.week).slice(-6);
      labels = recent.map((bucket) => `W${bucket.week}`);
      values = recent.map((bucket) =>
        bucket.planned > 0 ? Math.round((bucket.completed / bucket.planned) * 100) : 0
      );
    }

    const starDistribution = [
      { stars: 5, color: '#10B981' },
      { stars: 4, color: '#4F46E5' },
      { stars: 3, color: '#F59E0B' },
      { stars: 2, color: '#F97316' },
      { stars: 1, color: '#EF4444' },
    ].map(({ stars, color }) => ({
      stars,
      color,
      count:
        feedbackAnalytics?.ratingDistribution?.[stars] ??
        feedbacks.filter((feedback) => feedback.rating === stars).length,
    }));
    const totalRatings = starDistribution.reduce((sum, row) => sum + row.count, 0);
    const starRows = starDistribution.map((row) => ({
      id: `${row.stars}-star`,
      label: `${row.stars} star`,
      sub: `${row.count} review${row.count === 1 ? '' : 's'}`,
      value: totalRatings > 0 ? Math.round((row.count / totalRatings) * 100) : 0,
      valueLabel: `${totalRatings > 0 ? Math.round((row.count / totalRatings) * 100) : 0}%`,
      color: row.color,
    }));

    const projectRows = projects
      .map((project) => {
        const moduleCount = project.moduleCount || projectModulesMap[project.id]?.length || 0;
        const projectItems = scheduleItems.filter((item) => item.projectId === project.id);
        const completed = projectItems.filter((item) => isCompletedTouchpoint(item.status)).length;
        let rate = 0;
        if (projectItems.length > 0) {
          rate = Math.round((completed / projectItems.length) * 100);
        } else if (isCompletedProject(project.status)) {
          rate = 100;
        } else if (isActiveProject(project.status)) {
          rate = 0;
        }
        return {
          id: project.id,
          label: project.name,
          sub: `${project.organizationName || 'Client'} · ${moduleCount} modules`,
          value: rate,
          valueLabel: `${rate}%`,
          color: rateColor(rate),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const agentRows = [...agentPerformanceData]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 6)
      .map((agent) => ({
        id: agent.agentId,
        label: agent.agentName,
        sub: `${agent.completed}/${agent.totalAssigned} touchpoints`,
        value: agent.completionRate,
        valueLabel: `${agent.completionRate}%`,
        color: rateColor(agent.completionRate),
      }));

    const recentFeedback = [...feedbacks]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

    const activeProjects = projects.filter((project) => isActiveProject(project.status)).length;
    const clientCount = new Set(projects.map((project) => project.organizationId)).size;

    return {
      labels,
      values,
      starRows,
      projectRows,
      agentRows,
      recentFeedback,
      activeProjects,
      clientCount,
    };
  }, [schedules, scheduleItems, feedbacks, feedbackAnalytics, projects, projectModulesMap, agentPerformanceData]);

  const csatNumber = Number(averageCsat) || 0;
  const hasReviews = reviewCount > 0 && csatNumber > 0;
  const outstanding = Math.max(0, totalTouchpoints - completedTouchpoints);

  return (
    <div className="pulse-dashboard pl-role-director">
      <div className="pl-context">
        <span className="pl-context-left">
          <span className="pl-live-dot" />
          <strong>Live</strong>
          <span>portfolio delivery and customer sentiment</span>
        </span>
        <span className="pl-context-note">
          {projects.length} projects · {reviewCount} reviews
        </span>
      </div>

      <div className="pl-kpis">
        <KpiTile
          label="System completion"
          value={`${overallRate}%`}
          icon={<CheckIcon size={14} />}
          delta={{
            text: `${overallRate >= 90 ? '+' : ''}${overallRate - 90} pts vs target`,
            tone: overallRate >= 90 ? 'good' : overallRate >= 70 ? 'warn' : 'bad',
          }}
          sub="SLA target 90%"
          spark={metrics.values}
        />
        <KpiTile
          label="Touchpoints delivered"
          value={completedTouchpoints}
          unit={`/ ${totalTouchpoints}`}
          icon={<BuildingIcon size={14} />}
          sub={`${outstanding} outstanding this cycle`}
        />
        <KpiTile
          label="Client CSAT"
          value={hasReviews ? averageCsat : '—'}
          unit={hasReviews ? '/ 5' : undefined}
          icon={<StarIcon size={14} />}
          delta={
            hasReviews
              ? {
                  text: `${positiveSentimentRate}% positive`,
                  tone:
                    positiveSentimentRate >= 90 ? 'good' : positiveSentimentRate >= 75 ? 'warn' : 'bad',
                }
              : { text: 'No reviews yet', tone: 'flat' }
          }
          sub={hasReviews ? `${reviewCount} verified reviews` : 'Awaiting first customer review'}
        />
        <KpiTile
          label="Active projects"
          value={metrics.activeProjects}
          icon={<ProjectIcon size={14} />}
          sub={`${projects.length} total · ${metrics.clientCount} client accounts`}
        />
      </div>

      <div className="pl-grid">
        <Panel
          span={8}
          title="Delivery velocity"
          subtitle="Completion rate across the last six weekly cycles"
          meta="Target 90%"
        >
          <TrendChart
            series={[
              {
                label: 'Completion rate',
                color: 'var(--pl-accent)',
                values: metrics.values,
                fill: true,
              },
            ]}
            labels={metrics.labels}
            yMin={0}
            yMax={100}
            height={190}
          />
        </Panel>

        <Panel
          span={4}
          title="System health"
          subtitle="Enterprise-wide delivery adherence"
          meta={`${completedTouchpoints}/${totalTouchpoints}`}
        >
          <GaugeChart
            value={overallRate}
            color="#B45309"
            colorEnd="#F59E0B"
            label="SLA adherence"
            caption="Target 90%"
          />
          <div className="pl-gauge-note">
            <span>
              <strong>{positiveSentimentRate}%</strong> positive sentiment
            </span>
            <span>
              <strong>{outstanding}</strong> outstanding
            </span>
          </div>
        </Panel>

        <Panel
          span={6}
          title="Project health"
          subtitle="Delivery completion across the active portfolio"
          meta={
            onNavigateToProjects ? (
              <button type="button" className="pl-inline-link" onClick={onNavigateToProjects}>
                View projects
              </button>
            ) : (
              `${projects.length} projects`
            )
          }
        >
          <HBarList
            items={metrics.projectRows}
            max={100}
            emptyText="No customer projects deployed in the portfolio yet."
          />
        </Panel>

        <Panel
          span={6}
          title="CSAT distribution"
          subtitle="How customers rate the service experience"
          meta={`${positiveSentimentRate}% positive`}
        >
          <HBarList
            items={metrics.starRows}
            max={100}
            emptyText="No customer feedback recorded yet."
          />
        </Panel>

        <Panel
          span={7}
          title="Specialist performance"
          subtitle="Touchpoint completion ranked across the team"
          meta={`${agentPerformanceData.length} specialists`}
        >
          <HBarList
            items={metrics.agentRows}
            max={100}
            emptyText="No specialist activity recorded for this cycle."
          />
        </Panel>

        <Panel
          span={5}
          title="Recent feedback"
          subtitle="Latest verified stakeholder reviews"
          meta={
            onNavigateToFeedback ? (
              <button type="button" className="pl-inline-link" onClick={onNavigateToFeedback}>
                View all
              </button>
            ) : (
              `${reviewCount} reviews`
            )
          }
        >
          {metrics.recentFeedback.length === 0 ? (
            <div className="pl-empty">No customer feedback submitted yet.</div>
          ) : (
            <ul className="pl-list">
              {metrics.recentFeedback.map((feedback) => (
                <li key={feedback.id} className="pl-list-row">
                  <span className="pl-list-avatar">
                    {(feedback.organizationName || 'C').charAt(0).toUpperCase()}
                  </span>
                  <div className="pl-list-main">
                    <div className="pl-list-title">
                      {feedback.organizationName || feedback.projectName || 'Customer'}
                    </div>
                    <div className="pl-list-sub">
                      {feedback.remarks
                        ? feedback.remarks.slice(0, 48) + (feedback.remarks.length > 48 ? '…' : '')
                        : 'No remark provided'}
                    </div>
                  </div>
                  <div className="pl-list-side">
                    <span className="pl-quality-stars" aria-label={`${feedback.rating} out of 5`}>
                      {'★'.repeat(Math.max(0, Math.min(5, feedback.rating)))}
                    </span>
                    <span>
                      {feedback.createdAt
                        ? new Date(feedback.createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {hasReviews && csatNumber >= 4.5 && (
        <div style={{ marginTop: 12 }}>
          <StatusPill tone="good">Customer sentiment is above the 4.5 target</StatusPill>
        </div>
      )}
    </div>
  );
};
