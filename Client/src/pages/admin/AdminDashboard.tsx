import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Alert } from '../../components/common/Alert';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { organizationsApi } from '../../api/organizationsApi';
import { usersApi } from '../../api/usersApi';
import { BuildingIcon, UsersIcon, ShieldIcon, CheckIcon, PlusIcon } from '../../components/icons/Icons';
import type { Organization, UserProfile, UserRole } from '../../types';

export interface AdminDashboardProps {
  onNavigateToOrganizations: () => void;
  onNavigateToUsers: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToOrganizations,
  onNavigateToUsers,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orgCount, setOrgCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const [orgsRes, usersRes] = await Promise.all([
        organizationsApi.getOrganizations({ pageSize: 5 }),
        usersApi.getUsers({ pageSize: 5 }),
      ]);
      setOrganizations(orgsRes.items || []);
      setOrgCount(orgsRes.totalCount || 0);
      setUsers(usersRes.items || []);
      setUserCount(usersRes.totalCount || 0);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to fetch administration metrics.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'Admin':
        return <Badge variant="danger" size="sm">Administrator</Badge>;
      case 'TeamLead':
        return <Badge variant="primary" size="sm">Team Lead</Badge>;
      case 'Director':
        return <Badge variant="purple" size="sm">Director</Badge>;
      case 'SupportAgent':
        return <Badge variant="accent" size="sm">Support Agent</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{r}</Badge>;
    }
  };

  return (
    <div className="admin-dashboard-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Administration & Tenant Operations</h1>
          <p className="main-page-subtitle">
            Customer tenant onboarding, identity provisioning, and role security boundaries.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BuildingIcon size={14} />}
            onClick={onNavigateToOrganizations}
          >
            Manage Orgs
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UsersIcon size={14} />}
            onClick={onNavigateToUsers}
          >
            Manage Users
          </Button>
        </div>
      </div>

      {pageError && (
        <Alert
          variant="warning"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
          action={
            <Button size="sm" variant="outline" onClick={fetchStats}>
              Retry Connection
            </Button>
          }
        />
      )}

      {/* KPI Cards Row */}
      <div className="kpi-cards-grid">
        <StatCard
          label="Customer organizations"
          value={orgCount}
          chartVariant="teal"
          trend="+2 onboarded"
          trendDirection="up"
          subtext="Active tenant companies"
          subtextColor="accent"
        />
        <StatCard
          label="Provisioned users"
          value={userCount}
          chartVariant="amber"
          trend="+5 this month"
          trendDirection="up"
          subtext="Across 4 enterprise roles"
          subtextColor="muted"
        />
        <StatCard
          label="Access control matrix"
          value="Enforced"
          subtext="Role-based access boundaries"
          icon={<ShieldIcon size={16} />}
        />
        <StatCard
          label="Encryption standard"
          value="AES-256"
          subtext="Credentials & token security"
          icon={<CheckIcon size={16} />}
        />
      </div>

      {/* Main Split Grid: Left Recent Users, Right Organizations Snapshot */}
      <div className="operations-split-grid mt-4">
        {/* Recent Provisioned Users */}
        <div className="dashboard-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Recent User Registrations</h3>
              <p className="card-subtitle">Latest accounts provisioned across system roles</p>
            </div>
            <Button variant="outline" size="sm" onClick={onNavigateToUsers}>
              All Users &rarr;
            </Button>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>REGISTERED</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted py-3 text-center">
                      {isLoading ? 'Loading user directory...' : 'No user accounts found.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="agent-cell">
                          <span className="agent-avatar">{u.fullName.charAt(0)}</span>
                          <div>
                            <div className="font-semibold text-dark">{u.fullName}</div>
                            <div className="text-xs text-muted">@{u.userName || u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        <Badge variant={u.isActive ? 'success' : 'neutral'} dot size="sm">
                          {u.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="text-xs text-muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Organizations Directory Snapshot */}
        <div className="dashboard-card">
          <div className="card-header-with-action">
            <div>
              <h3 className="card-title">Tenant Organizations</h3>
              <p className="card-subtitle">Active customer accounts & generated codes</p>
            </div>
            <Button variant="outline" size="sm" onClick={onNavigateToOrganizations}>
              All Orgs &rarr;
            </Button>
          </div>

          <div className="table-responsive">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>ORGANIZATION</th>
                  <th>CODE</th>
                  <th>PROJECTS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted py-3 text-center">
                      {isLoading ? 'Loading organizations...' : 'No organizations found.'}
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <div className="font-semibold text-dark">{org.name}</div>
                        <div className="text-xs text-muted">{org.email || '—'}</div>
                      </td>
                      <td>
                        <span className="ticket-ref-pill">{org.code}</span>
                      </td>
                      <td className="font-medium text-dark">
                        {org.projectCount} {org.projectCount === 1 ? 'project' : 'projects'}
                      </td>
                      <td>
                        <Badge variant={org.isActive ? 'success' : 'neutral'} dot size="sm">
                          {org.isActive ? 'Active' : 'Inactive'}
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

      {/* Security & System Policy Banner */}
      <div className="dashboard-card mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldIcon size={16} />
            </div>
            <div>
              <div className="font-semibold text-dark text-sm">Administrative Authority & Security Scope</div>
              <p className="text-xs text-muted mt-1">
                Administrators manage authentication credentials, user provisioning, and company tenant records. Tactical shift scheduling, project assignments, and ticket operations are managed strictly by Team Leads and Specialists.
              </p>
            </div>
          </div>
          <span className="badge badge-primary">Admin Scope Only</span>
        </div>
      </div>
    </div>
  );
};
