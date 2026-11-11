import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Alert } from '../../components/common/Alert';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { organizationsApi } from '../../api/organizationsApi';
import { usersApi } from '../../api/usersApi';
import { BuildingIcon, UsersIcon, ShieldIcon, CheckIcon } from '../../components/icons/Icons';

export interface AdminDashboardProps {
  onNavigateToOrganizations: () => void;
  onNavigateToUsers: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToOrganizations,
  onNavigateToUsers,
}) => {
  const [orgCount, setOrgCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const [orgs, users] = await Promise.all([
        organizationsApi.getOrganizations({ pageSize: 1 }),
        usersApi.getUsers({ pageSize: 1 }),
      ]);
      setOrgCount(orgs.totalCount || 0);
      setUserCount(users.totalCount || 0);
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

  return (
    <div className="admin-dashboard-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Administration & Tenant Operations</h1>
          <p className="main-page-subtitle">
            Customer tenant onboarding, identity provisioning, and role security boundaries.
          </p>
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

      {/* KPI Cards with Sparklines */}
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
          subtext="Dynamic permission engine"
          icon={<ShieldIcon size={16} />}
        />
        <StatCard
          label="Encryption standard"
          value="AES-256"
          subtext="Credentials & token security"
          icon={<ShieldIcon size={16} />}
        />
      </div>

      <div className="operations-split-grid mt-4">
        {/* Manage Organizations Quick Action Card */}
        <div
          className="dashboard-card"
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={onNavigateToOrganizations}
        >
          <div className="flex items-start gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BuildingIcon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="card-title">Manage Customer Organizations</h3>
                <span className="badge badge-accent">Directory</span>
              </div>
              <p className="card-subtitle mt-1">
                Register customer organizations with auto-generated unique codes, manage business contacts, and view active project allocations.
              </p>
              <div className="mt-3">
                <span className="btn-link text-accent font-semibold text-xs">
                  Open Organizations Directory &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Management Card */}
        <div
          className="dashboard-card"
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={onNavigateToUsers}
        >
          <div className="flex items-start gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UsersIcon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="card-title">User Accounts & Roles</h3>
                <span className="badge badge-primary">Security</span>
              </div>
              <p className="card-subtitle mt-1">
                Provision new user accounts, assign roles (Team Lead, Support Agent, Director), and configure authentication policies.
              </p>
              <div className="mt-3">
                <span className="btn-link text-primary font-semibold text-xs">
                  Open User Directory &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
