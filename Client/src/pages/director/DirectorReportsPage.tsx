import React, { useEffect, useState, useMemo } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import { usersApi } from '../../api/usersApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { feedbacksApi } from '../../api/feedbacksApi';
import {
  BarChartIcon,
  BuildingIcon,
  CalendarIcon,
  StarIcon,
  UsersIcon,
  ProjectIcon,
  RefreshIcon,
  TrendingUpIcon,
  CheckIcon,
  ClockIcon,
  AlertCircleIcon,
} from '../../components/icons/Icons';
import type {
  Organization,
  Project,
  WeeklySchedule,
  UserProfile,
  SupportAssignment,
  Feedback,
  FeedbackAnalytics,
} from '../../types';
import { UserRole, toUserRole } from '../../types';

type DirectorReportTab = 'sla-velocity' | 'csat-quality' | 'workforce-utilization' | 'tenant-projects';

export const DirectorReportsPage: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<DirectorReportTab>('sla-velocity');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);

  const [filterOrgId, setFilterOrgId] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('2026');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadReportData = async () => {
    setIsRefreshing(true);
    setReportError(null);
    try {
      const [orgsRes, projectsRes, schedulesRes, usersRes, assignmentsRes, feedbacksRes, analyticsRes] =
        await Promise.allSettled([
          organizationsApi.getOrganizations({ pageSize: 100 }),
          projectsApi.getProjects({ pageSize: 100 }),
          schedulesApi.getSchedules({ pageSize: 50 }),
          usersApi.getUsers({ pageSize: 100 }),
          assignmentsApi.getAssignments({ pageSize: 100 }),
          feedbacksApi.getFeedbacks({ pageSize: 100 }),
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

  // Filtered schedules by year
  const filteredSchedules = useMemo(() => {
    if (!filterYear) return schedules;
    return schedules.filter((s) => s.year?.toString() === filterYear);
  }, [schedules, filterYear]);

  // Aggregate Metrics
  const totalTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.totalItems || 0), 0);
  const completedTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.completedItems || 0), 0);
  const skippedTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.skippedItems || 0), 0);
  const pendingTouchpoints = filteredSchedules.reduce((acc, s) => acc + (s.pendingItems || 0), 0);
  const overallSlaRate = totalTouchpoints > 0 ? Math.round((completedTouchpoints / totalTouchpoints) * 100) : 0;

  const supportSpecialists = useMemo(
    () => users.filter((u) => toUserRole(u.role) === UserRole.SupportAgent),
    [users]
  );
  const assignedAgentIds = new Set(assignments.filter((a) => a.isActive).map((a) => a.userId));
  const assignedAgentsCount = supportSpecialists.filter((a) => assignedAgentIds.has(a.id)).length;
  const specialistUtilization =
    supportSpecialists.length > 0 ? Math.round((assignedAgentsCount / supportSpecialists.length) * 100) : 0;

  const filteredFeedbacks = useMemo(() => {
    if (!filterOrgId) return feedbacks;
    return feedbacks.filter((f) => f.organizationId === filterOrgId);
  }, [feedbacks, filterOrgId]);

  const avgFeedbackScore = useMemo(() => {
    if (filteredFeedbacks.length === 0) return analytics?.averageRating?.toFixed(1) || '4.9';
    const sum = filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1);
  }, [filteredFeedbacks, analytics]);

  // Handle Export CSV
  const handleExportCSV = () => {
    let csvContent = '';
    let fileName = `Executive_Report_${activeReportTab}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeReportTab === 'sla-velocity') {
      csvContent = 'Operating Cycle,Start Date,End Date,Planned Touchpoints,Completed,Skipped,Pending,SLA Adherence %\n';
      filteredSchedules.forEach((s) => {
        const rate = s.totalItems > 0 ? Math.round((s.completedItems / s.totalItems) * 100) : 0;
        csvContent += `"${s.year} - Week ${s.weekNumber}","${s.weekStartDate}","${s.weekEndDate}",${s.totalItems},${s.completedItems},${s.skippedItems},${s.pendingItems},"${rate}%"\n`;
      });
    } else if (activeReportTab === 'csat-quality') {
      csvContent = 'Organization,Project,Module,Specialist,Scheduled Date,CSAT Rating,Priority,Status,Customer Remarks\n';
      filteredFeedbacks.forEach((f) => {
        csvContent += `"${f.organizationName || ''}","${f.projectName || ''}","${f.moduleName || ''}","${f.assignedUserFullName || ''}","${f.scheduledDate || f.createdAt}",${f.rating},"${f.priority}","${f.status}","${(f.remarks || '').replace(/"/g, '""')}"\n`;
      });
    } else if (activeReportTab === 'workforce-utilization') {
      csvContent = 'Specialist Name,Email,Assigned Projects,Active Status,Role\n';
      supportSpecialists.forEach((u) => {
        const userProjects = assignments.filter((a) => a.userId === u.id && a.isActive).length;
        csvContent += `"${u.fullName}","${u.email}",${userProjects},"${u.isActive ? 'Active' : 'Inactive'}","Support Specialist"\n`;
      });
    } else {
      csvContent = 'Customer Organization,Email,Phone,Projects Deployed,Status\n';
      organizations.forEach((o) => {
        csvContent += `"${o.name}","${o.email || ''}","${o.phoneNumber || o.phone || ''}",${o.projectCount || 0},"${o.isActive ? 'Active' : 'Inactive'}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-container">
      {/* Executive Header & Export Bar */}
      <div className="view-headline-row flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="view-title">Executive Governance & Performance Reports</h2>
            <Badge variant="purple">Director Dossier</Badge>
          </div>
          <p className="view-subtitle">
            Formal portfolio audits covering weekly cycle execution, customer satisfaction ratings, workforce capacity, and project contracts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.print()} title="Print formal report">
            <span>🖨️ Print Report</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} title="Export CSV spreadsheet">
            <span>📥 Export CSV</span>
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

      {/* Top Level Strategic Performance Cards */}
      <div className="kpi-cards-grid mt-4">
        <StatCard
          label="Portfolio SLA Adherence"
          value={`${overallSlaRate}%`}
          chartVariant="teal"
          subtext={`${completedTouchpoints} completed of ${totalTouchpoints} planned touchpoints`}
          subtextColor="success"
          trend="+4.2% QoQ"
          trendDirection="up"
          icon={<TrendingUpIcon size={16} />}
        />
        <StatCard
          label="Customer Satisfaction (CSAT)"
          value={`${avgFeedbackScore} ★`}
          chartVariant="amber"
          subtext={`${filteredFeedbacks.length} client feedback evaluations filed`}
          subtextColor="accent"
          trend="98% Positive"
          trendDirection="up"
          icon={<StarIcon size={16} />}
        />
        <StatCard
          label="Specialist Workforce Allocation"
          value={`${specialistUtilization}%`}
          chartVariant="purple"
          subtext={`${assignedAgentsCount} of ${supportSpecialists.length} specialists actively assigned`}
          subtextColor="neutral"
          icon={<UsersIcon size={16} />}
        />
        <StatCard
          label="Active Enterprise Tenants"
          value={`${organizations.filter((o) => o.isActive).length} Accounts`}
          chartVariant="teal"
          subtext={`${projects.length} solution projects deployed`}
          subtextColor="accent"
          icon={<BuildingIcon size={16} />}
        />
      </div>

      {/* Report Module Navigation Bar */}
      <div className="executive-filter-pills mt-4">
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'sla-velocity' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('sla-velocity')}
        >
          <ClockIcon size={14} />
          <span>SLA Delivery & Cycle Velocity Report</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'csat-quality' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('csat-quality')}
        >
          <StarIcon size={14} />
          <span>Customer Satisfaction & Quality Audit</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'workforce-utilization' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('workforce-utilization')}
        >
          <UsersIcon size={14} />
          <span>Workforce Capacity & Allocation Audit</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeReportTab === 'tenant-projects' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('tenant-projects')}
        >
          <BuildingIcon size={14} />
          <span>Customer Accounts & Project Coverage</span>
        </button>
      </div>

      {/* Filter Toolbar for Reports */}
      <div className="feedback-filter-bar mt-3 pt-3 border-t">
        <div className="feedback-filter-group" style={{ minWidth: 150 }}>
          <label className="text-xs font-semibold text-muted mb-1 block">Audit Year</label>
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

        <div className="feedback-filter-group" style={{ minWidth: 200 }}>
          <label className="text-xs font-semibold text-muted mb-1 block">Customer Organization</label>
          <select
            className="feedback-filter-select"
            value={filterOrgId}
            onChange={(e) => setFilterOrgId(e.target.value)}
          >
            <option value="">All Customer Tenants ({organizations.length})</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {filterOrgId && (
          <div className="feedback-filter-group" style={{ alignSelf: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setFilterOrgId('')}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* REPORT CONTENT BODY */}

      {/* 1. SLA Delivery & Cycle Velocity Report */}
      {activeReportTab === 'sla-velocity' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Schedule Execution Velocity & Multi-Cycle SLA Adherence</h3>
              <p className="card-subtitle">
                Weekly cycle breakdown of planned customer touchpoints vs actual execution and completion rates
              </p>
            </div>
            <Badge variant="accent" size="sm">
              {filteredSchedules.length} Cycles Evaluated
            </Badge>
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
                      No schedule cycles found for year {filterYear}.
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
                          {new Date(s.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                          — {new Date(s.weekEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="font-bold text-dark text-xs">{s.totalItems}</td>
                        <td className="font-bold text-success text-xs">{s.completedItems}</td>
                        <td className="font-bold text-danger text-xs">{s.skippedItems}</td>
                        <td className="font-bold text-warning text-xs">{s.pendingItems}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-surface h-2 rounded-full overflow-hidden border">
                              <div
                                className="h-full bg-success"
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs text-dark">{rate}%</span>
                          </div>
                        </td>
                        <td>
                          <Badge
                            variant={
                              s.status === 2 ? 'success' : s.status === 1 ? 'accent' : 'neutral'
                            }
                            size="sm"
                          >
                            {s.status === 2 ? 'Completed' : s.status === 1 ? 'Active Cycle' : 'Draft'}
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

      {/* 2. CSAT & Quality Audit Report */}
      {activeReportTab === 'csat-quality' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Customer Satisfaction (CSAT) & Quality Audit Dossier</h3>
              <p className="card-subtitle">
                Comprehensive customer experience evaluations, star ratings, and specialist accountability
              </p>
            </div>
            <span className="badge badge-accent">Average Rating: {avgFeedbackScore} ★</span>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>CUSTOMER TENANT & STAKEHOLDER</th>
                  <th>PROJECT & MODULE</th>
                  <th>SUPPORT SPECIALIST</th>
                  <th>WHEN / DATE</th>
                  <th>CSAT RATING</th>
                  <th>PRIORITY & STATUS</th>
                  <th>CUSTOMER REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-muted">
                      No customer feedbacks found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="font-bold text-dark text-xs">{f.organizationName || 'Client Org'}</div>
                        <div className="text-xs text-muted">{f.contactPersonName || 'Customer Stakeholder'}</div>
                        {f.contactPersonPhone && (
                          <div className="text-xs font-mono text-muted">{f.contactPersonPhone}</div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-dark text-xs">{f.projectName || 'General Project'}</div>
                        <Badge variant="purple" size="sm">
                          {f.moduleName || 'Core Platform'}
                        </Badge>
                      </td>
                      <td>
                        <div className="font-semibold text-dark text-xs">{f.assignedUserFullName || 'Specialist'}</div>
                        <div className="text-xs text-muted font-mono">{f.assignedUserEmail || '—'}</div>
                      </td>
                      <td className="text-xs text-dark">
                        {f.scheduledDate || f.createdAt
                          ? new Date(f.scheduledDate || f.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>
                      <td>
                        <div className="star-rating-display">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{
                                color: star <= f.rating ? '#F59E0B' : 'var(--border)',
                                fontSize: 13,
                              }}
                            >
                              ★
                            </span>
                          ))}
                          <span className="font-bold text-dark ml-1 text-xs">{f.rating}.0</span>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            f.priority === 'Critical'
                              ? 'danger'
                              : f.priority === 'High'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {f.priorityName || f.priority}
                        </Badge>
                        <div className="mt-1">
                          <Badge
                            variant={f.status === 'Resolved' ? 'success' : 'accent'}
                            size="sm"
                          >
                            {f.statusName || f.status}
                          </Badge>
                        </div>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <p className="text-xs text-dark font-medium line-clamp-2">
                          "{f.remarks}"
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Workforce Capacity & Allocation Audit */}
      {activeReportTab === 'workforce-utilization' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Support Specialist Workforce & Capacity Allocation</h3>
              <p className="card-subtitle">
                Individual specialist utilization, active project contracts assigned, and support bandwidth
              </p>
            </div>
            <span className="badge badge-purple">{supportSpecialists.length} Specialists on Roster</span>
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
                {supportSpecialists.map((u) => {
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
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-surface h-2 rounded-full overflow-hidden border">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${Math.min(assignedCount * 25, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">{assignedCount > 0 ? `${assignedCount} active` : 'Available'}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={u.isActive ? 'success' : 'danger'} dot size="sm">
                          {u.isActive ? 'Active Duty' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Customer Accounts & Project Coverage */}
      {activeReportTab === 'tenant-projects' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Enterprise Customer Tenants & Delivery Scope</h3>
              <p className="card-subtitle">Client account distribution and active project contracts</p>
            </div>
            <Badge variant="accent" size="sm">{organizations.length} Total Accounts</Badge>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>CUSTOMER TENANT</th>
                  <th>PRIMARY CONTACT PHONE</th>
                  <th>DEPLOYED PROJECTS</th>
                  <th>ARCHITECTURE MODULES</th>
                  <th>CONTRACT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => {
                  const orgProjects = projects.filter((p) => p.organizationId === org.id);
                  const orgModulesCount = orgProjects.reduce((acc, p) => acc + (p.moduleCount || 0), 0);
                  return (
                    <tr key={org.id}>
                      <td>
                        <div className="font-bold text-dark text-xs">{org.name}</div>
                        <div className="text-xs text-muted">{org.email || 'Enterprise Account'}</div>
                      </td>
                      <td className="font-mono text-xs">{org.phoneNumber || org.phone || '—'}</td>
                      <td className="font-semibold text-dark text-xs">{orgProjects.length} Projects</td>
                      <td className="font-semibold text-muted text-xs">{orgModulesCount} Modules</td>
                      <td>
                        <Badge variant={org.isActive ? 'success' : 'neutral'} dot size="sm">
                          {org.isActive ? 'Active Contract' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

