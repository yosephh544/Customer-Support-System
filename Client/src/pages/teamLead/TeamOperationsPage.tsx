import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { schedulesApi } from '../../api/schedulesApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import type { SupportAssignment, WeeklySchedule } from '../../types';

export interface TeamOperationsPageProps {
  onNavigateToAssignments?: () => void;
  onNavigateToPlanner?: () => void;
}

export const TeamOperationsPage: React.FC<TeamOperationsPageProps> = ({
  onNavigateToAssignments,
  onNavigateToPlanner,
}) => {
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule | null>(null);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [schedResult, assignResult] = await Promise.allSettled([
          schedulesApi.getCurrentSchedule(),
          assignmentsApi.getAssignments({ pageSize: 10 }),
        ]);

        if (schedResult.status === 'fulfilled') {
          setCurrentSchedule(schedResult.value);
        }
        if (assignResult.status === 'fulfilled') {
          setAssignments(assignResult.value.items || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate delivery stats
  const totalPlanned = currentSchedule?.totalItems || 120;
  const completed = currentSchedule?.completedItems || 106;
  const completionRate = Math.round((completed / (totalPlanned || 1)) * 100);

  // Mock / dynamic delivery signals matching image 2
  const agentSignals = [
    {
      name: 'Aisha Patel',
      role: 'Support Specialist',
      planned: 24,
      completed: 20,
      rate: '83%',
      rating: '4.7',
      issues: 1,
    },
    {
      name: 'Marcus Reed',
      role: 'Support Specialist',
      planned: 22,
      completed: 21,
      rate: '95%',
      rating: '4.6',
      issues: 0,
    },
    {
      name: 'Elena Rossi',
      role: 'Implementation Specialist',
      planned: 26,
      completed: 19,
      rate: '73%',
      rating: '4.2',
      issues: 3,
    },
    {
      name: 'Noah Williams',
      role: 'Customer Success',
      planned: 24,
      completed: 23,
      rate: '96%',
      rating: '4.5',
      issues: 1,
    },
  ];

  return (
    <div className="team-operations-view">
      {/* Page Title & Subtitle Banner */}
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">
            A steady week, with two risks to unblock
          </h1>
          <p className="main-page-subtitle">
            12–16 August · Customer support delivery across your team.
          </p>
        </div>

        <div className="headline-actions">
          <button type="button" className="pill-date-button">
            <span>📅</span>
            <span>This week</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards Row (matching image 2) */}
      <div className="kpi-cards-grid">
        <StatCard
          label="Weekly completion"
          value={`${completionRate}%`}
          progress={completionRate}
          subtext={`${completed} of ${totalPlanned} planned`}
          subtextColor="muted"
        />
        <StatCard
          label="Overdue contacts"
          value="5"
          subtext="3 over 24 hours"
          subtextColor="danger"
        />
        <StatCard
          label="Active blockers"
          value="2"
          subtext="Needs leadership review"
          subtextColor="danger"
        />
        <StatCard
          label="CSAT"
          value="4.5"
          subValue="/ 5"
          subtext="+0.2 this week"
          subtextColor="success"
        />
      </div>

      {/* Main Grid: Left 2/3 Agent Delivery, Right 1/3 Escalations */}
      <div className="operations-split-grid">
        {/* Agent Delivery Card */}
        <div className="dashboard-card agent-delivery-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Agent delivery</h3>
              <p className="card-subtitle">
                Completion and quality signals for active agents.
              </p>
            </div>
            {onNavigateToAssignments && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToAssignments}
              >
                Manage assignments
              </Button>
            )}
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>AGENT</th>
                  <th>PLANNED</th>
                  <th>COMPLETED</th>
                  <th>RATE</th>
                  <th>RATING</th>
                  <th>OPEN ISSUES</th>
                </tr>
              </thead>
              <tbody>
                {agentSignals.map((agent) => (
                  <tr key={agent.name}>
                    <td>
                      <div className="agent-cell">
                        <span className="agent-avatar">
                          {agent.name.charAt(0)}
                        </span>
                        <div>
                          <div className="agent-name">{agent.name}</div>
                          <div className="agent-role">{agent.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">{agent.planned}</td>
                    <td className="font-medium">{agent.completed}</td>
                    <td>
                      <span
                        className={`rate-badge ${
                          parseInt(agent.rate) >= 90
                            ? 'text-success'
                            : parseInt(agent.rate) < 80
                            ? 'text-danger'
                            : 'text-primary'
                        }`}
                      >
                        {agent.rate}
                      </span>
                    </td>
                    <td className="font-medium">⭐ {agent.rating}</td>
                    <td>
                      {agent.issues > 0 ? (
                        <span className="issues-count has-issues">
                          {agent.issues}
                        </span>
                      ) : (
                        <span className="issues-count zero">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Escalation Feed Card */}
        <div className="dashboard-card escalation-feed-card">
          <div className="card-header-with-badge">
            <h3 className="card-title">Escalation feed</h3>
            <Badge variant="neutral" size="sm">
              2 active
            </Badge>
          </div>

          <div className="escalation-items-list">
            {/* Blocker 1 */}
            <div className="escalation-item">
              <div className="escalation-header">
                <span className="escalation-title">Invoice export failures</span>
                <Badge variant="blocker" size="sm">
                  Blocker
                </Badge>
              </div>
              <div className="escalation-account">
                Northwind Logistics · Billing API
              </div>
              <div className="escalation-owner">
                Owner: Platform team · Update due today
              </div>
            </div>

            {/* Blocker 2 */}
            <div className="escalation-item">
              <div className="escalation-header">
                <span className="escalation-title">Claims report delay</span>
                <Badge variant="high" size="sm">
                  High
                </Badge>
              </div>
              <div className="escalation-account">
                Aster Health Group · Claims Hub
              </div>
              <div className="escalation-owner">
                Owner: Elena Rossi · Update due 15:00
              </div>
            </div>
          </div>

          <div className="card-footer-link">
            <button
              type="button"
              className="btn-link"
              onClick={onNavigateToPlanner}
            >
              View all escalations & touchpoints &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

