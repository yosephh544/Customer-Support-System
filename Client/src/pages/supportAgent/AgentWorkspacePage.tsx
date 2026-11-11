import React, { useEffect, useState } from 'react';
import { schedulesApi } from '../../api/schedulesApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CheckSquareIcon, CalendarIcon, ProjectIcon } from '../../components/icons/Icons';
import type { ScheduleItem, SupportAssignment } from '../../types';

export interface AgentWorkspacePageProps {
  onNavigateToTouchpoints: () => void;
}

export const AgentWorkspacePage: React.FC<AgentWorkspacePageProps> = ({
  onNavigateToTouchpoints,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, assignRes] = await Promise.allSettled([
          schedulesApi.getMyItems({ pageSize: 50 }),
          user ? assignmentsApi.getAssignmentsByUser(user.id) : Promise.resolve([]),
        ]);

        if (itemsRes.status === 'fulfilled') {
          setItems(itemsRes.value.items || []);
        }
        if (assignRes.status === 'fulfilled') {
          setAssignments(assignRes.value || []);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const total = items.length;
  const completed = items.filter((i) => i.status === 1).length;
  const pending = items.filter((i) => i.status === 0).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 100;

  return (
    <div className="agent-workspace-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">
            Hello, {user?.fullName || 'Specialist'}
          </h1>
          <p className="main-page-subtitle">
            Here is your customer outreach schedule and assigned delivery modules.
          </p>
        </div>
      </div>

      <div className="kpi-cards-grid">
        <StatCard
          label="Assigned Touchpoints"
          value={total}
          subtext={`${pending} pending execution`}
          icon={<CalendarIcon size={20} />}
        />
        <StatCard
          label="Completion Rate"
          value={`${rate}%`}
          progress={rate}
          subtext={`${completed} of ${total} finished`}
          subtextColor="success"
        />
        <StatCard
          label="Active Projects"
          value={assignments.length}
          subtext="Assigned by Team Lead"
          icon={<ProjectIcon size={20} />}
        />
        <StatCard
          label="Quality CSAT"
          value="4.8"
          subValue="/ 5"
          subtext="Customer satisfaction rating"
          subtextColor="success"
        />
      </div>

      <div className="operations-split-grid mt-6">
        {/* Next Scheduled Touchpoints */}
        <div className="dashboard-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Next Customer Touchpoints</h3>
              <p className="card-subtitle">Calls and review checkpoints assigned to you.</p>
            </div>
            <Button variant="primary" size="sm" onClick={onNavigateToTouchpoints}>
              Open all touchpoints
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-muted text-sm py-4">No scheduled touchpoints for you yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>CONTACT PERSON</th>
                    <th>ACCOUNT</th>
                    <th>DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td className="font-semibold text-dark">{item.contactPersonName}</td>
                      <td>{item.organizationName}</td>
                      <td className="text-sm">
                        {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <Badge variant={item.status === 1 ? 'success' : 'warning'} dot size="sm">
                          {item.statusName}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assigned Projects & Modules */}
        <div className="dashboard-card">
          <div className="card-header-with-badge">
            <h3 className="card-title">Your Assigned Projects</h3>
            <Badge variant="purple" size="sm">{assignments.length} active</Badge>
          </div>

          <div className="assigned-projects-list mt-3">
            {assignments.length === 0 ? (
              <p className="text-muted text-sm py-4">You have not been assigned to any project yet.</p>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="escalation-item">
                  <div className="font-semibold text-dark">{a.projectName}</div>
                  <div className="text-xs text-muted mt-1">
                    Code: {a.projectCode} · {a.moduleName ? `Module: ${a.moduleName}` : 'All project modules'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

