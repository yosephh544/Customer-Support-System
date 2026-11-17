import React, { useEffect, useState } from 'react';
import { Alert } from '../../components/common/Alert';
import { Button } from '../../components/common/Button';
import { AdminPulseDashboard } from '../../components/dashboards/AdminPulseDashboard';
import { BuildingIcon, PdfIcon, UsersIcon } from '../../components/icons/Icons';
import { organizationsApi } from '../../api/organizationsApi';
import { usersApi } from '../../api/usersApi';
import { exportToPdf } from '../../utils/exportUtils';
import { UserRoleLabels, toUserRole } from '../../types';
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
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  const fetchStats = async () => {
    setPageError(null);
    try {
      const [orgsRes, usersRes] = await Promise.all([
        organizationsApi.getOrganizations({ pageSize: 100 }),
        usersApi.getUsers({ pageSize: 100 }),
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
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportPdf = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPdf({
      fileName: `Administration_Audit_Summary_${dateStr}.pdf`,
      title: 'Customer Support Platform - Administration Summary',
      subtitle: 'Tenant overview, provisioned user accounts, and governance audit',
      authorOrRole: 'Platform Administrator',
      kpis: [
        { label: 'Registered Tenants', value: orgCount, color: 'primary' },
        { label: 'Platform Users', value: userCount, color: 'success' },
        { label: 'Projects Deployed', value: organizations.reduce((sum, org) => sum + (org.projectCount || 0), 0), color: 'primary' },
        { label: 'Active Accounts', value: users.filter((user) => user.isActive).length, color: 'success' },
      ],
      sections: [
        {
          title: 'Customer Organizations',
          columns: ['Organization Name', 'Email Address', 'Phone', 'Projects', 'Status'],
          columnWidths: [3, 3, 2, 2, 2],
          rows: organizations.map((org) => [
            org.name,
            org.email || 'N/A',
            org.phoneNumber || org.phone || 'N/A',
            org.projectCount || 0,
            org.isActive ? 'Active' : 'Inactive',
          ]),
        },
        {
          title: 'Platform Staff Accounts',
          columns: ['Full Name', 'Username', 'Email Address', 'Role', 'Status'],
          columnWidths: [2.5, 2, 3, 2, 1.5],
          rows: users.map((user) => [
            user.fullName,
            user.userName,
            user.email,
            UserRoleLabels[toUserRole(user.role)] || 'Staff',
            user.isActive ? 'Active' : 'Disabled',
          ]),
        },
      ],
    });
  };

  return (
    <div className="admin-dashboard-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Admin Dashboard</h1>
          <p className="main-page-subtitle">
            Tenant access, user provisioning, and platform governance at a glance.
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
            <span>Export Summary</span>
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

      <AdminPulseDashboard
        organizations={organizations}
        users={users}
        orgCount={orgCount}
        userCount={userCount}
        onNavigateToOrganizations={onNavigateToOrganizations}
        onNavigateToUsers={onNavigateToUsers}
      />
    </div>
  );
};
