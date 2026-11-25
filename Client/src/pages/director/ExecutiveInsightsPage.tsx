import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import { usersApi } from '../../api/usersApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { feedbacksApi } from '../../api/feedbacksApi';
import { leadsApi } from '../../api/commercialApi';
import { ticketsApi } from '../../api/ticketsApi';
import {
  RefreshIcon,
  PdfIcon,
  PptxIcon,
} from '../../components/icons/Icons';
import { exportToPdf, exportToPptx } from '../../utils/exportUtils';
import { DirectorPulseDashboard } from '../../components/dashboards/DirectorPulseDashboard';
import { pickFocusSchedule } from '../../components/dashboards/dashboardUtils';
import type { AgentPerformanceData } from '../../components/common/AgentPerformanceGraph';
import type {
  Organization,
  Project,
  ProjectModule,
  WeeklySchedule,
  UserProfile,
  SupportAssignment,
  Feedback,
  FeedbackAnalytics,
  ScheduleItem,
  LeadPipelineSummary,
  TicketAnalytics,
} from '../../types';
import {
  UserRole,
  toUserRole,
  isActiveProject,
  isCompletedTouchpoint,
  isPendingTouchpoint,
  isSkippedTouchpoint,
} from '../../types';

export interface ExecutiveInsightsPageProps {
  onNavigateToOrganizations?: () => void;
  onNavigateToProjects?: () => void;
  onNavigateToSchedules?: () => void;
  onNavigateToAssignments?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToFeedback?: () => void;
  onNavigateToCommercial?: () => void;
  onNavigateToTickets?: () => void;
}

export const ExecutiveInsightsPage: React.FC<ExecutiveInsightsPageProps> = ({
  onNavigateToProjects,
  onNavigateToFeedback,
  onNavigateToCommercial,
  onNavigateToTickets,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<WeeklySchedule | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [projectModulesMap, setProjectModulesMap] = useState<Record<string, ProjectModule[]>>({});
  const [pipelineSummary, setPipelineSummary] = useState<LeadPipelineSummary | null>(null);
  const [ticketAnalytics, setTicketAnalytics] = useState<TicketAnalytics | null>(null);

  const [, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  const fetchDirectorData = async () => {
    setIsRefreshing(true);
    setPageError(null);
    try {
      const [
        orgsRes,
        projectsRes,
        schedulesRes,
        usersRes,
        assignmentsRes,
        feedbacksRes,
        analyticsRes,
        pipelineRes,
        ticketsRes,
      ] = await Promise.allSettled([
        organizationsApi.getOrganizations({ pageSize: 100 }),
        projectsApi.getProjects({ pageSize: 100 }),
        schedulesApi.getSchedules({ pageSize: 20 }),
        usersApi.getUsers({ pageSize: 100 }),
        assignmentsApi.getAssignments({ pageSize: 100 }),
        feedbacksApi.getFeedbacks({ pageSize: 100 }),
        feedbacksApi.getAnalytics(),
        leadsApi.getPipelineSummary(),
        ticketsApi.getAnalytics(),
      ]);

      if (orgsRes.status === 'fulfilled') setOrganizations(orgsRes.value.items || []);
      if (projectsRes.status === 'fulfilled') {
        const projs = projectsRes.value.items || [];
        setProjects(projs);
        Promise.all(projs.map((p) => projectsApi.getProjectModules(p.id).catch(() => [])))
          .then((modArrays) => {
            const map: Record<string, ProjectModule[]> = {};
            projs.forEach((p, idx) => {
              map[p.id] = modArrays[idx] || [];
            });
            setProjectModulesMap(map);
          })
          .catch(() => {});
      }
      if (schedulesRes.status === 'fulfilled') {
        const scheds = schedulesRes.value.items || [];
        setSchedules(scheds);
        const focus = pickFocusSchedule(scheds);
        if (focus) {
          setActiveSchedule(focus);
          try {
            const itemsRes = await schedulesApi.getScheduleItems(focus.id, { pageSize: 100 });
            setScheduleItems(itemsRes.items || []);
          } catch {
            setScheduleItems([]);
          }
        }
      }
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.items || []);
      if (assignmentsRes.status === 'fulfilled') setAssignments(assignmentsRes.value.items || []);
      if (feedbacksRes.status === 'fulfilled') setFeedbacks(feedbacksRes.value.items || []);
      if (analyticsRes.status === 'fulfilled') setFeedbackAnalytics(analyticsRes.value);
      if (pipelineRes.status === 'fulfilled') setPipelineSummary(pipelineRes.value);
      if (ticketsRes.status === 'fulfilled') setTicketAnalytics(ticketsRes.value);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPageError({
        message: 'Could not load executive data feed.',
        details: [e.message || 'Network or server error.'],
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDirectorData();
  }, []);

  const totalTouchpoints = activeSchedule?.totalItems || scheduleItems.length;

  const completedTouchpoints = activeSchedule
    ? activeSchedule.completedItems
    : scheduleItems.filter((i) => isCompletedTouchpoint(i.status)).length;

  const overallRate = totalTouchpoints > 0 ? Math.round((completedTouchpoints / totalTouchpoints) * 100) : 0;

  // Support Agents & Team Leads roster
  const supportAgents = useMemo(
    () => users.filter((u) => toUserRole(u.role) === UserRole.SupportAgent),
    [users]
  );
  // Per-Agent Performance Metrics for Card 3
  const agentPerformanceData: AgentPerformanceData[] = useMemo(() => {
    return supportAgents.map((agent) => {
      const agentItems = scheduleItems.filter((i) => i.assignedUserId === agent.id);
      const planned = agentItems.length;
      const completed = agentItems.filter((i) => isCompletedTouchpoint(i.status)).length;
      const pending = agentItems.filter((i) => isPendingTouchpoint(i.status)).length;
      const skipped = agentItems.filter((i) => isSkippedTouchpoint(i.status)).length;
      const completionRate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

      const agentAssignments = assignments.filter((a) => a.userId === agent.id && a.isActive);
      const assignedProjects = agentAssignments.map((a) => a.projectName || 'Active Project');

      const agentFeedbacks = feedbacks.filter((f) => f.assignedUserId === agent.id);
      const avgRating =
        agentFeedbacks.length > 0
          ? Number(
              (
                agentFeedbacks.reduce((acc, f) => acc + f.rating, 0) / agentFeedbacks.length
              ).toFixed(1)
            )
          : undefined;

      return {
        agentId: agent.id,
        agentName: agent.fullName || agent.userName || 'Specialist',
        agentEmail: agent.email,
        totalAssigned: planned,
        completed,
        pending,
        skipped,
        completionRate,
        avgRating,
        assignedProjectsCount: assignedProjects.length,
      };
    });
  }, [supportAgents, scheduleItems, assignments, feedbacks]);

  // CSAT Score & Sentiment Rate (server analytics are authoritative; list is the fallback)
  const reviewCount = feedbackAnalytics?.totalReviews ?? feedbacks.length;

  const averageCsat = useMemo(() => {
    if (feedbackAnalytics && feedbackAnalytics.totalReviews > 0) {
      return feedbackAnalytics.averageRating.toFixed(1);
    }
    if (feedbacks.length === 0) return '—';
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks, feedbackAnalytics]);

  const positiveSentimentRate = useMemo(() => {
    if (feedbackAnalytics && feedbackAnalytics.totalReviews > 0) {
      return Math.round(feedbackAnalytics.positivePercentage);
    }
    if (feedbacks.length === 0) return 0;
    const positiveCount = feedbacks.filter((f) => f.rating >= 4).length;
    return Math.round((positiveCount / feedbacks.length) * 100);
  }, [feedbacks, feedbackAnalytics]);

  // Handle Export Executive PDF
  const handleExportPdf = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPdf({
      fileName: `Executive_Overview_Dossier_${dateStr}.pdf`,
      title: 'Executive Insights & Strategic Health Briefing',
      subtitle: 'Portfolio Service Coverage, Client Satisfaction, and Agent Execution Benchmark',
      authorOrRole: 'Executive Director Office',
      kpis: [
        { label: 'Overall Completion', value: `${overallRate}%`, color: 'success' },
        {
          label: activeSchedule
            ? `Planned Touchpoints (Wk ${activeSchedule.weekNumber})`
            : 'Total Planned Touchpoints',
          value: totalTouchpoints,
          color: 'primary',
        },
        { label: 'Completed Touchpoints', value: completedTouchpoints, color: 'success' },
        {
          label: 'Average CSAT Rating',
          value: averageCsat === '—' ? 'No reviews' : `${averageCsat} / 5.0`,
          color: 'warning',
        },
        {
          label: 'Active Enterprise Clients',
          value: organizations.filter((o) => o.isActive).length,
          color: 'primary',
        },
        { label: 'Deployed Projects', value: projects.length, color: 'primary' },
      ],
      sections: [
        {
          title: 'Specialist Performance Matrix',
          columns: ['Support Specialist', 'Planned', 'Completed', 'Completion Rate', 'Avg CSAT'],
          columnWidths: [3, 1.5, 1.5, 2, 2],
          rows: agentPerformanceData.map((a) => [
            a.agentName,
            a.totalAssigned,
            a.completed,
            `${a.completionRate}%`,
            a.avgRating ? `${a.avgRating} ★` : '—',
          ]),
        },
      ],
      notes: [
        activeSchedule
          ? `Cycle metrics reflect Week ${activeSchedule.weekNumber}, ${activeSchedule.year} across all client accounts.`
          : 'Executive data reflects recorded operating cycles across all client accounts.',
        'SLA adherence benchmark target is set to 90% or higher.',
      ],
    });
  };

  // Handle Export Executive Briefing (.pptx)
  const handleExportPptx = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPptx({
      fileName: `Executive_Briefing_${dateStr}.pptx`,
      title: 'Executive Director Briefing & Performance Review',
      subtitle: 'Operational Health, Customer Sentiment, and Team Output',
      company: 'Directorate of Support Operations',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      slides: [
        {
          title: 'Executive Summary & Operational Delivery',
          subtitle: 'Enterprise-wide completion adherence and service quality benchmarks',
          kpis: [
            { label: 'Completion Rate', value: `${overallRate}%`, color: 'success' },
            { label: 'Completed Deliveries', value: completedTouchpoints, color: 'success' },
            { label: 'Customer CSAT', value: `${averageCsat} ★`, color: 'primary' },
            { label: 'Active Projects', value: projects.filter((p) => isActiveProject(p.status)).length },
          ],
          bulletPoints: [
            `Enterprise operations achieved a ${overallRate}% completion adherence across scheduled touchpoints.`,
            `Completed ${completedTouchpoints} customer touchpoints out of ${totalTouchpoints} planned.`,
            averageCsat === '—'
              ? 'No customer reviews have been recorded yet.'
              : `Client satisfaction averages ${averageCsat} out of 5.0 across ${reviewCount} reviews.`,
            `${projects.length} solution projects are tracked across client accounts.`,
          ],
        },
      ],
    });
  };

  return (
    <div className="executive-container">
      {/* Executive Header & Export Bar */}
      <div className="view-headline-row flex-wrap gap-3 mb-4">
        <div>
          <h2 className="main-page-title">Executive Dashboard</h2>
          <p className="main-page-subtitle">
            Portfolio delivery, customer sentiment, and team performance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPptx}
            className="flex items-center gap-1.5"
            title="Export executive briefing slide deck"
          >
            <PptxIcon size={14} />
            <span>Export Deck (.pptx)</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5"
            title="Export formal executive audit dossier"
          >
            <PdfIcon size={14} />
            <span>Export Dossier (.pdf)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDirectorData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshIcon size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </Button>
        </div>
      </div>

      {pageError && (
        <Alert
          variant="warning"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
        />
      )}

      <DirectorPulseDashboard
        overallRate={overallRate}
        completedTouchpoints={completedTouchpoints}
        totalTouchpoints={totalTouchpoints}
        averageCsat={averageCsat}
        positiveSentimentRate={positiveSentimentRate}
        reviewCount={reviewCount}
        feedbacks={feedbacks}
        feedbackAnalytics={feedbackAnalytics}
        schedules={schedules}
        scheduleItems={scheduleItems}
        agentPerformanceData={agentPerformanceData}
        projects={projects}
        projectModulesMap={projectModulesMap}
        pipelineSummary={pipelineSummary}
        ticketAnalytics={ticketAnalytics}
        onNavigateToFeedback={onNavigateToFeedback}
        onNavigateToProjects={onNavigateToProjects}
        onNavigateToCommercial={onNavigateToCommercial}
        onNavigateToTickets={onNavigateToTickets}
      />
    </div>
  );
};
