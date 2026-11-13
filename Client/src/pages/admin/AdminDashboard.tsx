import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Alert } from '../../components/common/Alert';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { organizationsApi } from '../../api/organizationsApi';
import { usersApi } from '../../api/usersApi';
import { BuildingIcon, UsersIcon, ShieldIcon, CheckIcon, PdfIcon } from '../../components/icons/Icons';
import { exportToPdf } from '../../utils/exportUtils';
import { UserRole, UserRoleLabels, toUserRole } from '../../types';
import type { Organization, UserProfile } from '../../types';

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

  const getRoleBadge = (r: UserRole | string | number) => {
    const roleEnum = toUserRole(r);
    switch (roleEnum) {
      case UserRole.Admin:
        return <Badge variant="danger" size="sm">{UserRoleLabels[UserRole.Admin]}</Badge>;
      case UserRole.TeamLead:
        return <Badge variant="primary" size="sm">{UserRoleLabels[UserRole.TeamLead]}</Badge>;
      case UserRole.Director:
        return <Badge variant="purple" size="sm">{UserRoleLabels[UserRole.Director]}</Badge>;
      case UserRole.SupportAgent:
      default:
        return <Badge variant="accent" size="sm">{UserRoleLabels[UserRole.SupportAgent]}</Badge>;
    }
  };

  const handleExportPdf = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPdf({
      fileName: `Administration_Audit_Summary_${dateStr}.pdf`,
      title: 'Customer Support Platform - Administration Summary',
      subtitle: 'Tenant Overview, Provisioned User Accounts & Governance Audit',
      authorOrRole: 'Platform Administrator',
      kpis: [
        { label: 'Registered Tenants', value: orgCount, color: 'primary' },
        { label: 'Platform Users', value: userCount, color: 'success' },
        { label: 'Recent Organizations', value: organizations.length, color: 'primary' },
        { label: 'Recent User Accounts', value: users.length, color: 'warning' },
      ],
      sections: [
        {
          title: 'Recent Customer Organizations',
          columns: ['Organization Name', 'Email Address', 'Phone', 'Projects Count', 'Status'],
          columnWidths: [3, 3, 2, 2, 2],
          rows: organizations.map((o) => [
            o.name,
            o.email || 'N/A',
            o.phoneNumber || o.phone || 'N/A',
            o.projectCount || 0,
            o.isActive ? 'Active' : 'Inactive',
          ]),
        },
        {
          title: 'Recent Platform Staff Accounts',
          columns: ['Full Name', 'Username', 'Email Address', 'Role Scope', 'Status'],
          columnWidths: [2.5, 2, 3, 2, 1.5],
          rows: users.map((u) => [
            u.fullName,
            u.userName,
            u.email,
            UserRoleLabels[toUserRole(u.role)] || 'Staff',
            u.isActive ? 'Active' : 'Inactive',
          ]),
        },
      ],
    });
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

        <div className="flex gap-2 flex-wrap items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5"
            title="Export administration audit summary as PDF"
          >
            <PdfIcon size={14} />
            <span>Export Summary (.pdf)</span>
          </Button>

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
          subtext="Active tenant companies"
          subtextColor="accent"
        />
        <StatCard
          label="Provisioned users"
          value={userCount}
          chartVariant="amber"
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
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        compact
                        title="No user accounts found"
                        description={isLoading ? 'Loading system user directory...' : 'No user accounts provisioned.'}
                      />
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
                  <th>PROJECTS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-0">
                      <EmptyState
                        compact
                        title="No organizations found"
                        description={isLoading ? 'Loading organization records...' : 'No customer organizations registered.'}
                      />
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <div className="font-semibold text-dark">{org.name}</div>
                        <div className="text-xs text-muted">{org.email || '—'}</div>
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
