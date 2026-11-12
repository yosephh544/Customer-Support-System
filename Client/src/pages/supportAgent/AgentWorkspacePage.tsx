import React, { useEffect, useState } from 'react';
import { schedulesApi } from '../../api/schedulesApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { CalendarIcon, ProjectIcon, CheckSquareIcon } from '../../components/icons/Icons';
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
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

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
      } catch (err: any) {
        setPageError({
          message: err.message || 'Failed to load specialist workspace metrics.',
          details: err.errors,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const total = items.length;
  const completed = items.filter((i) => i.status === 1).length;
  const pending = items.filter((i) => i.status === 0 || i.status === 3).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 100;

  return (
    <div className="agent-workspace-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">
            Specialist Workspace
          </h1>
          <p className="main-page-subtitle">
            Customer outreach queue, assigned client projects, and active delivery modules.
          </p>
        </div>

        <Button variant="accent" size="sm" onClick={onNavigateToTouchpoints}>
          Open Ticket Queue
        </Button>
      </div>

      {pageError && (
        <Alert
          variant="warning"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
        />
      )}

      {/* KPI Cards Row */}
      <div className="kpi-cards-grid">
        <StatCard
          label="Assigned touchpoints"
          value={total}
          chartVariant="teal"
          subtext={`${pending} pending completion`}
          subtextColor="accent"
        />
        <StatCard
          label="Completion rate"
          value={`${rate}%`}
          progress={rate}
          chartVariant="amber"
          subtext={`${completed} of ${total} resolved`}
          subtextColor="success"
        />
        <StatCard
          label="Active client projects"
          value={assignments.length}
          subtext="Allocated by Team Lead"
          icon={<ProjectIcon size={16} />}
        />
        <StatCard
          label="Pending outreach"
          value={pending}
          subtext="Awaiting delivery"
          icon={<CheckSquareIcon size={16} />}
        />
      </div>

      <div className="operations-split-grid mt-4">
        {/* Next Scheduled Touchpoints */}
        <div className="dashboard-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Next Customer Engagements</h3>
              <p className="card-subtitle">Upcoming review checkpoints and outreach calls</p>
            </div>
            <Button variant="outline" size="sm" onClick={onNavigateToTouchpoints}>
              Full Queue &rarr;
            </Button>
          </div>

          {items.length === 0 ? (
            <EmptyState
              compact
              title="No upcoming engagements"
              description="No scheduled touchpoints in your queue yet."
            />
          ) : (
            <div className="table-responsive">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>TICKET REF</th>
                    <th>CLIENT / PROJECT</th>
                    <th>SCHEDULED DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="ticket-ref-pill">#TKT-{item.id.slice(0, 6).toUpperCase()}</span>
                      </td>
                      <td>
                        <div className="font-semibold text-dark">{item.projectName}</div>
                        <div className="text-xs text-muted">{item.organizationName}</div>
                      </td>
                      <td className="text-sm font-medium">
                        {item.targetDate ? new Date(item.targetDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <Badge variant={item.status === 1 ? 'success' : item.status === 2 ? 'danger' : 'warning'} dot size="sm">
                          {item.status === 1 ? 'Resolved' : item.status === 2 ? 'Overdue' : 'Pending'}
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
            <div>
              <h3 className="card-title">Assigned Projects</h3>
              <p className="card-subtitle">Your allocated portfolio</p>
            </div>
            <Badge variant="accent" size="sm">{assignments.length} active</Badge>
          </div>

          <div className="escalation-items-list mt-3">
            {assignments.length === 0 ? (
              <p className="text-muted text-sm py-4">You have not been assigned to any project yet.</p>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="escalation-item">
                  <div className="font-semibold text-dark text-sm">{a.projectName}</div>
                  <div className="text-xs text-muted mt-1">
                    Client: {a.organizationName}
                  </div>
                  <div className="mt-2">
                    <span className="badge badge-accent">
                      {a.moduleName ? `Module: ${a.moduleName}` : 'All Project Modules'}
                    </span>
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
