import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import { usersApi } from '../../api/usersApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { feedbacksApi } from '../../api/feedbacksApi';
import {
  TrendingUpIcon,
  RefreshIcon,
  PdfIcon,
  PptxIcon,
} from '../../components/icons/Icons';
import { exportToPdf, exportToPptx } from '../../utils/exportUtils';
import { DirectorBentoDashboard } from '../../components/bento/DirectorBentoDashboard';
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
} from '../../types';
import {
  UserRole,
  toUserRole,
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
}

export const ExecutiveInsightsPage: React.FC<ExecutiveInsightsPageProps> = ({
  onNavigateToOrganizations: _onNavigateToOrganizations,
  onNavigateToProjects,
  onNavigateToSchedules,
  onNavigateToAssignments: _onNavigateToAssignments,
  onNavigateToUsers: _onNavigateToUsers,
  onNavigateToFeedback,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [projectModulesMap, setProjectModulesMap] = useState<Record<string, ProjectModule[]>>({});

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
      ] = await Promise.allSettled([
        organizationsApi.getOrganizations({ pageSize: 100 }),
        projectsApi.getProjects({ pageSize: 100 }),
        schedulesApi.getSchedules({ pageSize: 20 }),
        usersApi.getUsers({ pageSize: 100 }),
        assignmentsApi.getAssignments({ pageSize: 100 }),
        feedbacksApi.getFeedbacks({ pageSize: 50 }),
        feedbacksApi.getAnalytics(),
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
        if (scheds.length > 0) {
          try {
            const itemsRes = await schedulesApi.getScheduleItems(scheds[0].id, { pageSize: 200 });
            setScheduleItems(itemsRes.items || []);
          } catch {
            // Non-critical if schedule items cannot be loaded
          }
        }
      }
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.items || []);
      if (assignmentsRes.status === 'fulfilled') setAssignments(assignmentsRes.value.items || []);
      if (feedbacksRes.status === 'fulfilled') setFeedbacks(feedbacksRes.value.items || []);
      if (analyticsRes.status === 'fulfilled') setFeedbackAnalytics(analyticsRes.value);
    } catch (err: any) {
      setPageError({
        message: 'Could not load executive data feed.',
        details: [err.message || 'Network or server error.'],
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDirectorData();
  }, []);

  // Compute metrics for Bento Cards
  const activeSchedule = schedules.length > 0 ? schedules[0] : null;

  const totalTouchpoints = useMemo(() => {
    if (scheduleItems.length > 0) return scheduleItems.length;
    if (activeSchedule) return activeSchedule.totalItems || 0;
    return schedules.reduce((acc, s) => acc + (s.totalItems || 0), 0);
  }, [scheduleItems, activeSchedule, schedules]);

  const completedTouchpoints = useMemo(() => {
    if (scheduleItems.length > 0) {
      return scheduleItems.filter((i) => isCompletedTouchpoint(i.status)).length;
    }
    if (activeSchedule) return activeSchedule.completedItems || 0;
    return schedules.reduce((acc, s) => acc + (s.completedItems || 0), 0);
  }, [scheduleItems, activeSchedule, schedules]);

  const overallRate = totalTouchpoints > 0 ? Math.round((completedTouchpoints / totalTouchpoints) * 100) : 0;

  // Support Agents & Team Leads roster
  const supportAgents = useMemo(
    () => users.filter((u) => toUserRole(u.role) === UserRole.SupportAgent),
    [users]
  );
  const teamLeads = useMemo(
    () => users.filter((u) => toUserRole(u.role) === UserRole.TeamLead),
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
        userId: agent.id,
        userName: agent.fullName || agent.userName || 'Specialist',
        role: 'Support Agent',
        planned,
        completed,
        pending,
        skipped,
        completionRate,
        assignedProjects,
        averageRating: avgRating,
      };
    });
  }, [supportAgents, scheduleItems, assignments, feedbacks]);

  // CSAT Score & Sentiment Rate
  const averageCsat = useMemo(() => {
    if (feedbacks.length === 0) return feedbackAnalytics?.averageRating?.toFixed(1) || '4.9';
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks, feedbackAnalytics]);

  const positiveSentimentRate = useMemo(() => {
    if (feedbacks.length === 0) return 98;
    const positiveCount = feedbacks.filter((f) => f.rating >= 4).length;
    return Math.round((positiveCount / feedbacks.length) * 100);
  }, [feedbacks]);

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
        { label: 'Total Planned Touchpoints', value: totalTouchpoints, color: 'primary' },
        { label: 'Completed Touchpoints', value: completedTouchpoints, color: 'success' },
        { label: 'Average CSAT Rating', value: `${averageCsat} / 5.0`, color: 'warning' },
        { label: 'Active Enterprise Clients', value: organizations.length, color: 'primary' },
        { label: 'Deployed Projects', value: projects.length, color: 'primary' },
      ],
      sections: [
        {
          title: 'Specialist Performance Matrix',
          columns: ['Support Specialist', 'Planned', 'Completed', 'Completion Rate', 'Avg CSAT'],
          columnWidths: [3, 1.5, 1.5, 2, 2],
          rows: agentPerformanceData.map((a) => [
            a.userName,
            a.planned,
            a.completed,
            `${a.completionRate}%`,
            a.averageRating ? `${a.averageRating} ★` : '—',
          ]),
        },
      ],
      notes: [
        'Executive data reflects current operating cycles across all client accounts.',
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
            { label: 'Active Projects', value: projects.length },
          ],
          bulletPoints: [
            `Enterprise operations achieved a ${overallRate}% completion adherence across scheduled touchpoints.`,
            `Completed ${completedTouchpoints} customer touchpoints out of ${totalTouchpoints} planned.`,
            `Client satisfaction remains exceptional with an average rating of ${averageCsat} out of 5.0 stars.`,
            `${projects.length} solution projects are actively tracked across client accounts.`,
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
          <h2 className="view-title">Executive Dashboard</h2>
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

      {/* Visual-First Bento Grid Dashboard */}
      <DirectorBentoDashboard
        overallRate={overallRate}
        completedTouchpoints={completedTouchpoints}
        totalTouchpoints={totalTouchpoints}
        averageCsat={averageCsat}
        positiveSentimentRate={positiveSentimentRate}
        feedbacks={feedbacks}
        feedbackAnalytics={feedbackAnalytics}
        schedules={schedules}
        teamLeads={teamLeads}
        supportAgents={supportAgents}
        agentPerformanceData={agentPerformanceData}
        projects={projects}
        projectModulesMap={projectModulesMap}
        onNavigateToFeedback={onNavigateToFeedback}
        onNavigateToSchedules={onNavigateToSchedules}
        onNavigateToProjects={onNavigateToProjects}
      />
    </div>
  );
};
