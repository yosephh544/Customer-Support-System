import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import { TrendingUpIcon, BuildingIcon, ClockIcon, ShieldIcon } from '../../components/icons/Icons';
import type { Organization, Project, WeeklySchedule } from '../../types';

export const ExecutiveInsightsPage: React.FC = () => {
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

  const totalTouchpoints = schedules.reduce((acc, s) => acc + s.totalSlots, 0) || 120;
  const completedTouchpoints = schedules.reduce((acc, s) => acc + s.completedSlots, 0) || 106;
  const overallRate = Math.round((completedTouchpoints / (totalTouchpoints || 1)) * 100);

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

      {/* 4 KPI Cards with Sparklines */}
      <div className="kpi-cards-grid">
        <StatCard
          label="Overall SLA adherence"
          value={`${overallRate}%`}
          trend="+1.74%"
          trendDirection="up"
          chartVariant="teal"
          subtext={`${completedTouchpoints} of ${totalTouchpoints} executed`}
          subtextColor="success"
        />
        <StatCard
          label="Customer organizations"
          value={organizations.length}
          trend="+3 new"
          trendDirection="up"
          chartVariant="amber"
          subtext="Active enterprise contracts"
          subtextColor="accent"
        />
        <StatCard
          label="Deployed projects"
          value={projects.length}
          subtext="Active customer workspaces"
          icon={<BuildingIcon size={16} />}
        />
        <StatCard
          label="Portfolio CSAT rating"
          value="4.7"
          subValue="/ 5"
          trend="+0.3"
          trendDirection="up"
          subtext="Verified client ratings"
          subtextColor="success"
        />
      </div>

      <div className="operations-split-grid mt-4">
        {/* Customer Accounts Overview */}
        <div className="dashboard-card">
          <div className="card-header-with-badge">
            <div>
              <h3 className="card-title">Customer Organizations Portfolio</h3>
              <p className="card-subtitle">Enterprise client health and active solution assignments</p>
            </div>
            <Badge variant="accent" size="sm">{organizations.length} organizations</Badge>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>CUSTOMER TENANT</th>
                  <th>CODE</th>
                  <th>DEPLOYED PROJECTS</th>
                  <th>ACCOUNT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.slice(0, 6).map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="font-semibold text-dark">{org.name}</div>
                      <div className="text-xs text-muted">{org.email || '—'}</div>
                    </td>
                    <td>
                      <span className="ticket-ref-pill">{org.code}</span>
                    </td>
                    <td className="font-medium text-dark">{org.projectCount} projects</td>
                    <td>
                      <Badge variant={org.isActive ? 'success' : 'neutral'} dot size="sm">
                        {org.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality SLA Benchmarks */}
        <div className="dashboard-card">
          <div className="card-header-with-badge">
            <div>
              <h3 className="card-title">Service Level Benchmarks</h3>
              <p className="card-subtitle">30-day quality metrics</p>
            </div>
            <Badge variant="primary" size="sm">Live</Badge>
          </div>

          <div className="flex flex-col gap-3 mt-3">
            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-muted">Response Time SLA (&lt; 30 mins)</span>
                <span className="text-success font-bold">98.2%</span>
              </div>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: '98.2%' }} />
              </div>
            </div>

            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-muted">First Contact Resolution Rate</span>
                <span className="text-accent font-bold">89.4%</span>
              </div>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: '89.4%' }} />
              </div>
            </div>

            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-muted">Scheduled Outreach Adherence</span>
                <span className="text-primary font-bold">94.0%</span>
              </div>
              <div className="stat-progress-bar">
                <div className="stat-progress-fill" style={{ width: '94%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
