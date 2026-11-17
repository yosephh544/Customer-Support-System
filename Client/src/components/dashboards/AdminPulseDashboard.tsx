import React, { useMemo } from 'react';
import type { Organization, UserProfile } from '../../types';
import { UserRole, UserRoleLabels, toUserRole } from '../../types';
import { BuildingIcon, ProjectIcon, ShieldIcon, UsersIcon } from '../icons/Icons';
import { DonutChart, HBarList, TrendChart } from '../charts/Charts';
import { KpiTile, Panel, StatusPill } from './DashboardKit';

export interface AdminPulseDashboardProps {
  organizations: Organization[];
  users: UserProfile[];
  orgCount: number;
  userCount: number;
  onNavigateToOrganizations: () => void;
  onNavigateToUsers: () => void;
}

interface MonthBucket {
  label: string;
  users: number;
  organizations: number;
}

const buildMonthBuckets = (users: UserProfile[], organizations: Organization[]): MonthBucket[] => {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('en-US', { month: 'short' }),
      users: 0,
      organizations: 0,
    };
  });
  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  const add = (value: string | undefined, field: 'users' | 'organizations') => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    const index = indexByKey.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (index !== undefined) buckets[index][field] += 1;
  };

  users.forEach((user) => add(user.createdAt, 'users'));
  organizations.forEach((organization) => add(organization.createdAt, 'organizations'));

  return buckets;
};

export const AdminPulseDashboard: React.FC<AdminPulseDashboardProps> = ({
  organizations,
  users,
  orgCount,
  userCount,
  onNavigateToOrganizations,
  onNavigateToUsers,
}) => {
  const metrics = useMemo(() => {
    const activeUsers = users.filter((user) => user.isActive).length;
    const activeOrganizations = organizations.filter((organization) => organization.isActive).length;
    const projectTotal = organizations.reduce(
      (sum, organization) => sum + (organization.projectCount || 0),
      0
    );

    const roleCounts = {
      [UserRole.SupportAgent]: 0,
      [UserRole.TeamLead]: 0,
      [UserRole.Director]: 0,
      [UserRole.Admin]: 0,
    } as Record<UserRole, number>;

    users.forEach((user) => {
      roleCounts[toUserRole(user.role)] += 1;
    });

    const months = buildMonthBuckets(users, organizations);
    const roleSegments = [
      { label: 'Support agents', value: roleCounts[UserRole.SupportAgent], color: '#4F46E5' },
      { label: 'Team leads', value: roleCounts[UserRole.TeamLead], color: '#06B6D4' },
      { label: 'Directors', value: roleCounts[UserRole.Director], color: '#8B5CF6' },
      { label: 'Administrators', value: roleCounts[UserRole.Admin], color: '#F59E0B' },
    ];

    const topOrganizations = [...organizations]
      .sort((a, b) => (b.projectCount || 0) - (a.projectCount || 0))
      .slice(0, 5)
      .map((organization) => ({
        id: organization.id,
        label: organization.name,
        sub: organization.isActive ? 'Active tenant' : 'Inactive tenant',
        value: organization.projectCount || 0,
        valueLabel: `${organization.projectCount || 0}`,
        color: organization.isActive ? 'var(--pl-accent)' : 'var(--text-muted)',
      }));

    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

    return {
      activeUsers,
      activeOrganizations,
      projectTotal,
      months,
      roleSegments,
      topOrganizations,
      recentUsers,
      activeRate: userCount > 0 ? Math.round((activeUsers / userCount) * 100) : 0,
    };
  }, [users, organizations, userCount]);

  const monthlySignups = metrics.months.map((month) => month.users);
  const monthlyTenants = metrics.months.map((month) => month.organizations);
  const signupTotal = monthlySignups.reduce((sum, value) => sum + value, 0);

  return (
    <div className="pulse-dashboard pl-role-admin">
      <div className="pl-context">
        <span className="pl-context-left">
          <span className="pl-live-dot" />
          <strong>Live</strong>
          <span>tenant, identity and access overview</span>
        </span>
        <span className="pl-context-note">Platform administration</span>
      </div>

      <div className="pl-kpis">
        <KpiTile
          label="Customer tenants"
          value={orgCount.toLocaleString()}
          icon={<BuildingIcon size={14} />}
          sub={`${metrics.activeOrganizations} active organizations`}
          spark={monthlyTenants}
        />
        <KpiTile
          label="Platform users"
          value={userCount.toLocaleString()}
          icon={<UsersIcon size={14} />}
          sub={`${signupTotal} new in the last 6 months`}
          spark={monthlySignups}
        />
        <KpiTile
          label="Active accounts"
          value={metrics.activeUsers.toLocaleString()}
          icon={<ShieldIcon size={14} />}
          delta={{
            text: `${metrics.activeRate}% active`,
            tone: metrics.activeRate >= 80 ? 'good' : metrics.activeRate >= 50 ? 'warn' : 'bad',
          }}
          sub={`${Math.max(0, userCount - metrics.activeUsers)} disabled accounts`}
        />
        <KpiTile
          label="Deployed projects"
          value={metrics.projectTotal.toLocaleString()}
          icon={<ProjectIcon size={14} />}
          sub={`Across ${organizations.length} customer tenants`}
        />
      </div>

      <div className="pl-grid">
        <Panel
          span={8}
          title="Account growth"
          subtitle="New users provisioned over the last six months"
          meta={`+${signupTotal} accounts`}
        >
          <TrendChart
            series={[
              {
                label: 'New accounts',
                color: 'var(--pl-accent)',
                values: monthlySignups,
                fill: true,
              },
            ]}
            labels={metrics.months.map((month) => month.label)}
            yMin={0}
            height={190}
          />
        </Panel>

        <Panel
          span={4}
          title="Workforce by role"
          subtitle="Composition of provisioned accounts"
          meta={`${users.length} loaded`}
        >
          <DonutChart
            segments={metrics.roleSegments}
            centerValue={userCount.toLocaleString()}
            centerLabel="Accounts"
          />
        </Panel>

        <Panel
          span={6}
          title="Tenant project coverage"
          subtitle="Projects delivered per customer organization"
          meta={
            <button type="button" className="pl-inline-link" onClick={onNavigateToOrganizations}>
              View tenants
            </button>
          }
        >
          <HBarList
            items={metrics.topOrganizations}
            emptyText="No customer organizations registered yet."
          />
        </Panel>

        <Panel
          span={6}
          title="Recent accounts"
          subtitle="Newest users provisioned on the platform"
          meta={
            <button type="button" className="pl-inline-link" onClick={onNavigateToUsers}>
              View directory
            </button>
          }
        >
          {metrics.recentUsers.length === 0 ? (
            <div className="pl-empty">No user accounts provisioned yet.</div>
          ) : (
            <ul className="pl-list">
              {metrics.recentUsers.map((user) => (
                <li key={user.id} className="pl-list-row">
                  <span className="pl-list-avatar">
                    {(user.fullName || user.userName || 'U').charAt(0).toUpperCase()}
                  </span>
                  <div className="pl-list-main">
                    <div className="pl-list-title">{user.fullName || user.userName}</div>
                    <div className="pl-list-sub">
                      {UserRoleLabels[toUserRole(user.role)]} · @{user.userName}
                    </div>
                  </div>
                  <div className="pl-list-side">
                    <StatusPill tone={user.isActive ? 'good' : 'muted'}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </StatusPill>
                    <span>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};
