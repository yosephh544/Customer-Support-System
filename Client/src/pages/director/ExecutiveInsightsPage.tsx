import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import { TrendingUpIcon, BuildingIcon, ClockIcon, ShieldIcon, CheckIcon } from '../../components/icons/Icons';
import type { Organization, Project, WeeklySchedule } from '../../types';

export interface ExecutiveInsightsPageProps {
  onNavigateToOrganizations?: () => void;
  onNavigateToProjects?: () => void;
  onNavigateToSchedules?: () => void;
}

export const ExecutiveInsightsPage: React.FC<ExecutiveInsightsPageProps> = ({
  onNavigateToOrganizations,
  onNavigateToProjects,
  onNavigateToSchedules,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  useEffect(() => {
    const fetchDirectorData = async () => {
      try {
        const [orgs, prjs, scheds] = await Promise.allSettled([
          organizationsApi.getOrganizations({ pageSize: 50 }),
          projectsApi.getProjects({ pageSize: 50 }),
          schedulesApi.getSchedules({ pageSize: 10 }),
        ]);

        if (orgs.status === 'fulfilled') setOrganizations(orgs.value.items || []);
        if (prjs.status === 'fulfilled') setProjects(prjs.value.items || []);
        if (scheds.status === 'fulfilled') setSchedules(scheds.value.items || []);
      } catch (err: any) {
        setPageError({
          message: err.message || 'Failed to aggregate portfolio intelligence metrics.',
          details: err.errors,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDirectorData();
  }, []);

  const totalTouchpoints = schedules.reduce((acc, s) => acc + (s.totalItems || 0), 0);
  const completedTouchpoints = schedules.reduce((acc, s) => acc + (s.completedItems || 0), 0);
  const overallRate = totalTouchpoints > 0 ? Math.round((completedTouchpoints / totalTouchpoints) * 100) : 0;
  const activeOrgsCount = organizations.filter((o) => o.isActive).length;
  const activeOrgsRate = organizations.length > 0 ? Math.round((activeOrgsCount / organizations.length) * 100) : 0;
  const activeProjectsCount = projects.filter((p) => p.status === 1).length;
  const activeProjectsRate = projects.length > 0 ? Math.round((activeProjectsCount / projects.length) * 100) : 0;

  return (
    <div className="executive-insights-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Executive Operations & Portfolio Insights</h1>
          <p className="main-page-subtitle">
            Enterprise portfolio health, service delivery performance, and client satisfaction benchmarks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Exporting Executive Operations Report (PDF / Excel summary)...')}
          >
            Export Audit Report
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

      {/* 4 KPI Cards */}
      <div className="kpi-cards-grid">
        <StatCard
          label="Overall SLA adherence"
          value={`${overallRate}%`}
          chartVariant="teal"
          subtext={`${completedTouchpoints} of ${totalTouchpoints} executed`}
          subtextColor="success"
        />
        <StatCard
          label="Customer organizations"
          value={organizations.length}
          chartVariant="amber"
          subtext={`${activeOrgsCount} active enterprise contracts`}
          subtextColor="accent"
        />
        <StatCard
          label="Deployed projects"
          value={projects.length}
          subtext={`${activeProjectsCount} active customer workspaces`}
          icon={<BuildingIcon size={16} />}
        />
        <StatCard
          label="Weekly schedule cycles"
          value={schedules.length}
          subtext="Operational support cycles"
          icon={<ClockIcon size={16} />}
        />
      </div>

      <div className="operations-split-grid mt-4">
        {/* Customer Accounts Overview */}
        <div className="dashboard-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Customer Organizations Portfolio</h3>
              <p className="card-subtitle">Enterprise client health and active solution assignments</p>
            </div>
            {onNavigateToOrganizations && (
              <Button variant="outline" size="sm" onClick={onNavigateToOrganizations}>
                All Tenants &rarr;
              </Button>
            )}
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>CUSTOMER TENANT</th>
                  <th>DEPLOYED PROJECTS</th>
                  <th>ACCOUNT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-0">
                      <EmptyState
                        compact
                        title="No tenant organizations"
                        description={isLoading ? 'Loading executive records...' : 'No customer organizations registered.'}
                      />
                    </td>
                  </tr>
                ) : (
                  organizations.slice(0, 6).map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="font-semibold text-dark">{org.name}</div>
                      <div className="text-xs text-muted">{org.email || '—'}</div>
                    </td>
                    <td className="font-medium text-dark">{org.projectCount} projects</td>
                    <td>
                      <Badge variant={org.isActive ? 'success' : 'neutral'} dot size="sm">
                        {org.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality SLA Benchmarks */}
        <div className="dashboard-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Service Level Benchmarks</h3>
              <p className="card-subtitle">Operational delivery metrics</p>
            </div>
            {onNavigateToSchedules && (
              <Button variant="outline" size="sm" onClick={onNavigateToSchedules}>
                Weekly Schedules &rarr;
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-3">
            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-muted">Touchpoint SLA Adherence</span>
                <span className="text-success font-bold">{overallRate}%</span>
              </div>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: `${overallRate}%` }} />
              </div>
            </div>

            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-muted">Active Client Organization Ratio</span>
                <span className="text-accent font-bold">{activeOrgsRate}%</span>
              </div>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: `${activeOrgsRate}%` }} />
              </div>
            </div>

            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-muted">Active Solution Project Ratio</span>
                <span className="text-primary font-bold">{activeProjectsRate}%</span>
              </div>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: `${activeProjectsRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deployed Solution Projects Overview */}
      <div className="dashboard-card mt-4">
        <div className="card-header-with-action">
          <div>
            <h3 className="card-title">Deployed Solution Projects</h3>
            <p className="card-subtitle">Active customer deployment environments and module scope</p>
          </div>
          {onNavigateToProjects && (
            <Button variant="outline" size="sm" onClick={onNavigateToProjects}>
              All Projects &rarr;
            </Button>
          )}
        </div>

        <div className="table-responsive">
          <table className="delivery-table">
            <thead>
              <tr>
                <th>PROJECT NAME</th>
                <th>CLIENT TENANT</th>
                <th>MODULE ARCHITECTURE</th>
                <th>DELIVERY STATUS</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState
                      compact
                      title="No active projects"
                      description={isLoading ? 'Loading project portfolio...' : 'No customer projects deployed yet.'}
                    />
                  </td>
                </tr>
              ) : (
                projects.slice(0, 6).map((proj) => (
                  <tr key={proj.id}>
                    <td>
                      <div className="font-semibold text-dark">{proj.name}</div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-dark">{proj.organizationName || '—'}</div>
                    </td>
                    <td>
                      <Badge variant="purple" size="sm">
                        {proj.moduleCount || 0} modules
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={proj.status === 1 ? 'success' : proj.status === 2 ? 'warning' : 'neutral'} dot size="sm">
                        {proj.status === 1 ? 'Active' : proj.status === 2 ? 'Maintenance' : 'Completed'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Scope Notice Banner */}
      <div className="dashboard-card mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TrendingUpIcon size={16} />
            </div>
            <div>
              <div className="font-semibold text-dark text-sm">Executive Oversight & Governance Scope</div>
              <p className="text-xs text-muted mt-1">
                Executive view is scoped to aggregate portfolio indicators, SLA compliance reports, and enterprise account health. Tactical shift assignments and member provisioning are managed by Team Leads and Admins respectively.
              </p>
            </div>
          </div>
          <span className="badge badge-accent">Director Scope Only</span>
        </div>
      </div>
    </div>
  );
};
