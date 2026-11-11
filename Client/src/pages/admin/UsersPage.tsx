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

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('P@ssw0rd');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('SupportAgent');
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getUsers({
        pageNumber: page,
        pageSize,
        searchTerm,
        role: filterRole || undefined,
      });
      setUsers(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error(err);
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
      setFormError('Full name, email, and password are required.');
      return;
    }

    try {
      await usersApi.createUser({
        fullName: fullName.trim(),
        userName: userName.trim() || undefined,
        email: email.trim(),
        password,
        phoneNumber: phone.trim() || undefined,
        role,
      });
      setIsModalOpen(false);
      setFullName('');
      setUserName('');
      setEmail('');
      setPhone('');
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user account.');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to deactivate/delete user "${user.fullName}"?`)) return;
    try {
      await usersApi.deleteUser(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
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
          {u.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (u) => (
        <button
          type="button"
          className="icon-action-btn danger"
          onClick={() => handleDeleteUser(u)}
          title="Deactivate user"
        >
          <TrashIcon size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="users-page">
      <div className="page-header-row">
        <div>
          <h2 className="section-title">User Account Management</h2>
          <p className="section-subtitle">
            Administer system user credentials and assign roles (Team Lead, Support Agent, Director, Admin).
          </p>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search users by name, username, or email..."
        actionButton={
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add User
          </Button>
        }
      >
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="Admin">Administrator</option>
          <option value="TeamLead">Team Lead</option>
          <option value="SupportAgent">Support Agent</option>
          <option value="Director">Director</option>
        </select>
      </FilterBar>

      <div className="content-card">
        <Table
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          isLoading={isLoading}
          emptyMessage="No users found matching the query."
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User Account"
        description="Register a team member with role-based access control."
      >
        {formError && <div className="form-error-alert">{formError}</div>}
        <form onSubmit={handleCreateUser}>
          <Input
            label="Full Name"
            required
            placeholder="e.g. Elena Rossi"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Username (for Sign-in)"
            placeholder="e.g. elena"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            helperText="Can be used interchangeably with email for login."
          />
          <Input
            label="Work Email"
            type="email"
            required
            placeholder="elena@daf.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Initial Password"
            type="password"
            required
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="+1 555-0199"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Select
            label="System Role"
            required
            options={[
              { value: 'SupportAgent', label: 'Support Agent (Handles touchpoints)' },
              { value: 'TeamLead', label: 'Team Lead (Projects, modules, assigning, schedules)' },
              { value: 'Director', label: 'Director (Executive analytics & oversight)' },
              { value: 'Admin', label: 'Administrator (Organizations & user accounts)' },
            ]}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          />
          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
