import React, { useEffect, useState } from 'react';
import { usersApi } from '../../api/usersApi';
import { Button } from '../../components/common/Button';
import { FilterBar } from '../../components/common/FilterBar';
import { Table } from '../../components/common/Table';
import type { Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { PlusIcon, EditIcon, TrashIcon } from '../../components/icons/Icons';
import type { UserProfile, UserRole } from '../../types';

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
  const [role, setRole] = useState<UserRole>('SupportAgent');
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
    if (!fullName.trim() || !email.trim() || !password) {
      setFormError({ message: 'Full name, email, and password are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await usersApi.createUser({
        fullName: fullName.trim(),
        userName: userName.trim() || undefined,
        email: email.trim(),
        password,
        phoneNumber: phone.trim() || undefined,
        role,
      });
      setSuccessMessage(`User account "${fullName.trim()}" created successfully.`);
      setIsModalOpen(false);
      setFullName('');
      setUserName('');
      setEmail('');
      setPhone('');
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

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'Admin':
        return <Badge variant="danger">Administrator</Badge>;
      case 'TeamLead':
        return <Badge variant="primary">Team Lead</Badge>;
      case 'Director':
        return <Badge variant="purple">Director</Badge>;
      case 'SupportAgent':
        return <Badge variant="success">Support Agent</Badge>;
      default:
        return <Badge variant="neutral">{r}</Badge>;
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
      render: (u) => <span className="font-medium text-sm">{u.email}</span>,
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
      header: 'REGISTERED',
      render: (u) => (
        <span className="text-xs text-muted">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (u) => (
        <div className="action-buttons-cell">
          <button
            type="button"
            className="icon-action-btn danger"
            onClick={() => handleDeleteUser(u)}
            title="Deactivate User"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="users-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">User Account Directory</h2>
          <p className="main-page-subtitle">
            Manage system access, identity credentials, and role assignments.
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {pageError && (
        <Alert
          variant="error"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
          action={
            <Button size="sm" variant="outline" onClick={loadUsers}>
              Retry Connection
            </Button>
          }
        />
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email, or username..."
        filters={
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'Admin', label: 'Administrator' },
              { value: 'TeamLead', label: 'Team Lead' },
              { value: 'SupportAgent', label: 'Support Agent' },
              { value: 'Director', label: 'Director' },
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
        title="Provision New User Account"
        description="Create an account with role credentials and login permissions."
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
          <Input
            label="Full Name"
            required
            placeholder="e.g. John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Username (Optional)"
            placeholder="e.g. jdoe"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            helperText="If omitted, will default to email prefix."
          />
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="jdoe@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Initial Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Default temporary password for first sign-in."
          />
          <Input
            label="Phone Number"
            placeholder="+1 555-0129"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Select
            label="System Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { value: 'SupportAgent', label: 'Support Agent (Specialist)' },
              { value: 'TeamLead', label: 'Team Lead (Ops & Scheduling)' },
              { value: 'Director', label: 'Director (Executive Insights)' },
              { value: 'Admin', label: 'Administrator (Users & Orgs)' },
            ]}
          />
          <div className="modal-actions-right">
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
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
