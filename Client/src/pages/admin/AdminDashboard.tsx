import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { organizationsApi } from '../../api/organizationsApi';
import { usersApi } from '../../api/usersApi';
import { BuildingIcon, UsersIcon, ShieldIcon } from '../../components/icons/Icons';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orgs, users] = await Promise.all([
          organizationsApi.getOrganizations({ pageSize: 1 }),
          usersApi.getUsers({ pageSize: 1 }),
        ]);
        setOrgCount(orgs.totalCount || 0);
        setUserCount(users.totalCount || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Administration Operations</h1>
          <p className="main-page-subtitle">
            Manage customer tenant organizations, user accounts, and system access policies.
          </p>
        </div>
      </div>

      <div className="kpi-cards-grid">
        <StatCard
          label="Registered Organizations"
          value={orgCount}
          subtext="Active customer tenants"
          icon={<BuildingIcon size={20} />}
        />
        <StatCard
          label="Total User Accounts"
          value={userCount}
          subtext="Across all 4 system roles"
          icon={<UsersIcon size={20} />}
        />
        <StatCard
          label="Role Enforcement"
          value="Strict"
          subtext="Dynamic Permission Matrix Active"
          icon={<ShieldIcon size={20} />}
        />
        <StatCard
          label="Encryption Standard"
          value="AES-256"
          subtext="Payloads & credentials encrypted"
          icon={<ShieldIcon size={20} />}
        />
      </div>

      <div className="admin-quick-links-grid mt-6">
        <div className="dashboard-card clickable-card" onClick={onNavigateToOrganizations}>
          <div className="flex items-center gap-3">
            <div className="card-icon-box primary">
              <BuildingIcon size={24} />
            </div>
            <div>
              <h3 className="card-title">Manage Organizations</h3>
              <p className="card-subtitle">
                Register customer organizations, update contact details, and configure client entities.
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card clickable-card" onClick={onNavigateToUsers}>
          <div className="flex items-center gap-3">
            <div className="card-icon-box purple">
              <UsersIcon size={24} />
            </div>
            <div>
              <h3 className="card-title">User Accounts & Roles</h3>
              <p className="card-subtitle">
                Create new user accounts, assign roles (Team Lead, Support Agent, Director), and reset passwords.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

