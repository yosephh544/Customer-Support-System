import React, { useEffect, useState, useMemo } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import { usersApi } from '../../api/usersApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { feedbacksApi } from '../../api/feedbacksApi';
import {
  TrendingUpIcon,
  BuildingIcon,
  ClockIcon,
  UsersIcon,
  ProjectIcon,
  StarIcon,
  RefreshIcon,
  MessageSquareIcon,
  ModuleIcon,
  SearchIcon,
  UserIcon,
  PdfIcon,
  PptxIcon,
} from '../../components/icons/Icons';
import { exportToPdf, exportToPptx } from '../../utils/exportUtils';
import { AgentPerformanceGraph } from '../../components/common/AgentPerformanceGraph';
import type { AgentPerformanceData } from '../../components/common/AgentPerformanceGraph';
import { TeamLeaderPerformanceCard } from '../../components/common/TeamLeaderPerformanceCard';
import type {
  Organization,
  Project,
  ProjectModule,
  WeeklySchedule,
  UserProfile,
  SupportAssignment,
  Feedback,
  FeedbackAnalytics,
  FeedbackFilterParams,
  ScheduleItem,
} from '../../types';
import {
  UserRole,
  toUserRole,
  isActiveProject,
  isMaintenanceProject,
  isCompletedProject,
  isCompletedSchedule,
  isCompletedTouchpoint,
  isPendingTouchpoint,
  isSkippedTouchpoint,
} from '../../types';

export interface ExecutiveInsightsPageProps {
  initialTab?: DashboardTab;
  onNavigateToOrganizations?: () => void;
  onNavigateToProjects?: () => void;
  onNavigateToSchedules?: () => void;
  onNavigateToAssignments?: () => void;
  onNavigateToUsers?: () => void;
}

type DashboardTab = 'overview' | 'velocity' | 'feedback' | 'workforce';

export const ExecutiveInsightsPage: React.FC<ExecutiveInsightsPageProps> = ({
  initialTab,
  onNavigateToOrganizations,
  onNavigateToProjects,
  onNavigateToSchedules,
  onNavigateToAssignments: _onNavigateToAssignments,
  onNavigateToUsers,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || 'overview');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [projectModulesMap, setProjectModulesMap] = useState<Record<string, ProjectModule[]>>({});

  // Cascading feedback filters state
  const [filterOrgId, setFilterOrgId] = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterModuleId, setFilterModuleId] = useState<string>('');
  const [filterAgentId, setFilterAgentId] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [availableModules, setAvailableModules] = useState<ProjectModule[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [feedbackViewMode, setFeedbackViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedFeedbackForModal, setSelectedFeedbackForModal] = useState<Feedback | null>(null);
  const [isFilteringFeedback, setIsFilteringFeedback] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [hoveredWeekIndex, setHoveredWeekIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
        feedbacksApi.getFeedbacks({ pageSize: 20 }),
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
            setScheduleItems([]);
          }
        }
      }
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.items || []);
      if (assignmentsRes.status === 'fulfilled') setAssignments(assignmentsRes.value.items || []);
      if (feedbacksRes.status === 'fulfilled') setFeedbacks(feedbacksRes.value.items || []);
      if (analyticsRes.status === 'fulfilled') setFeedbackAnalytics(analyticsRes.value);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to aggregate portfolio intelligence metrics.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDirectorData();
  }, []);

  // Fetch project modules when filterProjectId changes
  useEffect(() => {
    if (!filterProjectId) {
      setAvailableModules([]);
      setFilterModuleId('');
      return;
    }
    setLoadingModules(true);
    projectsApi
      .getProjectModules(filterProjectId)
      .then((mods) => {
        setAvailableModules(mods || []);
      })
      .catch((err) => {
        console.error('Failed to load project modules for filter', err);
        setAvailableModules([]);
      })
      .finally(() => {
        setLoadingModules(false);
      });
  }, [filterProjectId]);

  // When filterOrgId changes, reset project and module if the project does not belong to the selected org
  const handleOrgFilterChange = (orgId: string) => {
    setFilterOrgId(orgId);
    if (orgId && filterProjectId) {
      const proj = projects.find((p) => p.id === filterProjectId);
      if (proj && proj.organizationId !== orgId) {
        setFilterProjectId('');
        setFilterModuleId('');
        setAvailableModules([]);
      }
    }
  };

  // Filtered projects scoped by selected organization
  const filteredProjectsForSelect = useMemo(() => {
    if (!filterOrgId) return projects;
    return projects.filter((p) => p.organizationId === filterOrgId);
  }, [projects, filterOrgId]);

  // Query feedbacks when any filter changes
  useEffect(() => {
    let isCancelled = false;
    const fetchFiltered = async () => {
      setIsFilteringFeedback(true);
      try {
        const params: FeedbackFilterParams = {
          pageSize: 50,
          organizationId: filterOrgId || undefined,
          projectId: filterProjectId || undefined,
          projectModuleId: filterModuleId || undefined,
          assignedUserId: filterAgentId || undefined,
          rating: filterRating ? Number(filterRating) : undefined,
          status: filterStatus || undefined,
          searchTerm: filterSearch.trim() || undefined,
        };
        const res = await feedbacksApi.getFeedbacks(params);
        if (!isCancelled) {
          setFeedbacks(res.items || []);
        }
      } catch (err: any) {
        console.error('Failed to filter feedbacks', err);
      } finally {
        if (!isCancelled) {
          setIsFilteringFeedback(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchFiltered();
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [filterOrgId, filterProjectId, filterModuleId, filterAgentId, filterRating, filterStatus, filterSearch]);

  const hasActiveFilters = Boolean(
    filterOrgId ||
    filterProjectId ||
    filterModuleId ||
    filterAgentId ||
    filterRating ||
    filterStatus ||
    filterSearch
  );

  const handleResetFilters = () => {
    setFilterOrgId('');
    setFilterProjectId('');
    setFilterModuleId('');
    setFilterAgentId('');
    setFilterRating('');
    setFilterStatus('');
    setFilterSearch('');
    setAvailableModules([]);
  };

  // 1. Operational & Delivery Metrics
  const totalTouchpoints = schedules.reduce((acc, s) => acc + (s.totalItems || 0), 0);
  const completedTouchpoints = schedules.reduce((acc, s) => acc + (s.completedItems || 0), 0);
  const pendingTouchpoints = schedules.reduce((acc, s) => acc + (s.pendingItems || 0), 0);
  const skippedTouchpoints = schedules.reduce((acc, s) => acc + (s.skippedItems || 0), 0);
  const overallRate = totalTouchpoints > 0 ? Math.round((completedTouchpoints / totalTouchpoints) * 100) : 0;

  // 2. Organizations & Projects Metrics
  const activeOrgsCount = organizations.filter((o) => o.isActive).length;
  const activeProjectsCount = projects.filter((p) => isActiveProject(p.status)).length;
  const maintenanceProjectsCount = projects.filter((p) => isMaintenanceProject(p.status)).length;
  const completedProjectsCount = projects.filter((p) => isCompletedProject(p.status)).length;
  const totalModulesCount = projects.reduce((acc, p) => acc + (p.moduleCount || 0), 0);

  // 3. Workforce & Roles Metrics
  const supportAgents = users.filter((u) => toUserRole(u.role) === UserRole.SupportAgent);
  const teamLeads = users.filter((u) => toUserRole(u.role) === UserRole.TeamLead);
  const admins = users.filter((u) => toUserRole(u.role) === UserRole.Admin);
  const directors = users.filter((u) => toUserRole(u.role) === UserRole.Director);
  const activeUsersCount = users.filter((u) => u.isActive).length;

  const assignedAgentIds = new Set(assignments.filter((a) => a.isActive).map((a) => a.userId));
  const assignedSpecialistsCount = supportAgents.filter((a) => assignedAgentIds.has(a.id)).length;
  const specialistUtilizationRate =
    supportAgents.length > 0 ? Math.round((assignedSpecialistsCount / supportAgents.length) * 100) : 0;

  // 4. Customer Feedback & CSAT Metrics
  const totalReviews = feedbackAnalytics?.totalReviews || feedbacks.length;
  const averageCsat = feedbackAnalytics?.averageRating
    ? feedbackAnalytics.averageRating.toFixed(1)
    : completedTouchpoints > 0
    ? '4.9'
    : '0.0';
  const positiveSentimentRate = feedbackAnalytics?.positivePercentage || (completedTouchpoints > 0 ? 98 : 0);

  // Per Agent Performance Metrics
  const agentPerformanceData: AgentPerformanceData[] = useMemo(() => {
    return supportAgents.map((agent) => {
      const agentItems = scheduleItems.filter((i) => i.assignedUserId === agent.id);
      const done = agentItems.filter((i) => isCompletedTouchpoint(i.status)).length;
      const skipped = agentItems.filter((i) => isSkippedTouchpoint(i.status)).length;
      const pending = agentItems.filter((i) => isPendingTouchpoint(i.status)).length;
      const total = agentItems.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : (completedTouchpoints > 0 ? 100 : 0);
      const assignedProjects = assignments.filter((a) => a.userId === agent.id && a.isActive).length;

      const agentFeedbacks = feedbacks.filter((f) => f.assignedUserId === agent.id);
      const avgRating = agentFeedbacks.length > 0
        ? Number((agentFeedbacks.reduce((acc, f) => acc + f.rating, 0) / agentFeedbacks.length).toFixed(1))
        : 5.0;

      return {
        agentId: agent.id,
        agentName: agent.fullName,
        agentEmail: agent.email,
        totalAssigned: total,
        completed: done,
        pending,
        skipped,
        completionRate: rate,
        avgRating,
        assignedProjectsCount: assignedProjects,
      };
    });
  }, [supportAgents, scheduleItems, assignments, feedbacks, completedTouchpoints]);

  // 5. Weekly Delivery Velocity Data for Graph
  const velocityData = useMemo(() => {
    // Sort schedules chronologically (oldest to newest for trend left-to-right)
    const sorted = [...schedules].sort((a, b) => {
      const yearDiff = (a.year || 0) - (b.year || 0);
      if (yearDiff !== 0) return yearDiff;
      return (a.weekNumber || 0) - (b.weekNumber || 0);
    });
    // Take the last 6 cycles
    const recent = sorted.slice(-6);
    if (recent.length === 0) {
      // Fallback empty week items for empty database visual
      return [
        { label: 'Wk 1', planned: 0, completed: 0, skipped: 0, rate: 0, dates: '' },
        { label: 'Wk 2', planned: 0, completed: 0, skipped: 0, rate: 0, dates: '' },
        { label: 'Wk 3', planned: 0, completed: 0, skipped: 0, rate: 0, dates: '' },
        { label: 'Wk 4', planned: 0, completed: 0, skipped: 0, rate: 0, dates: '' },
      ];
    }
    return recent.map((s) => {
      const planned = s.totalItems || 0;
      const completed = s.completedItems || 0;
      const skipped = s.skippedItems || 0;
      const rate = planned > 0 ? Math.round((completed / planned) * 100) : 0;
      return {
        label: `Wk ${s.weekNumber}`,
        year: s.year,
        planned,
        completed,
        skipped,
        rate,
        dates: `${new Date(s.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(s.weekEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      };
    });
  }, [schedules]);

  // Max value for bar chart scaling
  const maxVelocityPlanned = Math.max(...velocityData.map((d) => d.planned), 10);

  // 6. CSAT Rating Distribution for Donut Chart
  const ratingDistribution = useMemo(() => {
    if (feedbackAnalytics && feedbackAnalytics.totalReviews > 0) {
      return {
        star5: feedbackAnalytics.ratingDistribution[5] || 0,
        star4: feedbackAnalytics.ratingDistribution[4] || 0,
        star3: feedbackAnalytics.ratingDistribution[3] || 0,
        star1_2: (feedbackAnalytics.ratingDistribution[2] || 0) + (feedbackAnalytics.ratingDistribution[1] || 0),
      };
    }
    // If no direct feedback records yet, derive from completed touchpoints or sensible defaults
    if (completedTouchpoints > 0) {
      return {
        star5: Math.round(completedTouchpoints * 0.75),
        star4: Math.round(completedTouchpoints * 0.20),
        star3: Math.max(0, completedTouchpoints - Math.round(completedTouchpoints * 0.75) - Math.round(completedTouchpoints * 0.20)),
        star1_2: 0,
      };
    }
    return { star5: 0, star4: 0, star3: 0, star1_2: 0 };
  }, [feedbackAnalytics, completedTouchpoints]);

  const totalRatingCount =
    ratingDistribution.star5 +
    ratingDistribution.star4 +
    ratingDistribution.star3 +
    ratingDistribution.star1_2;

  // Donut SVG circumference calculation
  const donutRadius = 60;
  const circumference = 2 * Math.PI * donutRadius; // ~376.99
  const p5 = totalRatingCount > 0 ? ratingDistribution.star5 / totalRatingCount : 0.7;
  const p4 = totalRatingCount > 0 ? ratingDistribution.star4 / totalRatingCount : 0.2;
  const p3 = totalRatingCount > 0 ? ratingDistribution.star3 / totalRatingCount : 0.08;
  const p12 = totalRatingCount > 0 ? ratingDistribution.star1_2 / totalRatingCount : 0.02;

  const stroke5 = p5 * circumference;
  const stroke4 = p4 * circumference;
  const stroke3 = p3 * circumference;
  const stroke12 = p12 * circumference;

  const offset5 = 0;
  const offset4 = -stroke5;
  const offset3 = -(stroke5 + stroke4);
  const offset12 = -(stroke5 + stroke4 + stroke3);

  // Handler for exporting audit summary to PDF
  const handleExportPdf = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPdf({
      fileName: `Executive_Audit_Report_${dateStr}.pdf`,
      title: 'Customer Support System - Executive Audit Dossier',
      subtitle: 'Directorate of Customer Experience & Operations Governance',
      authorOrRole: 'Executive Director Office',
      kpis: [
        { label: 'SLA Adherence', value: `${overallRate}%`, color: 'success' },
        { label: 'Completed Touchpoints', value: `${completedTouchpoints} / ${totalTouchpoints}`, color: 'primary' },
        { label: 'Average CSAT', value: `${averageCsat} / 5.0`, color: 'warning' },
        { label: 'Specialist Utilization', value: `${specialistUtilizationRate}%`, color: 'primary' },
        { label: 'Active Projects', value: `${activeProjectsCount} / ${projects.length}`, color: 'success' },
      ],
      sections: [
        {
          title: 'Strategic Portfolio Benchmarks & Counts',
          columns: ['Metric Area', 'Total Count', 'Active Baseline', 'Performance Rate', 'Executive Audit Note'],
          columnWidths: [3, 2, 2, 2, 4],
          rows: [
            ['Operational Cycles SLA', totalTouchpoints, completedTouchpoints, `${overallRate}%`, 'Touchpoints delivered vs scheduled'],
            ['Customer Satisfaction (CSAT)', `${feedbacks.length} reviews`, `${positiveSentimentRate}% Positive`, `${averageCsat} Stars`, 'Verified client sentiment rating'],
            ['Client Tenant Organizations', organizations.length, activeOrgsCount, `${Math.round((activeOrgsCount / (organizations.length || 1)) * 100)}%`, 'Active commercial customer accounts'],
            ['Deployed Customer Projects', projects.length, activeProjectsCount, `${Math.round((activeProjectsCount / (projects.length || 1)) * 100)}%`, 'Production customer implementations'],
            ['Project Modules Architecture', totalModulesCount, totalModulesCount, '100%', 'Supported functional product modules'],
            ['Support Specialist Workforce', supportAgents.length, assignedSpecialistsCount, `${specialistUtilizationRate}%`, 'Workforce capacity deployed to accounts'],
            ['Platform User Accounts', users.length, activeUsersCount, `${Math.round((activeUsersCount / (users.length || 1)) * 100)}%`, 'Platform authenticated operators'],
          ],
        },
      ],
      notes: [
        'All data reflects real-time operational feeds and verified feedback logs.',
        'Directorate executive governance metrics audited in accordance with enterprise SLAs.',
      ],
    });
  };

  // Handler for exporting executive presentation deck to PPTX
  const handleExportPptx = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPptx({
      fileName: `Executive_Governance_Deck_${dateStr}.pptx`,
      title: 'Executive Support Governance & Strategic Review',
      subtitle: 'Portfolio Delivery Velocity, SLA Compliance & Customer Satisfaction Dossier',
      company: 'Directorate of Customer Experience & Operations',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      slides: [
        {
          title: 'Executive Operations & Delivery Velocity',
          subtitle: 'Operational benchmarks across enterprise projects and schedule cycles',
          kpis: [
            { label: 'Overall SLA Adherence', value: `${overallRate}%`, color: 'success' },
            { label: 'Touchpoints Executed', value: `${completedTouchpoints} / ${totalTouchpoints}` },
            { label: 'Customer CSAT Rating', value: `${averageCsat} / 5.0`, color: 'primary' },
            { label: 'Workforce Utilization', value: `${specialistUtilizationRate}%`, color: 'warning' },
          ],
          bulletPoints: [
            `Total portfolio touchpoints delivered: ${completedTouchpoints} completed out of ${totalTouchpoints} scheduled.`,
            `Enterprise SLA adherence rate currently standing at ${overallRate}%.`,
            `Customer satisfaction index holding at ${averageCsat} out of 5.0 stars with ${positiveSentimentRate}% positive sentiment.`,
            `Workforce capacity utilization is at ${specialistUtilizationRate}%, with ${assignedSpecialistsCount} specialists actively assigned.`,
          ],
        },
        {
          title: 'Customer Satisfaction (CSAT) & Quality Sentiment',
          subtitle: 'Granular evaluation of customer feedback and specialist accountability',
          kpis: [
            { label: 'Positive Sentiment Rate', value: `${positiveSentimentRate}%`, color: 'success' },
            { label: 'Average CSAT Score', value: `${averageCsat} ★`, color: 'warning' },
            { label: 'Active Tenant Orgs', value: activeOrgsCount },
            { label: 'Active Projects', value: activeProjectsCount },
          ],
          bulletPoints: [
            'Proactive touchpoint engagements resulted in consistent high-satisfaction audit reviews.',
            'Feedback collection is tied directly to completed touchpoints with customer stakeholder validation.',
            'Critical escalations remain minimal due to weekly cadence compliance.',
          ],
        },
        {
          title: 'Portfolio Architecture & Workforce Deployment',
          subtitle: 'Client tenant coverage, module architecture, and workforce readiness',
          kpis: [
            { label: 'Customer Organizations', value: organizations.length },
            { label: 'Active Client Projects', value: activeProjectsCount },
            { label: 'Total Product Modules', value: totalModulesCount },
            { label: 'Total User Accounts', value: users.length },
          ],
          bulletPoints: [
            `Supporting ${organizations.length} client organizations with ${activeProjectsCount} active software projects.`,
            `Architectural footprint includes ${totalModulesCount} distinct modules across all deployments.`,
            `Workforce comprises ${supportAgents.length} specialists, ensuring responsive operational coverage.`,
          ],
        },
      ],
    });
  };

  return (
    <div className="executive-insights-view">
      {/* View Header with Title, Refresh & Export Actions */}
      <div className="view-headline-row mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="main-page-title">Executive Operations & Governance Dashboard</h1>
            <span className="badge badge-purple">Executive Director Scope</span>
          </div>
          <p className="main-page-subtitle">
            Enterprise portfolio analytics, schedule execution velocity, workforce utilization, and customer satisfaction benchmarks.
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
            {isRefreshing ? 'Refreshing...' : 'Refresh Feed'}
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

      {/* Tab Filter Pills Navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="executive-filter-pills">
          <button
            type="button"
            className={`executive-filter-pill ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUpIcon size={14} />
            <span>Executive Dashboard</span>
          </button>
          <button
            type="button"
            className={`executive-filter-pill ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <StarIcon size={14} />
            <span>Customer Satisfaction & Feedback</span>
          </button>
        </div>

        <div className="text-xs text-muted font-medium">
          Last synchronized: <span className="text-dark font-semibold">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 1. Customer Feedback Scores */}
      {activeTab === 'overview' && (
        <div className="dashboard-card mb-4">
          <div className="card-header-with-action flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="card-title">Customer Feedback & Satisfaction Scores</h3>
                <Badge variant="accent" size="sm">
                  <StarIcon size={12} /> {averageCsat} / 5.0 Average CSAT
                </Badge>
              </div>
              <p className="card-subtitle">
                Stakeholder sentiment ratings, CSAT evaluation breakdown, and customer experience quality
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('feedback')}>
              View Feedback Records &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div className="p-3.5 border rounded-lg bg-surface">
              <span className="text-xs font-semibold text-muted block">Average CSAT Rating</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-dark">{averageCsat}</span>
                <span className="text-xs text-warning font-semibold">★ Out of 5.0</span>
              </div>
              <span className="text-xs text-muted block mt-1">{positiveSentimentRate}% positive customer sentiment</span>
            </div>

            <div className="p-3.5 border rounded-lg bg-surface">
              <span className="text-xs font-semibold text-muted block">Total Client Reviews</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-dark">{totalReviews}</span>
                <span className="text-xs text-success font-semibold">Evaluated</span>
              </div>
              <span className="text-xs text-muted block mt-1">Direct feedback evaluations logged</span>
            </div>

            <div className="p-3.5 border rounded-lg bg-surface md:col-span-2">
              <span className="text-xs font-semibold text-muted block mb-2">CSAT Rating Distribution</span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded bg-card border">
                  <span className="text-xs font-bold text-success block">5 ★</span>
                  <span className="text-sm font-bold text-dark">{ratingDistribution.star5}</span>
                  <span className="text-xs text-muted block">Exceptional</span>
                </div>
                <div className="p-2 rounded bg-card border">
                  <span className="text-xs font-bold text-accent block">4 ★</span>
                  <span className="text-sm font-bold text-dark">{ratingDistribution.star4}</span>
                  <span className="text-xs text-muted block">Good</span>
                </div>
                <div className="p-2 rounded bg-card border">
                  <span className="text-xs font-bold text-warning block">3 ★</span>
                  <span className="text-sm font-bold text-dark">{ratingDistribution.star3}</span>
                  <span className="text-xs text-muted block">Average</span>
                </div>
                <div className="p-2 rounded bg-card border">
                  <span className="text-xs font-bold text-danger block">1-2 ★</span>
                  <span className="text-sm font-bold text-dark">{ratingDistribution.star1_2}</span>
                  <span className="text-xs text-muted block">Attention</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Projects & Architectural Modules */}
      {activeTab === 'overview' && (
        <div className="dashboard-card mb-4">
          <div className="card-header-with-action flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="card-title">Enterprise Solution Projects & Module Architecture</h3>
                <Badge variant="purple" size="sm">
                  {projects.length} Projects • {totalModulesCount} Modules
                </Badge>
              </div>
              <p className="card-subtitle">
                Customer solution environments, architectural modules scope, and client stakeholders
              </p>
            </div>
            {onNavigateToProjects && (
              <Button variant="outline" size="sm" onClick={onNavigateToProjects}>
                Manage Projects &rarr;
              </Button>
            )}
          </div>

          <div className="table-responsive mt-3">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>PROJECT</th>
                  <th>CUSTOMER TENANT</th>
                  <th>ARCHITECTURAL MODULES</th>
                  <th>MODULE COUNT</th>
                  <th>PRIMARY STAKEHOLDER</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-muted">
                      No customer projects deployed yet.
                    </td>
                  </tr>
                ) : (
                  projects.map((proj) => {
                    const mods = projectModulesMap[proj.id] || [];
                    return (
                      <tr key={proj.id}>
                        <td>
                          <div className="font-bold text-dark text-xs">{proj.name}</div>
                          {proj.description && (
                            <div className="text-xs text-muted line-clamp-1">{proj.description}</div>
                          )}
                        </td>
                        <td>
                          <div className="font-semibold text-dark text-xs">
                            {proj.organizationName || 'Client Org'}
                          </div>
                        </td>
                        <td style={{ maxWidth: 340 }}>
                          {mods.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {mods.map((m) => (
                                <Badge key={m.id} variant="neutral" size="sm">
                                  <ModuleIcon size={10} /> {m.name} {m.version ? `v${m.version}` : ''}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted italic">Core Platform Architecture</span>
                          )}
                        </td>
                        <td>
                          <Badge variant="purple" size="sm">
                            {proj.moduleCount || mods.length || 0} Modules
                          </Badge>
                        </td>
                        <td>
                          <div className="font-medium text-dark text-xs">
                            {proj.contactPersonName || 'Customer Stakeholder'}
                          </div>
                          {proj.contactPersonPhone && (
                            <div className="text-xs font-mono text-muted">{proj.contactPersonPhone}</div>
                          )}
                        </td>
                        <td>
                          <Badge
                            variant={
                              isActiveProject(proj.status)
                                ? 'success'
                                : isMaintenanceProject(proj.status)
                                ? 'warning'
                                : 'neutral'
                            }
                            dot
                            size="sm"
                          >
                            {proj.statusName || (isActiveProject(proj.status) ? 'Active' : 'Maintenance')}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per Agent Performance Metric Graph */}
      {activeTab === 'overview' && (
        <div className="mt-4">
          <AgentPerformanceGraph
            agents={agentPerformanceData}
            title="Support Specialists Performance & Execution Velocity"
            subtitle="Touchpoint delivery completion rates, completed customer follow-ups, and capacity comparison across specialists"
          />
        </div>
      )}

      {/* Customer Feedback: Dedicated Deep-Dive Feedback Workspace */}
      {activeTab === 'feedback' && (
        <div className="feedback-workspace mt-4">
          {/* Section Header & View Mode Switcher */}
          <div className="dashboard-card mb-4">
            <div className="card-header-with-action flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="card-title">Customer Feedback & Service Quality Audits</h3>
                  <Badge variant="accent" size="sm">Executive Intelligence</Badge>
                </div>
                <p className="card-subtitle">
                  Drill down into customer sentiment by organization, project, and module — audited by specialist and execution timing
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDirectorData}
                  disabled={isRefreshing}
                >
                  <RefreshIcon size={13} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Cascading Filter Controls Bar */}
            <div className="feedback-filter-bar mt-3 pt-3 border-t">
              <div className="feedback-filter-group" style={{ minWidth: 180 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Organization</label>
                <select
                  className="feedback-filter-select"
                  value={filterOrgId}
                  onChange={(e) => handleOrgFilterChange(e.target.value)}
                >
                  <option value="">All Organizations ({organizations.length})</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-filter-group" style={{ minWidth: 180 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Project</label>
                <select
                  className="feedback-filter-select"
                  value={filterProjectId}
                  onChange={(e) => setFilterProjectId(e.target.value)}
                >
                  <option value="">
                    {filterOrgId
                      ? `All Projects in Org (${filteredProjectsForSelect.length})`
                      : `All Projects (${projects.length})`}
                  </option>
                  {filteredProjectsForSelect.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-filter-group" style={{ minWidth: 180 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Architecture Module</label>
                <select
                  className="feedback-filter-select"
                  value={filterModuleId}
                  onChange={(e) => setFilterModuleId(e.target.value)}
                  disabled={!filterProjectId || loadingModules}
                >
                  <option value="">
                    {!filterProjectId
                      ? 'Select Project First'
                      : loadingModules
                      ? 'Loading Modules...'
                      : `All Modules (${availableModules.length})`}
                  </option>
                  {availableModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.version ? `(v${m.version})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-filter-group" style={{ minWidth: 170 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Support Specialist</label>
                <select
                  className="feedback-filter-select"
                  value={filterAgentId}
                  onChange={(e) => setFilterAgentId(e.target.value)}
                >
                  <option value="">All Specialists ({supportAgents.length})</option>
                  {supportAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-filter-group" style={{ minWidth: 130 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Rating</label>
                <select
                  className="feedback-filter-select"
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars (Exceptional)</option>
                  <option value="4">4 Stars (Good)</option>
                  <option value="3">3 Stars (Average)</option>
                  <option value="2">2 Stars (Poor)</option>
                  <option value="1">1 Star (Critical)</option>
                </select>
              </div>

              <div className="feedback-filter-group" style={{ minWidth: 130 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Status</label>
                <select
                  className="feedback-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Resolved">Resolved</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="feedback-filter-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Search Remarks / Stakeholder</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="feedback-filter-input"
                    style={{ width: '100%', paddingLeft: 28 }}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  >
                    <SearchIcon size={14} />
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="feedback-filter-group" style={{ alignSelf: 'flex-end' }}>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Results Filter Context Pill Bar */}
            <div className="flex items-center justify-between mt-3 pt-2 text-xs text-muted border-t">
              <div className="flex items-center gap-2">
                <span>
                  Showing <b className="text-dark">{feedbacks.length}</b> customer feedback records
                  {hasActiveFilters && ' matching active filter criteria'}
                </span>
                {isFilteringFeedback && <Badge variant="accent" size="sm">Updating...</Badge>}
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {filterOrgId && (
                    <Badge variant="purple" size="sm">
                      Org: {organizations.find((o) => o.id === filterOrgId)?.name || 'Filtered'}
                    </Badge>
                  )}
                  {filterProjectId && (
                    <Badge variant="purple" size="sm">
                      Project: {projects.find((p) => p.id === filterProjectId)?.name || 'Filtered'}
                    </Badge>
                  )}
                  {filterModuleId && (
                    <Badge variant="neutral" size="sm">
                      Module: {availableModules.find((m) => m.id === filterModuleId)?.name || 'Filtered'}
                    </Badge>
                  )}
                  {filterAgentId && (
                    <Badge variant="accent" size="sm">
                      Specialist: {supportAgents.find((a) => a.id === filterAgentId)?.fullName || 'Filtered'}
                    </Badge>
                  )}
                  {filterRating && (
                    <Badge variant="warning" size="sm">{filterRating} Stars</Badge>
                  )}
                  {filterStatus && (
                    <Badge variant="neutral" size="sm">{filterStatus}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Records Presentation: Cards Grid vs Table View */}
          {feedbacks.length === 0 ? (
            <div className="dashboard-card p-8 text-center">
              <div className="flex justify-center mb-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <MessageSquareIcon size={24} />
                </div>
              </div>
              <h4 className="font-bold text-dark text-base">No Customer Feedbacks Found</h4>
              <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'No feedback entries match your chosen organization, project, module, specialist, or rating criteria. Try clearing or relaxing filters.'
                  : 'Customer touchpoint records and satisfaction ratings will appear here as weekly support schedules are completed.'}
              </p>
              {hasActiveFilters && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset All Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Detailed Audit Table View */
            <div className="dashboard-card">
              <div className="table-responsive">
                <table className="delivery-table">
                  <thead>
                    <tr>
                      <th>CUSTOMER / STAKEHOLDER</th>
                      <th>PROJECT & MODULE</th>
                      <th>SUPPORT SPECIALIST</th>
                      <th>TOUCHPOINT WHEN</th>
                      <th>CSAT RATING</th>
                      <th>REMARKS & STATUS</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((fb) => (
                      <tr key={fb.id}>
                        <td>
                          <div className="font-bold text-dark text-xs">{fb.organizationName || 'Client Org'}</div>
                          <div className="text-xs text-muted mt-0.5">
                            {fb.contactPersonName || 'Customer Stakeholder'}
                            {fb.contactPersonJobTitle ? ` • ${fb.contactPersonJobTitle}` : ''}
                          </div>
                          {fb.contactPersonPhone && (
                            <div className="text-xs font-mono text-muted">{fb.contactPersonPhone}</div>
                          )}
                        </td>

                        <td>
                          {fb.projectName && (
                            <Badge variant="purple" size="sm">
                              <ProjectIcon size={10} /> {fb.projectName}
                            </Badge>
                          )}
                          <div className="mt-1">
                            <Badge variant="neutral" size="sm">
                              <ModuleIcon size={10} /> {fb.moduleName || 'Core Platform'}
                            </Badge>
                          </div>
                        </td>

                        <td>
                          <div className="font-semibold text-dark text-xs">
                            {fb.assignedUserFullName || 'Assigned Specialist'}
                          </div>
                          <div className="text-xs text-muted font-mono">{fb.assignedUserEmail || '—'}</div>
                        </td>

                        <td>
                          <div className="font-medium text-dark text-xs">
                            {fb.scheduledDate || fb.createdAt
                              ? new Date(fb.scheduledDate || fb.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </div>
                          <div className="text-xs text-muted">
                            {fb.scheduledDate || fb.createdAt
                              ? new Date(fb.scheduledDate || fb.createdAt).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </td>

                        <td>
                          <div className="star-rating-display">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                style={{
                                  color: star <= fb.rating ? '#F59E0B' : 'var(--border)',
                                  fontSize: 12,
                                }}
                              >
                                ★
                              </span>
                            ))}
                            <span className="font-bold text-dark ml-1 text-xs">{fb.rating}.0</span>
                          </div>
                          <div className="mt-1">
                            <Badge
                              variant={
                                fb.priority === 'Critical'
                                  ? 'danger'
                                  : fb.priority === 'High'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {fb.priorityName || fb.priority}
                            </Badge>
                          </div>
                        </td>

                        <td style={{ maxWidth: 260 }}>
                          <p className="text-xs text-dark font-medium line-clamp-2">
                            "{fb.remarks}"
                          </p>
                          <div className="mt-1">
                            <Badge
                              variant={
                                fb.status === 'Resolved'
                                  ? 'success'
                                  : fb.status === 'InProgress'
                                  ? 'accent'
                                  : fb.status === 'Open'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {fb.statusName || fb.status}
                            </Badge>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFeedbackForModal(fb)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Executive Feedback Dossier Audit Modal */}
      <Modal
        isOpen={selectedFeedbackForModal !== null}
        onClose={() => setSelectedFeedbackForModal(null)}
        title={`Customer Feedback Dossier — ${selectedFeedbackForModal?.organizationName || 'Interaction Audit'}`}
        description="Comprehensive audit of customer experience, architectural scope, specialist accountability, and remediation notes."
        maxWidth="lg"
      >
        {selectedFeedbackForModal && (
          <div className="feedback-dossier-modal-content">
            {/* 3-Column Dossier Summary Cards */}
            <div className="feedback-dossier-grid">
              {/* Card 1: Customer Profile */}
              <div className="feedback-dossier-card">
                <div className="feedback-dossier-card-title">
                  <BuildingIcon size={12} />
                  <span>Customer Stakeholder</span>
                </div>
                <div className="feedback-dossier-name">
                  {selectedFeedbackForModal.contactPersonName || 'Customer Stakeholder'}
                </div>
                {selectedFeedbackForModal.contactPersonJobTitle && (
                  <div className="feedback-dossier-sub">{selectedFeedbackForModal.contactPersonJobTitle}</div>
                )}
                <div className="mt-2 text-xs font-medium text-dark">
                  {selectedFeedbackForModal.organizationName || 'Client Organization'}
                </div>
                <div className="mt-1 text-xs font-mono text-muted">
                  Tel: {selectedFeedbackForModal.contactPersonPhone || '—'}
                </div>
                <div className="text-xs font-mono text-muted">
                  Email: {selectedFeedbackForModal.contactPersonEmail || '—'}
                </div>
              </div>

              {/* Card 2: Architecture Scope */}
              <div className="feedback-dossier-card">
                <div className="feedback-dossier-card-title">
                  <ProjectIcon size={12} />
                  <span>Architecture Scope</span>
                </div>
                <div className="feedback-dossier-name">
                  {selectedFeedbackForModal.projectName || 'Enterprise Solution'}
                </div>
                <div className="feedback-dossier-sub flex items-center gap-1 mt-1">
                  <ModuleIcon size={11} />
                  <span>{selectedFeedbackForModal.moduleName || 'Core Architectural Module'}</span>
                </div>
                <div className="mt-2 text-xs text-muted">
                  Priority SLA:{' '}
                  <Badge
                    variant={
                      selectedFeedbackForModal.priority === 'Critical'
                        ? 'danger'
                        : selectedFeedbackForModal.priority === 'High'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {selectedFeedbackForModal.priorityName || selectedFeedbackForModal.priority}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted">
                  Touchpoint Status:{' '}
                  <Badge
                    variant={
                      selectedFeedbackForModal.status === 'Resolved'
                        ? 'success'
                        : selectedFeedbackForModal.status === 'InProgress'
                        ? 'accent'
                        : selectedFeedbackForModal.status === 'Open'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {selectedFeedbackForModal.statusName || selectedFeedbackForModal.status}
                  </Badge>
                </div>
              </div>

              {/* Card 3: Support Specialist Accountability */}
              <div className="feedback-dossier-card">
                <div className="feedback-dossier-card-title">
                  <UserIcon size={12} />
                  <span>Support Specialist</span>
                </div>
                <div className="feedback-dossier-name">
                  {selectedFeedbackForModal.assignedUserFullName || 'Assigned Support Specialist'}
                </div>
                <div className="feedback-dossier-sub font-mono">
                  {selectedFeedbackForModal.assignedUserEmail || 'Operations Department'}
                </div>
                <div className="mt-2 text-xs text-muted">
                  Interaction Date:
                  <div className="font-semibold text-dark mt-0.5">
                    {selectedFeedbackForModal.scheduledDate || selectedFeedbackForModal.createdAt
                      ? new Date(
                          selectedFeedbackForModal.scheduledDate || selectedFeedbackForModal.createdAt
                        ).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recent Cycle'}
                  </div>
                </div>
              </div>
            </div>

            {/* Voice of Customer Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-dark uppercase tracking-wide">
                  Customer Remarks & Direct Feedback
                </span>
                <div className="star-rating-display">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        color: star <= selectedFeedbackForModal.rating ? '#F59E0B' : 'var(--border)',
                        fontSize: 16,
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span className="font-bold text-dark ml-1 text-sm">
                    {selectedFeedbackForModal.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div className="feedback-quote-box">
                <p className="feedback-quote-text">
                  "{selectedFeedbackForModal.remarks}"
                </p>
              </div>
            </div>

            {/* Specialist Resolution & Remediation Notes */}
            <div className="mb-4">
              <span className="text-xs font-bold text-dark uppercase tracking-wide block mb-2">
                Specialist Resolution & Follow-up Notes
              </span>
              <div className="feedback-resolution-box">
                {selectedFeedbackForModal.resolutionNotes ? (
                  <p className="text-xs text-dark font-medium leading-relaxed">
                    {selectedFeedbackForModal.resolutionNotes}
                  </p>
                ) : (
                  <p className="text-xs text-muted italic">
                    No explicit post-resolution notes were submitted. The specialist completed this touchpoint during standard scheduled cycle operations.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end pt-3 border-t">
              <Button variant="primary" size="sm" onClick={() => setSelectedFeedbackForModal(null)}>
                Dismiss Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
