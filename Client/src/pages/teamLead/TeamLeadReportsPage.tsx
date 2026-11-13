import React, { useEffect, useState, useMemo } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { schedulesApi } from '../../api/schedulesApi';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { usersApi } from '../../api/usersApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import {
  BarChartIcon,
  AlertTriangleIcon,
  CheckSquareIcon,
  CalendarIcon,
  UsersIcon,
  BuildingIcon,
  RefreshIcon,
  SearchIcon,
  FilterIcon,
  TrendingUpIcon,
  ClockIcon,
} from '../../components/icons/Icons';
import type {
  WeeklySchedule,
  ScheduleItem,
  Organization,
  Project,
  UserProfile,
  SupportAssignment,
} from '../../types';
import {
  ScheduleItemStatus,
  isCompletedTouchpoint,
  isSkippedTouchpoint,
  isPendingTouchpoint,
  isActiveSchedule,
  isCompletedSchedule,
} from '../../types';

type TeamLeadReportTab = 'incomplete-tasks' | 'cycle-execution' | 'specialist-performance' | 'tenant-coverage';

export const TeamLeadReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeamLeadReportTab>('incomplete-tasks');
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);

  const [filterSpecialistId, setFilterSpecialistId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('incomplete'); // 'all' | 'incomplete' | 'completed'
  const [filterSearch, setFilterSearch] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    setPageError(null);
    try {
      const [schedulesRes, orgsRes, projectsRes, usersRes, assignmentsRes] = await Promise.allSettled([
        schedulesApi.getSchedules({ pageSize: 50 }),
        organizationsApi.getOrganizations({ pageSize: 100 }),
        projectsApi.getProjects({ pageSize: 100 }),
        usersApi.getUsers({ pageSize: 100 }),
        assignmentsApi.getAssignments({ pageSize: 100 }),
      ]);

      let loadedSchedules: WeeklySchedule[] = [];
      if (schedulesRes.status === 'fulfilled') {
        loadedSchedules = schedulesRes.value.items || [];
        setSchedules(loadedSchedules);
        if (loadedSchedules.length > 0 && !selectedScheduleId) {
          setSelectedScheduleId(loadedSchedules[0].id);
        }
      }
      if (orgsRes.status === 'fulfilled') setOrganizations(orgsRes.value.items || []);
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.items || []);
      if (usersRes.status === 'fulfilled') {
        const agents = (usersRes.value.items || []).filter((u) => u.role === 3 || u.role?.toString() === 'SupportAgent');
        setSpecialists(agents);
      }
      if (assignmentsRes.status === 'fulfilled') setAssignments(assignmentsRes.value.items || []);
    } catch (err: any) {
      setPageError(err.message || 'Failed to aggregate team operational intelligence.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch ScheduleItems for the selected schedule cycle
  const fetchCycleItems = async (schedId: string) => {
    if (!schedId) return;
    try {
      const res = await schedulesApi.getScheduleItems(schedId, { pageSize: 100 });
      setScheduleItems(res.items || []);
    } catch (err: any) {
      console.error('Failed to load schedule items', err);
    }
  };

  useEffect(() => {
    if (selectedScheduleId) {
      fetchCycleItems(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  const activeSchedule = schedules.find((s) => s.id === selectedScheduleId);

  // Incomplete / Skipped / At-Risk Filter
  const filteredItems = useMemo(() => {
    let items = scheduleItems;

    if (filterStatus === 'incomplete') {
      items = items.filter((i) => isSkippedTouchpoint(i.status) || isPendingTouchpoint(i.status));
    } else if (filterStatus === 'completed') {
      items = items.filter((i) => isCompletedTouchpoint(i.status));
    }

    if (filterSpecialistId) {
      items = items.filter((i) => i.assignedUserId === filterSpecialistId);
    }

    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.contactPersonName?.toLowerCase().includes(q) ||
          i.organizationName?.toLowerCase().includes(q) ||
          i.projectName?.toLowerCase().includes(q) ||
          i.assignedUserName?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [scheduleItems, filterStatus, filterSpecialistId, filterSearch]);

  // Aggregate cycle metrics
  const totalItems = scheduleItems.length;
  const completedItems = scheduleItems.filter((i) => isCompletedTouchpoint(i.status)).length;
  const skippedItems = scheduleItems.filter((i) => isSkippedTouchpoint(i.status)).length;
  const pendingItems = scheduleItems.filter((i) => isPendingTouchpoint(i.status)).length;
  const cycleSlaRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Specialist Performance Mapping
  const specialistStats = useMemo(() => {
    return specialists.map((sp) => {
      const agentItems = scheduleItems.filter((i) => i.assignedUserId === sp.id);
      const done = agentItems.filter((i) => isCompletedTouchpoint(i.status)).length;
      const skipped = agentItems.filter((i) => isSkippedTouchpoint(i.status)).length;
      const pending = agentItems.filter((i) => isPendingTouchpoint(i.status)).length;
      const rate = agentItems.length > 0 ? Math.round((done / agentItems.length) * 100) : 0;
      return {
        specialist: sp,
        total: agentItems.length,
        completed: done,
        skipped,
        pending,
        rate,
      };
    });
  }, [specialists, scheduleItems]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let csv = '';
    const cycleLabel = activeSchedule ? `Year_${activeSchedule.year}_Week_${activeSchedule.weekNumber}` : 'Current_Cycle';
    const fileName = `TeamLead_Report_${activeTab}_${cycleLabel}.csv`;

    if (activeTab === 'incomplete-tasks') {
      csv = 'Status,Customer Organization,Stakeholder,Phone,Project,Module,Specialist,Scheduled Date,Blocker / Failure Notes\n';
      filteredItems.forEach((i) => {
        csv += `"${i.statusName || i.status}","${i.organizationName || ''}","${i.contactPersonName || ''}","${i.contactPersonPhone || ''}","${i.projectName || ''}","${i.projectModuleName || ''}","${i.assignedUserName || ''}","${i.scheduledDate}","${(i.notes || '').replace(/"/g, '""')}"\n`;
      });
    } else if (activeTab === 'specialist-performance') {
      csv = 'Specialist Name,Email,Assigned Touchpoints,Completed,Skipped,Pending,Completion Rate %\n';
      specialistStats.forEach((s) => {
        csv += `"${s.specialist.fullName}","${s.specialist.email}",${s.total},${s.completed},${s.skipped},${s.pending},"${s.rate}%"\n`;
      });
    } else {
      csv = 'Operating Cycle,Start Date,End Date,Total Touchpoints,Completed,Skipped,Pending,SLA %\n';
      schedules.forEach((s) => {
        const rate = s.totalItems > 0 ? Math.round((s.completedItems / s.totalItems) * 100) : 0;
        csv += `"${s.year} - Week ${s.weekNumber}","${s.weekStartDate}","${s.weekEndDate}",${s.totalItems},${s.completedItems},${s.skippedItems},${s.pendingItems},"${rate}%"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
      {/* Header and Action Controls */}
      <div className="view-headline-row flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="view-title">Team Operations & Execution Issue Reports</h2>
            <Badge variant="accent">Team Lead Command</Badge>
          </div>
          <p className="view-subtitle">
            Auditing weekly cycle delivery, tracking incomplete or skipped touchpoints, and monitoring specialist execution velocity
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.print()} title="Print operational audit report">
            <span>🖨️ Print Report</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} title="Export CSV spreadsheet">
            <span>📥 Export CSV</span>
          </Button>

          <Button variant="primary" size="sm" onClick={fetchInitialData} disabled={isRefreshing}>
            <RefreshIcon size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Sync Live Records</span>
          </Button>
        </div>
      </div>

      {pageError && <Alert variant="danger" message={pageError} onClose={() => setPageError(null)} />}

      {/* Operational KPI Metric Cards */}
      <div className="kpi-cards-grid mt-4">
        <StatCard
          label="Cycle SLA Completion Rate"
          value={`${cycleSlaRate}%`}
          chartVariant="teal"
          subtext={`${completedItems} executed of ${totalItems} scheduled touchpoints`}
          subtextColor="success"
          icon={<CheckSquareIcon size={16} />}
        />
        <StatCard
          label="Incomplete / Skipped Issues"
          value={`${skippedItems} Touchpoints`}
          chartVariant="rose"
          subtext={skippedItems > 0 ? 'Requires remediation or rescheduling' : 'Zero skipped touchpoints'}
          subtextColor={skippedItems > 0 ? 'danger' : 'success'}
          icon={<AlertTriangleIcon size={16} />}
        />
        <StatCard
          label="Pending Queue In-Cycle"
          value={`${pendingItems} Remaining`}
          chartVariant="amber"
          subtext="Touchpoints scheduled for upcoming days"
          subtextColor="neutral"
          icon={<ClockIcon size={16} />}
        />
        <StatCard
          label="Assigned Specialists"
          value={`${specialists.length} Specialists`}
          chartVariant="purple"
          subtext={`${specialistStats.filter((s) => s.total > 0).length} actively assigned touchpoints`}
          subtextColor="accent"
          icon={<UsersIcon size={16} />}
        />
      </div>

      {/* Navigation Pills */}
      <div className="executive-filter-pills mt-4">
        <button
          type="button"
          className={`executive-filter-pill ${activeTab === 'incomplete-tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('incomplete-tasks')}
        >
          <AlertTriangleIcon size={14} />
          <span>Incomplete Tasks & Blocker Issues</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeTab === 'cycle-execution' ? 'active' : ''}`}
          onClick={() => setActiveTab('cycle-execution')}
        >
          <CalendarIcon size={14} />
          <span>Weekly Cycle Execution & SLA Audit</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeTab === 'specialist-performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('specialist-performance')}
        >
          <UsersIcon size={14} />
          <span>Specialist Workload & Velocity Audit</span>
        </button>
        <button
          type="button"
          className={`executive-filter-pill ${activeTab === 'tenant-coverage' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenant-coverage')}
        >
          <BuildingIcon size={14} />
          <span>Customer Account Touchpoint Coverage</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="feedback-filter-bar mt-3 pt-3 border-t">
        <div className="feedback-filter-group" style={{ minWidth: 220 }}>
          <label className="text-xs font-semibold text-muted mb-1 block">Operating Schedule Cycle</label>
          <select
            className="feedback-filter-select"
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                Year {s.year} • Week {s.weekNumber} ({new Date(s.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(s.weekEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
              </option>
            ))}
          </select>
        </div>

        <div className="feedback-filter-group" style={{ minWidth: 160 }}>
          <label className="text-xs font-semibold text-muted mb-1 block">Filter Status</label>
          <select
            className="feedback-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="incomplete">Incomplete & Skipped Only</option>
            <option value="all">All Touchpoints ({scheduleItems.length})</option>
            <option value="completed">Completed Only ({completedItems})</option>
          </select>
        </div>

        <div className="feedback-filter-group" style={{ minWidth: 170 }}>
          <label className="text-xs font-semibold text-muted mb-1 block">Specialist</label>
          <select
            className="feedback-filter-select"
            value={filterSpecialistId}
            onChange={(e) => setFilterSpecialistId(e.target.value)}
          >
            <option value="">All Specialists ({specialists.length})</option>
            {specialists.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="feedback-filter-group" style={{ flex: 1, minWidth: 200 }}>
          <label className="text-xs font-semibold text-muted mb-1 block">Search Blocker Notes / Client</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="feedback-filter-input"
              style={{ width: '100%', paddingLeft: 28 }}
              placeholder="Search by client, notes, specialist..."
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

        {(filterSpecialistId || filterSearch || filterStatus !== 'incomplete') && (
          <div className="feedback-filter-group" style={{ alignSelf: 'flex-end' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterSpecialistId('');
                setFilterSearch('');
                setFilterStatus('incomplete');
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* REPORT CONTENT BODY */}

      {/* 1. Incomplete Tasks & Blocker Issues Report */}
      {activeTab === 'incomplete-tasks' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="card-title">Incomplete Customer Touchpoints & Blocker Audit</h3>
                <Badge variant={skippedItems > 0 ? 'danger' : 'neutral'} size="sm">
                  {filteredItems.length} Records In Scope
                </Badge>
              </div>
              <p className="card-subtitle">
                Scheduled touchpoints that were skipped, delayed, or marked pending — including reasons, notes, and specialist accountability
              </p>
            </div>
            {skippedItems > 0 && (
              <span className="badge badge-danger">
                {skippedItems} Skipped Tasks Detected
              </span>
            )}
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>CUSTOMER TENANT & STAKEHOLDER</th>
                  <th>PROJECT & MODULE</th>
                  <th>ASSIGNED SPECIALIST</th>
                  <th>SCHEDULED DATE</th>
                  <th>BLOCKER / NOTES / FAILURE REASON</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <div className="text-sm font-semibold text-success">
                        No Incomplete Tasks or Blocker Issues Found!
                      </div>
                      <p className="text-xs text-muted mt-1">
                        All customer touchpoints matching current filter criteria have been successfully executed.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Badge
                          variant={
                            item.status === ScheduleItemStatus.Completed
                              ? 'success'
                              : item.status === ScheduleItemStatus.Skipped
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {item.statusName || (item.status === 2 ? 'Completed' : item.status === 3 ? 'Skipped' : 'Pending')}
                        </Badge>
                      </td>
                      <td>
                        <div className="font-bold text-dark text-xs">{item.organizationName || 'Client Org'}</div>
                        <div className="text-xs text-muted">{item.contactPersonName || 'Customer Stakeholder'}</div>
                        {item.contactPersonPhone && (
                          <div className="text-xs font-mono text-muted">{item.contactPersonPhone}</div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-dark text-xs">{item.projectName || 'General Project'}</div>
                        <div className="text-xs text-muted">{item.projectModuleName || 'General outreach'}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-dark text-xs">{item.assignedUserName || 'Assigned Specialist'}</div>
                      </td>
                      <td className="text-xs text-dark font-medium">
                        {new Date(item.scheduledDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        {item.notes ? (
                          <div className="p-2 rounded bg-surface border text-xs text-dark font-medium leading-relaxed">
                            "{item.notes}"
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">No explanation provided</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Weekly Cycle Execution & SLA Audit */}
      {activeTab === 'cycle-execution' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Multi-Cycle Operational Execution & SLA Delivery</h3>
              <p className="card-subtitle">
                Historical comparison of touchpoints scheduled vs delivered across operating periods
              </p>
            </div>
            <Badge variant="accent" size="sm">{schedules.length} Operating Cycles</Badge>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>OPERATING PERIOD</th>
                  <th>CYCLE DATE RANGE</th>
                  <th>PLANNED TOUCHPOINTS</th>
                  <th>COMPLETED</th>
                  <th>SKIPPED</th>
                  <th>PENDING</th>
                  <th>SLA ADHERENCE %</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => {
                  const rate = s.totalItems > 0 ? Math.round((s.completedItems / s.totalItems) * 100) : 0;
                  const isCurrent = s.id === selectedScheduleId;
                  return (
                    <tr
                      key={s.id}
                      style={{ backgroundColor: isCurrent ? 'rgba(44, 122, 123, 0.05)' : undefined, cursor: 'pointer' }}
                      onClick={() => setSelectedScheduleId(s.id)}
                    >
                      <td className="font-bold text-dark text-xs">
                        Year {s.year} • Week {s.weekNumber} {isCurrent && ' (Selected)'}
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
                            <div className="h-full bg-success" style={{ width: `${Math.min(rate, 100)}%` }} />
                          </div>
                          <span className="font-bold text-xs text-dark">{rate}%</span>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={isCompletedSchedule(s.status) ? 'success' : isActiveSchedule(s.status) ? 'accent' : 'neutral'}
                          size="sm"
                        >
                          {isCompletedSchedule(s.status) ? 'Completed' : isActiveSchedule(s.status) ? 'Active Cycle' : 'Draft'}
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

      {/* 3. Specialist Workload & Velocity Audit */}
      {activeTab === 'specialist-performance' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Specialist Team Execution Velocity & Productivity</h3>
              <p className="card-subtitle">
                Individual specialist execution rate, completed touchpoints, and skipped items for current cycle
              </p>
            </div>
            <Badge variant="purple" size="sm">{specialists.length} Specialists</Badge>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>SPECIALIST</th>
                  <th>ASSIGNED TOUCHPOINTS</th>
                  <th>COMPLETED</th>
                  <th>SKIPPED / BLOCKERS</th>
                  <th>PENDING</th>
                  <th>EXECUTION RATE %</th>
                  <th>PERFORMANCE</th>
                </tr>
              </thead>
              <tbody>
                {specialistStats.map((st) => (
                  <tr key={st.specialist.id}>
                    <td>
                      <div className="font-bold text-dark text-xs">{st.specialist.fullName}</div>
                      <div className="text-xs text-muted font-mono">{st.specialist.email}</div>
                    </td>
                    <td className="font-bold text-dark text-xs">{st.total} Scheduled</td>
                    <td className="font-bold text-success text-xs">{st.completed} Executed</td>
                    <td className="font-bold text-danger text-xs">{st.skipped} Skipped</td>
                    <td className="font-bold text-warning text-xs">{st.pending} Pending</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-surface h-2 rounded-full overflow-hidden border">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(st.rate, 100)}%`,
                              backgroundColor: st.rate >= 80 ? 'var(--status-green)' : 'var(--status-amber)',
                            }}
                          />
                        </div>
                        <span className="font-bold text-xs text-dark">{st.rate}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant={st.total === 0 ? 'neutral' : st.rate >= 90 ? 'success' : st.rate >= 70 ? 'accent' : 'warning'}
                        size="sm"
                      >
                        {st.total === 0 ? 'No Load' : st.rate >= 90 ? 'High Velocity' : st.rate >= 70 ? 'On Track' : 'Needs Support'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Customer Account Touchpoint Coverage */}
      {activeTab === 'tenant-coverage' && (
        <div className="dashboard-card mt-4">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Customer Account Touchpoint Coverage</h3>
              <p className="card-subtitle">
                Tenant organizations covered vs scheduled in current operational period
              </p>
            </div>
            <Badge variant="accent" size="sm">{organizations.length} Customer Accounts</Badge>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>CUSTOMER TENANT</th>
                  <th>PHONE</th>
                  <th>IN-CYCLE TOUCHPOINTS</th>
                  <th>COMPLETED</th>
                  <th>SKIPPED / UNRESOLVED</th>
                  <th>COVERAGE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => {
                  const orgItems = scheduleItems.filter((i) => i.organizationName === org.name);
                  const orgCompleted = orgItems.filter((i) => isCompletedTouchpoint(i.status)).length;
                  const orgSkipped = orgItems.filter((i) => isSkippedTouchpoint(i.status)).length;
                  return (
                    <tr key={org.id}>
                      <td>
                        <div className="font-bold text-dark text-xs">{org.name}</div>
                        <div className="text-xs text-muted">{org.email || 'Customer Account'}</div>
                      </td>
                      <td className="font-mono text-xs">{org.phoneNumber || org.phone || '—'}</td>
                      <td className="font-bold text-dark text-xs">{orgItems.length} Scheduled</td>
                      <td className="font-bold text-success text-xs">{orgCompleted}</td>
                      <td className="font-bold text-danger text-xs">{orgSkipped}</td>
                      <td>
                        <Badge
                          variant={orgItems.length === 0 ? 'neutral' : orgCompleted > 0 && orgSkipped === 0 ? 'success' : 'warning'}
                          size="sm"
                        >
                          {orgItems.length === 0 ? 'Not Scheduled' : orgCompleted > 0 && orgSkipped === 0 ? 'Fully Reached' : 'Partial / Pending'}
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

