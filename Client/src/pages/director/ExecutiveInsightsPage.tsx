import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { schedulesApi } from '../../api/schedulesApi';
import type { Organization, Project, WeeklySchedule } from '../../types';

export const ExecutiveInsightsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchDirectorData();
  }, []);

  const totalTouchpoints = schedules.reduce((acc, s) => acc + s.totalItems, 0) || 120;
  const completedTouchpoints = schedules.reduce((acc, s) => acc + s.completedItems, 0) || 106;
  const overallRate = Math.round((completedTouchpoints / (totalTouchpoints || 1)) * 100);

  return (
    <div className="executive-insights-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Executive Operations & Quality Insights</h1>
          <p className="main-page-subtitle">
            Executive oversight across customer portfolio health, delivery performance, and CSAT scores.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => alert('Exporting executive report in PDF / CSV format...')}>
          Export report
        </Button>
      </div>

      <div className="kpi-cards-grid">
        <StatCard
          label="Overall Delivery Rate"
          value={`${overallRate}%`}
          progress={overallRate}
          subtext={`${completedTouchpoints} of ${totalTouchpoints} executed`}
          subtextColor="success"
        />
        <StatCard
          label="Customer Accounts"
          value={organizations.length}
          subtext="Active enterprise clients"
        />
        <StatCard
          label="Ongoing Projects"
          value={projects.length}
          subtext="Deployed client solutions"
        />
        <StatCard
          label="Portfolio CSAT"
          value="4.7"
          subValue="/ 5"
          subtext="+0.3 past 30 days"
          subtextColor="success"
        />
      </div>

      <div className="operations-split-grid mt-6">
        <div className="dashboard-card">
          <h3 className="card-title">Customer Organizations Portfolio</h3>
          <p className="card-subtitle mb-4">Enterprise client accounts and project assignments.</p>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>ORGANIZATION</th>
                  <th>CODE</th>
                  <th>ACTIVE PROJECTS</th>
                  <th>HEALTH STATUS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.slice(0, 6).map((org) => (
                  <tr key={org.id}>
                    <td className="font-semibold text-dark">{org.name}</td>
                    <td>{org.code}</td>
                    <td>{org.projectCount} projects</td>
                    <td>
                      <span className="badge badge-success">Healthy</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Quality & CSAT Trends</h3>
          <p className="card-subtitle mb-4">Weekly satisfaction benchmarks.</p>

          <div className="csat-progress-list">
            <div className="csat-item mb-3">
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Response Time SLA</span>
                <span className="text-success">98%</span>
              </div>
              <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: '98%' }} /></div>
            </div>

            <div className="csat-item mb-3">
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>First Contact Resolution</span>
                <span className="text-primary">89%</span>
              </div>
              <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: '89%' }} /></div>
            </div>

            <div className="csat-item mb-3">
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Client Outreach Adherence</span>
                <span className="text-purple">92%</span>
              </div>
              <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: '92%' }} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

