import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Modal } from '../../components/common/Modal';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import { usersApi } from '../../api/usersApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { feedbacksApi } from '../../api/feedbacksApi';
import {
  BuildingIcon,
  StarIcon,
  UsersIcon,
  RefreshIcon,
  ClockIcon,
  PdfIcon,
  PptxIcon,
  ProjectIcon,
  ModuleIcon,
  SearchIcon,
  UserIcon,
  MessageSquareIcon,
} from '../../components/icons/Icons';
import { exportToPdf, exportToPptx } from '../../utils/exportUtils';
import type {
  Organization,
  Project,
  ProjectModule,
  WeeklySchedule,
  UserProfile,
  SupportAssignment,
  Feedback,
  FeedbackAnalytics,
} from '../../types';
import {
  UserRole,
  toUserRole,
  isActiveSchedule,
  isCompletedSchedule,
  isActiveProject,
  isMaintenanceProject,
  isCompletedProject,
} from '../../types';

export type DirectorReportTab =
  | 'sla-velocity'
  | 'customer-feedback'
  | 'customer-tenants'
  | 'projects-delivery'
  | 'workforce-utilization';

export interface DirectorReportsPageProps {
  initialTab?: DirectorReportTab;
  onTabChange?: (tab: DirectorReportTab) => void;
}

export const DirectorReportsPage: React.FC<DirectorReportsPageProps> = ({
  initialTab = 'sla-velocity',
  onTabChange,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<DirectorReportTab>(initialTab);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);

  // SLA tab filter
  const [filterYear, setFilterYear] = useState<string>('2026');

  // Customer Feedback cascading filters
  const [filterOrgId, setFilterOrgId] = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterModuleId, setFilterModuleId] = useState<string>('');
  const [filterAgentId, setFilterAgentId] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [availableModules, setAvailableModules] = useState<ProjectModule[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [selectedFeedbackForModal, setSelectedFeedbackForModal] = useState<Feedback | null>(null);

  // Customer Tenants tab filters
  const [tenantSearch, setTenantSearch] = useState<string>('');

  // Projects & Deliveries tab filters
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('');

  const [, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Sync tab with initialTab prop when changed externally
  useEffect(() => {
    if (initialTab) {
      setActiveReportTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: DirectorReportTab) => {
    setActiveReportTab(tab);
    onTabChange?.(tab);
  };

  const loadReportData = async () => {
    setIsRefreshing(true);
    setReportError(null);
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
        schedulesApi.getSchedules({ pageSize: 50 }),
        usersApi.getUsers({ pageSize: 100 }),
        assignmentsApi.getAssignments({ pageSize: 100 }),
        feedbacksApi.getFeedbacks({ pageSize: 150 }),
        feedbacksApi.getAnalytics(),
      ]);

      if (orgsRes.status === 'fulfilled') setOrganizations(orgsRes.value.items || []);
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.items || []);
      if (schedulesRes.status === 'fulfilled') setSchedules(schedulesRes.value.items || []);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.items || []);
      if (assignmentsRes.status === 'fulfilled') setAssignments(assignmentsRes.value.items || []);
      if (feedbacksRes.status === 'fulfilled') setFeedbacks(feedbacksRes.value.items || []);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
    } catch (err: any) {
      setReportError(err.message || 'Failed to generate executive reporting datasets.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Cascading module lookup when project filter changes
  useEffect(() => {
    if (!filterProjectId) {
      setAvailableModules([]);
      setFilterModuleId('');
      return;
    }

    let isMounted = true;
    setLoadingModules(true);
    projectsApi
      .getProjectModules(filterProjectId)
      .then((modules) => {
        if (isMounted) {
          setAvailableModules(modules || []);
          setFilterModuleId('');
        }
      })
      .catch(() => {
        if (isMounted) setAvailableModules([]);
      })
      .finally(() => {
        if (isMounted) setLoadingModules(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filterProjectId]);

  // Support specialists roster
  const supportSpecialists = useMemo(
    () => users.filter((u) => toUserRole(u.role) === UserRole.SupportAgent),
    [users]
  );
  const assignedAgentIds = new Set(assignments.filter((a) => a.isActive).map((a) => a.userId));
  const assignedAgentsCount = supportSpecialists.filter((a) => assignedAgentIds.has(a.id)).length;
  const specialistUtilization =
    supportSpecialists.length > 0 ? Math.round((assignedAgentsCount / supportSpecialists.length) * 100) : 0;

  // Filtered schedules for SLA tab
  const filteredSchedules = useMemo(() => {
    if (!filterYear) return schedules;
    return schedules.filter((s) => s.year?.toString() === filterYear);
  }, [schedules, filterYear]);

  // Aggregate metrics
  const totalTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.totalItems || 0), 0);
  const completedTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.completedItems || 0), 0);
  const skippedTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.skippedItems || 0), 0);
  const pendingTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.pendingItems || 0), 0);
  const overallSlaRate = totalTouchpoints > 0 ? Math.round((completedTouchpoints / totalTouchpoints) * 100) : 0;

  // Filtered projects for feedback dropdown
  const filteredProjectsForSelect = useMemo(() => {
    if (!filterOrgId) return projects;
    return projects.filter((p) => p.organizationId === filterOrgId);
  }, [projects, filterOrgId]);

  // Filtered feedbacks for Customer Feedback tab
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filterOrgId && f.organizationId !== filterOrgId) return false;
      if (filterProjectId && f.projectId !== filterProjectId) return false;
      if (filterModuleId && f.moduleId !== filterModuleId) return false;
      if (filterAgentId && f.assignedUserId !== filterAgentId) return false;
      if (filterRating && f.rating.toString() !== filterRating) return false;
      if (filterStatus && f.status !== filterStatus) return false;
      if (filterSearch) {
        const query = filterSearch.toLowerCase();
        const remarksMatch = f.remarks?.toLowerCase().includes(query);
        const contactMatch = f.contactPersonName?.toLowerCase().includes(query);
        const orgMatch = f.organizationName?.toLowerCase().includes(query);
        const specialistMatch = f.assignedUserFullName?.toLowerCase().includes(query);
        if (!remarksMatch && !contactMatch && !orgMatch && !specialistMatch) return false;
      }
      return true;
    });
  }, [
    feedbacks,
    filterOrgId,
    filterProjectId,
    filterModuleId,
    filterAgentId,
    filterRating,
    filterStatus,
    filterSearch,
  ]);

  const avgFeedbackScore = useMemo(() => {
    if (filteredFeedbacks.length === 0) return analytics?.averageRating?.toFixed(1) || '4.9';
    const sum = filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1);
  }, [filteredFeedbacks, analytics]);

  const hasActiveFeedbackFilters = Boolean(
    filterOrgId ||
      filterProjectId ||
      filterModuleId ||
      filterAgentId ||
      filterRating ||
      filterStatus ||
      filterSearch
  );

  const resetFeedbackFilters = () => {
    setFilterOrgId('');
    setFilterProjectId('');
    setFilterModuleId('');
    setFilterAgentId('');
    setFilterRating('');
    setFilterStatus('');
    setFilterSearch('');
  };

  // Filtered customer tenants for Customer Tenants tab
  const filteredOrganizations = useMemo(() => {
    if (!tenantSearch) return organizations;
    const query = tenantSearch.toLowerCase();
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(query) ||
        o.email?.toLowerCase().includes(query) ||
        (o.phoneNumber || o.phone || '').includes(query)
    );
  }, [organizations, tenantSearch]);

  // Filtered projects for Projects & Deliveries tab
  const filteredProjectsList = useMemo(() => {
    return projects.filter((p) => {
      if (projectStatusFilter) {
        if (projectStatusFilter === 'Active' && !isActiveProject(p.status)) return false;
        if (projectStatusFilter === 'Maintenance' && !isMaintenanceProject(p.status)) return false;
        if (projectStatusFilter === 'Completed' && !isCompletedProject(p.status)) return false;
      }
      if (projectSearch) {
        const query = projectSearch.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(query);
        const orgMatch = (p.organizationName || '').toLowerCase().includes(query);
        const contactMatch = (p.contactPersonName || '').toLowerCase().includes(query);
        if (!nameMatch && !orgMatch && !contactMatch) return false;
      }
      return true;
    });
  }, [projects, projectSearch, projectStatusFilter]);

  // Handle Export PDF Dossier
  const handleExportPdf = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const kpis = [
      { label: 'Planned Touchpoints', value: totalTouchpoints, color: 'primary' as const },
      { label: 'Completed Deliveries', value: completedTouchpoints, color: 'success' as const },
      { label: 'Skipped Outreach', value: skippedTouchpoints, color: 'danger' as const },
      { label: 'SLA Adherence', value: `${overallSlaRate}%`, color: 'success' as const },
      { label: 'Average CSAT', value: `${avgFeedbackScore} / 5.0`, color: 'warning' as const },
    ];

    if (activeReportTab === 'sla-velocity') {
      const rows = filteredSchedules.map((s) => {
        const rate = s.totalItems > 0 ? Math.round((s.completedItems / s.totalItems) * 100) : 0;
        const statusLabel = isCompletedSchedule(s.status)
          ? 'Completed'
          : isActiveSchedule(s.status)
          ? 'Active'
          : 'Draft';
        return [
          `Yr ${s.year} Wk ${s.weekNumber}`,
          new Date(s.weekStartDate).toLocaleDateString(),
          new Date(s.weekEndDate).toLocaleDateString(),
          s.totalItems,
          s.completedItems,
          s.skippedItems,
          s.pendingItems,
          `${rate}%`,
          statusLabel,
        ];
      });

      exportToPdf({
        fileName: `Executive_SLA_Velocity_${dateStr}.pdf`,
        title: 'Executive Operating Cycles & SLA Velocity Audit',
        subtitle: 'Formal Portfolio SLA Performance & Touchpoints Compliance Dossier',
        authorOrRole: 'Executive Director Office',
        kpis,
        sections: [
          {
            title: 'Operating Cycles Execution Matrix',
            columns: ['Cycle', 'Start Date', 'End Date', 'Planned', 'Done', 'Skip', 'Pend', 'SLA %', 'Status'],
            columnWidths: [2, 2, 2, 1.2, 1.2, 1.2, 1.2, 1.4, 1.6],
            rows,
          },
        ],
        notes: [
          'SLA Adherence reflects completed touchpoints against planned baseline schedules.',
          'Audit generated from certified system operational records.',
        ],
      });
    } else if (activeReportTab === 'customer-feedback') {
      const rows = filteredFeedbacks.map((f) => [
        f.organizationName || 'N/A',
        f.projectName || 'N/A',
        f.moduleName || 'General',
        f.assignedUserFullName || 'Specialist',
        f.rating ? `${f.rating} / 5` : 'N/A',
        f.priority || 'Medium',
        f.status || 'Resolved',
        f.remarks ? f.remarks.slice(0, 35) : 'Routine inspection verified',
      ]);

      exportToPdf({
        fileName: `Executive_Customer_Feedback_Dossier_${dateStr}.pdf`,
        title: 'Customer Satisfaction (CSAT) & Quality Audit Dossier',
        subtitle: 'Client Experience Evaluations, Specialist Accountability & Sentiment Ratings',
        authorOrRole: 'Executive Director Office',
        kpis,
        sections: [
          {
            title: 'Logged Customer Feedback & Ratings',
            columns: ['Organization', 'Project', 'Module', 'Specialist', 'CSAT', 'Priority', 'Status', 'Customer Remarks'],
            columnWidths: [2.5, 2.2, 2, 2.2, 1.2, 1.4, 1.4, 3.5],
            rows,
          },
        ],
        notes: [
          'CSAT audits include customer-confirmed ratings collected upon touchpoint completion.',
        ],
      });
    } else if (activeReportTab === 'customer-tenants') {
      const rows = filteredOrganizations.map((o) => [
        o.name,
        o.email || 'N/A',
        o.phoneNumber || o.phone || 'N/A',
        o.projectCount || 0,
        o.isActive ? 'Active Contract' : 'Archived',
      ]);

      exportToPdf({
        fileName: `Executive_Customer_Tenants_Audit_${dateStr}.pdf`,
        title: 'Customer Tenants & Enterprise Portfolio Audit',
        subtitle: 'Enterprise Client Directory, Contract Status & Implementation Footprint',
        authorOrRole: 'Executive Director Office',
        kpis: [
          { label: 'Total Tenants', value: organizations.length, color: 'primary' },
          { label: 'Active Contracts', value: organizations.filter((o) => o.isActive).length, color: 'success' },
          { label: 'Deployed Projects', value: projects.length, color: 'warning' },
        ],
        sections: [
          {
            title: 'Customer Tenant Directory',
            columns: ['Organization Name', 'Enterprise Contact Email', 'Phone Number', 'Projects', 'Contract Status'],
            columnWidths: [3, 3.5, 2.2, 1.4, 2],
            rows,
          },
        ],
      });
    } else if (activeReportTab === 'projects-delivery') {
      const rows = filteredProjectsList.map((p) => [
        p.name,
        p.organizationName || 'N/A',
        p.moduleCount || 0,
        p.contactPersonName || 'Stakeholder',
        p.contactPersonPhone || '—',
        isActiveProject(p.status) ? 'Active' : isMaintenanceProject(p.status) ? 'Maintenance' : 'Completed',
      ]);

      exportToPdf({
        fileName: `Executive_Projects_Deliveries_Audit_${dateStr}.pdf`,
        title: 'Solutions Projects & Operational Deliveries Audit',
        subtitle: 'Active Solution Deployments, Architectural Modules, and Delivery Milestones',
        authorOrRole: 'Executive Director Office',
        kpis: [
          { label: 'Total Projects', value: projects.length, color: 'primary' },
          { label: 'Active Deployments', value: projects.filter((p) => isActiveProject(p.status)).length, color: 'success' },
          { label: 'Maintenance Phase', value: projects.filter((p) => isMaintenanceProject(p.status)).length, color: 'warning' },
        ],
        sections: [
          {
            title: 'Project Portfolio & Delivery Footprint',
            columns: ['Project Name', 'Client Organization', 'Modules', 'Stakeholder', 'Phone', 'Status'],
            columnWidths: [2.8, 2.8, 1.2, 2.2, 2, 1.8],
            rows,
          },
        ],
      });
    } else {
      const rows = supportSpecialists.map((u) => {
        const userProjects = assignments.filter((a) => a.userId === u.id && a.isActive).length;
        return [
          u.fullName,
          u.email,
          'Support Specialist',
          userProjects,
          u.isActive ? 'Active Duty' : 'Inactive',
        ];
      });

      exportToPdf({
        fileName: `Executive_Workforce_Utilization_${dateStr}.pdf`,
        title: 'Support Specialist Workforce Capacity & Utilization Report',
        subtitle: 'Team Member Project Deployments and Active Specialist Readiness',
        authorOrRole: 'Executive Director Office',
        kpis: [
          { label: 'Total Specialists', value: supportSpecialists.length, color: 'primary' },
          { label: 'Assigned Staff', value: assignedAgentsCount, color: 'success' },
          { label: 'Utilization Rate', value: `${specialistUtilization}%`, color: 'warning' },
          { label: 'Active Projects', value: projects.length, color: 'primary' },
        ],
        sections: [
          {
            title: 'Specialist Allocation Roster',
            columns: ['Specialist Name', 'Email Address', 'Operational Role', 'Assigned Projects', 'Readiness Status'],
            columnWidths: [2.5, 3.5, 2.5, 1.8, 1.8],
            rows,
          },
        ],
      });
    }
  };

  // Handle Export Executive Presentation (.pptx)
  const handleExportPptx = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPptx({
      fileName: `Executive_Support_Briefing_${dateStr}.pptx`,
      title: 'Executive Support Governance & Operational Review',
      subtitle: 'Portfolio Delivery Velocity, SLA Compliance & Customer Satisfaction Dossier',
      company: 'Directorate of Customer Experience & Support Operations',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      slides: [
        {
          title: 'Executive Operational Performance & SLA Velocity',
          subtitle: 'High-level benchmarks across active operating cycles and enterprise support commitments',
          kpis: [
            { label: 'Total Touchpoints Planned', value: totalTouchpoints },
            { label: 'Successfully Completed', value: completedTouchpoints, color: 'success' },
            { label: 'SLA Adherence Rate', value: `${overallSlaRate}%`, color: 'success' },
            { label: 'Average Customer CSAT', value: `${avgFeedbackScore} ★`, color: 'primary' },
          ],
          bulletPoints: [
            `Portfolio completed ${completedTouchpoints} customer touchpoints out of ${totalTouchpoints} planned across operating cycles.`,
            `Overall SLA execution adherence is performing at ${overallSlaRate}%, adhering to enterprise customer service benchmarks.`,
            `Customer sentiment benchmark remains strong with an average rating of ${avgFeedbackScore} out of 5.0 stars.`,
            `Proactive cadence monitoring prevented escalations across all enterprise tenant accounts.`,
          ],
        },
        {
          title: 'Customer Satisfaction (CSAT) & Quality Dossier',
          subtitle: 'Granular evaluation of customer feedback, specialist accountability, and sentiment scores',
          kpis: [
            { label: 'Total Feedback Audits', value: feedbacks.length },
            { label: 'Positive Sentiment Score', value: `${avgFeedbackScore} / 5.0`, color: 'success' },
            { label: 'Active Customer Tenants', value: organizations.length },
            { label: 'Supported Projects', value: projects.length },
          ],
          bulletPoints: [
            'Automated and manual audits ensure prompt response times and positive client engagement ratings.',
            'Feedback mechanisms provide continuous visibility into customer satisfaction and product stability.',
            'Critical priority inquiries are prioritized and tracked directly by team leads and specialists.',
          ],
        },
        {
          title: 'Workforce Capacity & Strategic Allocation',
          subtitle: 'Specialist resource allocation, project coverage, and forward readiness',
          kpis: [
            { label: 'Support Specialists', value: supportSpecialists.length },
            { label: 'Assigned Specialists', value: assignedAgentsCount, color: 'success' },
            { label: 'Workforce Utilization', value: `${specialistUtilization}%`, color: 'warning' },
            { label: 'Live Deployments', value: projects.length },
          ],
          bulletPoints: [
            `${assignedAgentsCount} of ${supportSpecialists.length} specialists are currently assigned to active enterprise customer projects.`,
            `Specialist allocation utilization is balanced at ${specialistUtilization}%, allowing flexible surge capacity.`,
            'Continuous training and cross-project coverage ensure zero single-point-of-failure vulnerabilities.',
          ],
        },
      ],
    });
  };

  return (
    <div className="report-container">
      {/* Executive Header & Export Bar */}
      <div className="view-headline-row flex-wrap gap-3">
        <div>
          <h2 className="view-title">Executive Reports</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportPdf} title="Export PDF dossier">
            <PdfIcon size={14} />
            <span>Export PDF</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportPptx} title="Export briefing deck">
            <PptxIcon size={14} />
            <span>Export Deck (.pptx)</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()} title="Print report">
            <span>🖨️ Print</span>
          </Button>

          <Button variant="primary" size="sm" onClick={loadReportData} disabled={isRefreshing}>
            <RefreshIcon size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Sync Audit Data</span>
          </Button>
        </div>
      </div>

      {reportError && (
        <Alert variant="danger" message={reportError} onClose={() => setReportError(null)} />
      )}

      {/* Merged Navigation Tab Bar: 5 Comprehensive Report Modules */}
      <div className="executive-filter-pills mt-3 flex-wrap">
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'sla-velocity' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('sla-velocity')}
        >
          <ClockIcon size={14} />
          <span>SLA Delivery & Cycle Velocity</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'customer-feedback' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('customer-feedback')}
        >
          <StarIcon size={14} />
          <span>Customer Satisfaction & Feedback</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'customer-tenants' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('customer-tenants')}
        >
          <BuildingIcon size={14} />
          <span>Customer Tenants</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'projects-delivery' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('projects-delivery')}
        >
          <ProjectIcon size={14} />
          <span>Projects & Deliveries</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'workforce-utilization' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('workforce-utilization')}
        >
          <UsersIcon size={14} />
          <span>Workforce Capacity & Allocation</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SLA DELIVERY & CYCLE VELOCITY TAB */}
      {/* ========================================================================= */}
      {activeReportTab === 'sla-velocity' && (
        <div className="mt-4">
          {/* Year Filter Bar */}
          <div className="feedback-filter-bar mb-4">
            <div className="feedback-filter-group" style={{ minWidth: 160 }}>
              <label className="text-xs font-semibold text-muted mb-1 block">Operating Year</label>
              <select
                className="feedback-filter-select"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Operating Years</option>
                <option value="2026">2026 Operating Cycle</option>
                <option value="2025">2025 Operating Cycle</option>
              </select>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header-with-action">
              <h3 className="card-title">Schedule Execution Velocity</h3>
            </div>

            <div className="table-responsive">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>OPERATING CYCLE</th>
                    <th>CYCLE DURATION</th>
                    <th>PLANNED TOUCHPOINTS</th>
                    <th>EXECUTED / COMPLETED</th>
                    <th>SKIPPED / BLOCKERS</th>
                    <th>PENDING</th>
                    <th>SLA ADHERENCE %</th>
                    <th>CYCLE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-6 text-muted">
                        No schedule cycles found for year {filterYear || 'All'}.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((s) => {
                      const rate = s.totalItems > 0 ? Math.round((s.completedItems / s.totalItems) * 100) : 0;
                      return (
                        <tr key={s.id}>
                          <td className="font-bold text-dark text-xs">
                            Year {s.year} • Week {s.weekNumber}
                          </td>
                          <td className="text-xs text-muted">
                            {new Date(s.weekStartDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            —{' '}
                            {new Date(s.weekEndDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="font-bold text-dark text-xs">{s.totalItems}</td>
                          <td className="font-bold text-success text-xs">{s.completedItems}</td>
                          <td className="font-bold text-danger text-xs">{s.skippedItems}</td>
                          <td className="font-bold text-warning text-xs">{s.pendingItems}</td>
                          <td>
                            <span className="font-bold text-xs text-dark">{rate}%</span>
                          </td>
                          <td>
                            <Badge
                              variant={
                                isCompletedSchedule(s.status)
                                  ? 'success'
                                  : isActiveSchedule(s.status)
                                  ? 'accent'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {isCompletedSchedule(s.status)
                                ? 'Completed'
                                : isActiveSchedule(s.status)
                                ? 'Active Cycle'
                                : 'Draft'}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOMER SATISFACTION & FEEDBACK TAB (Rich Table + Cascading Filters + View Details Modal) */}
      {/* ========================================================================= */}
      {activeReportTab === 'customer-feedback' && (
        <div className="mt-4">
          <div className="dashboard-card mb-4">
            <div className="card-header-with-action flex-wrap gap-3">
              <h3 className="card-title">Customer Feedback</h3>
              <Badge variant="warning" size="sm">
                Average Rating: {avgFeedbackScore} ★
              </Badge>
            </div>

            {/* Cascading Filter Controls Bar */}
            <div className="feedback-filter-bar mt-3 pt-3 border-t">
              <div className="feedback-filter-group" style={{ minWidth: 180 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Organization</label>
                <select
                  className="feedback-filter-select"
                  value={filterOrgId}
                  onChange={(e) => {
                    setFilterOrgId(e.target.value);
                    setFilterProjectId('');
                    setFilterModuleId('');
                  }}
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
                  <option value="">All Specialists ({supportSpecialists.length})</option>
                  {supportSpecialists.map((agent) => (
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

              {hasActiveFeedbackFilters && (
                <div className="feedback-filter-group" style={{ alignSelf: 'flex-end' }}>
                  <Button variant="ghost" size="sm" onClick={resetFeedbackFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Results Counter & Context Pills */}
            <div className="flex items-center justify-between mt-3 pt-2 text-xs text-muted border-t">
              <div className="flex items-center gap-2">
                <span>
                  Showing <b className="text-dark">{filteredFeedbacks.length}</b> customer feedback records
                  {hasActiveFeedbackFilters && ' matching active filter criteria'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Table View */}
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
                  {filteredFeedbacks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted">
                        <div className="flex justify-center mb-2">
                          <MessageSquareIcon size={24} />
                        </div>
                        <p className="font-semibold text-dark text-sm">No Customer Feedbacks Found</p>
                        <p className="text-xs text-muted mt-1">
                          {hasActiveFeedbackFilters
                            ? 'No entries match your chosen filter criteria. Try clearing or relaxing filters.'
                            : 'Customer touchpoint records and ratings will appear here as schedules are completed.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredFeedbacks.map((fb) => (
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

                        <td style={{ maxWidth: 280 }}>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CUSTOMER TENANTS TAB (Organizations Audit Table) */}
      {/* ========================================================================= */}
      {activeReportTab === 'customer-tenants' && (
        <div className="mt-4">
          <div className="dashboard-card mb-4">
            <div className="card-header-with-action flex-wrap gap-3">
              <h3 className="card-title">Customer Tenants</h3>
            </div>

            {/* Tenant Search Bar */}
            <div className="feedback-filter-bar mt-3 pt-3 border-t">
              <div className="feedback-filter-group" style={{ flex: 1, minWidth: 260 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Search Customer Tenants</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="feedback-filter-input"
                    style={{ width: '100%', paddingLeft: 28 }}
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
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

              {tenantSearch && (
                <div className="feedback-filter-group" style={{ alignSelf: 'flex-end' }}>
                  <Button variant="ghost" size="sm" onClick={() => setTenantSearch('')}>
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="table-responsive">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>CUSTOMER TENANT</th>
                    <th>PRIMARY CONTACT EMAIL</th>
                    <th>TELEPHONE NUMBER</th>
                    <th>DEPLOYED PROJECTS</th>
                    <th>ARCHITECTURE MODULES</th>
                    <th>CONTRACT STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-6 text-muted">
                        No customer organizations found matching "{tenantSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredOrganizations.map((org) => {
                      const orgProjects = projects.filter((p) => p.organizationId === org.id);
                      const orgModulesCount = orgProjects.reduce((acc, p) => acc + (p.moduleCount || 0), 0);
                      return (
                        <tr key={org.id}>
                          <td>
                            <div className="font-bold text-dark text-xs">{org.name}</div>
                            {org.address && <div className="text-xs text-muted">{org.address}</div>}
                          </td>
                          <td className="font-mono text-xs text-muted">{org.email || '—'}</td>
                          <td className="font-mono text-xs">{org.phoneNumber || org.phone || '—'}</td>
                          <td>
                            <Badge variant="purple" size="sm">
                              {orgProjects.length} Projects
                            </Badge>
                          </td>
                          <td className="font-semibold text-muted text-xs">
                            {orgModulesCount} Modules
                          </td>
                          <td>
                            <Badge variant={org.isActive ? 'success' : 'neutral'} dot size="sm">
                              {org.isActive ? 'Active Contract' : 'Inactive'}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PROJECTS & DELIVERIES TAB (Solutions Projects Audit Table) */}
      {/* ========================================================================= */}
      {activeReportTab === 'projects-delivery' && (
        <div className="mt-4">
          <div className="dashboard-card mb-4">
            <div className="card-header-with-action flex-wrap gap-3">
              <h3 className="card-title">Projects & Deliveries</h3>
            </div>

            {/* Filter Bar for Projects */}
            <div className="feedback-filter-bar mt-3 pt-3 border-t">
              <div className="feedback-filter-group" style={{ flex: 1, minWidth: 260 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Search Projects / Clients</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="feedback-filter-input"
                    style={{ width: '100%', paddingLeft: 28 }}
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
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

              <div className="feedback-filter-group" style={{ minWidth: 160 }}>
                <label className="text-xs font-semibold text-muted mb-1 block">Lifecycle Status</label>
                <select
                  className="feedback-filter-select"
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active Deployment</option>
                  <option value="Maintenance">Maintenance Phase</option>
                  <option value="Completed">Completed / Archived</option>
                </select>
              </div>

              {(projectSearch || projectStatusFilter) && (
                <div className="feedback-filter-group" style={{ alignSelf: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProjectSearch('');
                      setProjectStatusFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="table-responsive">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>PROJECT SOLUTION</th>
                    <th>CUSTOMER TENANT</th>
                    <th>MODULES COUNT</th>
                    <th>PRIMARY STAKEHOLDER</th>
                    <th>CONTACT TELEPHONE</th>
                    <th>LIFECYCLE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjectsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-6 text-muted">
                        No projects found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProjectsList.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="font-bold text-dark text-xs">{p.name}</div>
                          {p.code && <div className="text-xs font-mono text-muted">{p.code}</div>}
                        </td>
                        <td>
                          <div className="font-semibold text-dark text-xs">
                            {p.organizationName || 'Client Org'}
                          </div>
                        </td>
                        <td>
                          <Badge variant="neutral" size="sm">
                            <ModuleIcon size={11} /> {p.moduleCount || 0} Modules
                          </Badge>
                        </td>
                        <td>
                          <div className="font-medium text-dark text-xs">
                            {p.contactPersonName || 'Primary Lead'}
                          </div>
                          {p.contactPersonEmail && (
                            <div className="text-xs text-muted font-mono">{p.contactPersonEmail}</div>
                          )}
                        </td>
                        <td className="font-mono text-xs">{p.contactPersonPhone || '—'}</td>
                        <td>
                          <Badge
                            variant={
                              isActiveProject(p.status)
                                ? 'success'
                                : isMaintenanceProject(p.status)
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {isActiveProject(p.status)
                              ? 'Active'
                              : isMaintenanceProject(p.status)
                              ? 'Maintenance'
                              : 'Completed'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WORKFORCE CAPACITY & ALLOCATION TAB (Specialist Utilization Table) */}
      {/* ========================================================================= */}
      {activeReportTab === 'workforce-utilization' && (
        <div className="mt-4">
          <div className="dashboard-card">
            <div className="card-header-with-action">
              <h3 className="card-title">Workforce Capacity</h3>
            </div>

            <div className="table-responsive">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>SPECIALIST NAME</th>
                    <th>EMAIL ADDRESS</th>
                    <th>ASSIGNED PROJECTS</th>
                    <th>ASSIGNMENT LOAD</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {supportSpecialists.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-6 text-muted">
                        No support specialists currently registered on roster.
                      </td>
                    </tr>
                  ) : (
                    supportSpecialists.map((u) => {
                      const assignedCount = assignments.filter((a) => a.userId === u.id && a.isActive).length;
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="font-bold text-dark text-xs">{u.fullName}</div>
                            <div className="text-xs text-muted">@{u.userName}</div>
                          </td>
                          <td className="font-mono text-xs text-muted">{u.email}</td>
                          <td>
                            <Badge variant={assignedCount > 0 ? 'purple' : 'neutral'} size="sm">
                              {assignedCount} Assigned Projects
                            </Badge>
                          </td>
                          <td>
                            <span className="text-xs font-semibold text-dark">
                              {assignedCount > 0 ? `${assignedCount} active` : 'Available'}
                            </span>
                          </td>
                          <td>
                            <Badge variant={u.isActive ? 'success' : 'danger'} dot size="sm">
                              {u.isActive ? 'Active Duty' : 'Inactive'}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* Executive Feedback Dossier Audit Modal */}
      {/* ========================================================================= */}
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
