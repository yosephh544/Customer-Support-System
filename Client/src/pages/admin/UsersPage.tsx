import React, { useState, useEffect } from 'react';
import { usersApi } from '../../api/usersApi';
import { Table, type Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { FilterBar } from '../../components/common/FilterBar';
import { Alert } from '../../components/common/Alert';
import { PlusIcon, EditIcon, TrashIcon } from '../../components/icons/Icons';
import type { UserProfile } from '../../types';
import {
  UserRole,
  USER_ROLE_OPTIONS,
  UserRoleLabels,
  toUserRole,
} from '../../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Error & success notifications
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('P@ssw0rd');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SupportAgent);
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await usersApi.getUsers({
        pageNumber: page,
        pageSize,
        searchTerm,
        role: filterRole || undefined,
      });
      setUsers(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load user accounts.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, searchTerm, filterRole]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fullName.trim() || !userName.trim() || !password) {
      setFormError({ message: 'Full name, username, and password are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await usersApi.createUser({
        fullName: fullName.trim(),
        userName: userName.trim(),
        email: email.trim() || undefined,
        password,
        phoneNumber: phone.trim() || undefined,
        role: Number(role),
      });
      setSuccessMessage(`User account "${fullName.trim()}" created successfully.`);
      setIsModalOpen(false);
      setFullName('');
      setUserName('');
      setEmail('');
      setPhone('');
      setPassword('P@ssw0rd');
      setRole(UserRole.SupportAgent);
      loadUsers();
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to create user account.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to deactivate/delete user "${user.fullName}"?`)) return;
    try {
      await usersApi.deleteUser(user.id);
      setSuccessMessage(`User "${user.fullName}" deleted successfully.`);
      loadUsers();
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to delete user account.',
        details: err.errors,
      });
    }
  };

  const getRoleBadge = (r: UserRole | string | number) => {
    const roleEnum = toUserRole(r);
    switch (roleEnum) {
      case UserRole.Admin:
        return <Badge variant="danger">{UserRoleLabels[UserRole.Admin]}</Badge>;
      case UserRole.TeamLead:
        return <Badge variant="primary">{UserRoleLabels[UserRole.TeamLead]}</Badge>;
      case UserRole.Director:
        return <Badge variant="purple">{UserRoleLabels[UserRole.Director]}</Badge>;
      case UserRole.SupportAgent:
      default:
        return <Badge variant="success">{UserRoleLabels[UserRole.SupportAgent]}</Badge>;
    }
  };

  const columns: Column<UserProfile>[] = [
    {
      key: 'fullName',
      header: 'NAME & USERNAME',
      render: (u) => (
        <div className="agent-cell">
          <span className="agent-avatar">{u.fullName.charAt(0)}</span>
          <div>
            <div className="font-semibold text-dark">{u.fullName}</div>
            <div className="text-xs text-muted">@{u.userName || u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'EMAIL ADDRESS',
      render: (u) => <span className="font-medium text-sm">{u.email || '—'}</span>,
    },
    {
      key: 'role',
      header: 'ASSIGNED ROLE',
      render: (u) => getRoleBadge(u.role),
    },
    {
      key: 'isActive',
      header: 'STATUS',
      render: (u) => (
        <Badge variant={u.isActive ? 'success' : 'neutral'} dot>
          {u.isActive ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'ENROLLED',
      render: (u) => (
        <span className="text-xs text-muted">
          {new Date(u.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      render: (u) => (
        <div className="table-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alert(`Direct permissions for ${u.fullName} can be managed in Security Matrix.`)}
            title="Inspect Permissions"
          >
            <EditIcon size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(u)}
            className="text-danger"
            title="Deactivate Account"
          >
            <TrashIcon size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="users-page-container">
      {/* Page Header */}
      <div className="page-header-row mb-4">
        <div>
          <h2 className="main-page-title">User Account Directory</h2>
          <p className="main-page-subtitle">
            Manage system access, identity credentials, and role assignments.
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={16} />}
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
          >
            Add New User
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          autoCloseDuration={4000}
        />
      )}

      {pageError && (
        <Alert
          variant="error"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
          action={
            <Button variant="outline" size="sm" onClick={loadUsers}>
              Retry Load
            </Button>
          }
        />
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              ...USER_ROLE_OPTIONS.map((opt) => ({
                value: opt.value.toString(),
                label: opt.label,
              })),
            ]}
          />
        }
        actionButton={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon size={15} />}
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
          >
            Create User
          </Button>
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          isLoading={isLoading}
          emptyMessage="No users found matching your filters. Click 'Create User' to register a new member."
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create User Account"
        description="Provision account credentials and access role for the new member."
      >
        {formError && (
          <Alert
            variant="error"
            message={formError.message}
            details={formError.details}
            onClose={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleCreateUser}>
          <div className="user-form-grid">
            <div className="user-form-full">
              <Input
                label="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <Input
              label="Username"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <Input
              label="Initial Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Select
              label="System Role"
              value={role}
              onChange={(e) => setRole(Number(e.target.value) as UserRole)}
              options={USER_ROLE_OPTIONS}
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="user-form-full">
              <Input
                label="Email Address (Optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions-right mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
