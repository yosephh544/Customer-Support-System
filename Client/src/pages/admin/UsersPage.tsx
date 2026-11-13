import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/usersApi';
import { Table, type Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { FilterBar } from '../../components/common/FilterBar';
import { Alert } from '../../components/common/Alert';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  UsersIcon,
  PdfIcon,
} from '../../components/icons/Icons';
import { exportToPdf } from '../../utils/exportUtils';
import type { UserProfile } from '../../types';
import {
  UserRole,
  USER_ROLE_OPTIONS,
  UserRoleLabels,
  toUserRole,
} from '../../types';
import { validateEmail, validatePhone } from '../../utils/validation';

export interface UsersPageProps {
  readOnly?: boolean;
}

export const UsersPage: React.FC<UsersPageProps> = ({ readOnly = false }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Global notifications
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deactivate / delete confirm dialog state
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Add User Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('P@ssw0rd');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(UserRole.SupportAgent);
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Edit User Profile Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);
  const [editEmailError, setEditEmailError] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>(UserRole.SupportAgent);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editFormError, setEditFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // --- Change Password Modal State ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

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

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPhoneError(null);
    setEmailError(null);

    if (!fullName.trim() || !userName.trim() || !password) {
      setFormError({ message: 'Full name, username, and password are required.' });
      return;
    }

    if (password.length < 6) {
      setFormError({ message: 'Password must be at least 6 characters long.' });
      return;
    }

    // Validate phone number digits & format
    if (phone.trim()) {
      const phoneValidationErr = validatePhone(phone.trim(), false);
      if (phoneValidationErr) {
        setPhoneError(phoneValidationErr);
        setFormError({ message: phoneValidationErr });
        return;
      }
      const digits = phone.trim().replace(/\D/g, '');
      const duplicatePhone = users.some(
        (u) => u.phoneNumber && u.phoneNumber.trim().replace(/\D/g, '') === digits
      );
      if (duplicatePhone) {
        const dupMsg = 'A user with this phone number already exists in the system.';
        setPhoneError(dupMsg);
        setFormError({ message: dupMsg });
        return;
      }
    }

    // Validate email format & data type
    if (email.trim()) {
      const emailValidationErr = validateEmail(email.trim(), false);
      if (emailValidationErr) {
        setEmailError(emailValidationErr);
        setFormError({ message: emailValidationErr });
        return;
      }
      const duplicateEmail = users.some(
        (u) => u.email && u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );
      if (duplicateEmail) {
        const dupMsg = 'A user with this email address already exists in the system.';
        setEmailError(dupMsg);
        setFormError({ message: dupMsg });
        return;
      }
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
      setPhoneError(null);
      setEmailError(null);
      setPassword('P@ssw0rd');
      setShowAddPassword(false);
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

  // Open Edit Profile Modal
  const handleOpenEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setEditFullName(u.fullName || '');
    setEditUserName(u.userName || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phoneNumber || '');
    setEditPhoneError(null);
    setEditEmailError(null);
    setEditRole(toUserRole(u.role));
    setEditPassword('');
    setShowEditPassword(false);
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  // Handle Save Edit Profile
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError(null);
    setEditPhoneError(null);
    setEditEmailError(null);

    if (!editFullName.trim()) {
      setEditFormError({ message: 'Full name is required.' });
      return;
    }

    const isSelf = editingUser.id === currentUser?.id;

    if (isSelf && editPassword && editPassword.length < 6) {
      setEditFormError({ message: 'If providing a new password, it must be at least 6 characters long.' });
      return;
    }

    // Validate phone number digits & format
    if (editPhone.trim()) {
      const phoneValidationErr = validatePhone(editPhone.trim(), false);
      if (phoneValidationErr) {
        setEditPhoneError(phoneValidationErr);
        setEditFormError({ message: phoneValidationErr });
        return;
      }
      const digits = editPhone.trim().replace(/\D/g, '');
      const duplicatePhone = users.some(
        (u) => u.id !== editingUser.id && u.phoneNumber && u.phoneNumber.trim().replace(/\D/g, '') === digits
      );
      if (duplicatePhone) {
        const dupMsg = 'This phone number is already in use by another user.';
        setEditPhoneError(dupMsg);
        setEditFormError({ message: dupMsg });
        return;
      }
    }

    // Validate email if changed
    if (editEmail.trim()) {
      const emailValidationErr = validateEmail(editEmail.trim(), false);
      if (emailValidationErr) {
        setEditEmailError(emailValidationErr);
        setEditFormError({ message: emailValidationErr });
        return;
      }
      const duplicateEmail = users.some(
        (u) => u.id !== editingUser.id && u.email && u.email.trim().toLowerCase() === editEmail.trim().toLowerCase()
      );
      if (duplicateEmail) {
        const dupMsg = 'This email address is already in use by another user.';
        setEditEmailError(dupMsg);
        setEditFormError({ message: dupMsg });
        return;
      }
    }

    setIsEditSubmitting(true);
    try {
      await usersApi.updateUser(editingUser.id, {
        fullName: editFullName.trim(),
        userName: editUserName.trim() || undefined,
        email: editEmail.trim() || undefined,
        phoneNumber: editPhone.trim() || undefined,
        role: editRole,
        password: isSelf && editPassword.trim() ? editPassword : undefined,
        isActive: editingUser.isActive,
      });
      setSuccessMessage(`User profile for "${editFullName.trim()}" updated successfully.`);
      setIsEditModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setEditFormError({
        message: err.message || 'Failed to update user profile.',
        details: err.errors,
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Open Change Password Modal
  const handleOpenPasswordModal = (u: UserProfile) => {
    if (u.id !== currentUser?.id) {
      alert('Administrators can only update their own password. You cannot change another user\'s password after account creation.');
      return;
    }
    setPasswordUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordFormError(null);
    setIsPasswordModalOpen(true);
  };

  // Handle Save Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;
    setPasswordFormError(null);

    if (passwordUser.id !== currentUser?.id) {
      setPasswordFormError({
        message: 'Administrators can only update their own password. You cannot change another user\'s password after account creation.',
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordFormError({ message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFormError({ message: 'New password and confirm password do not match.' });
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await usersApi.changePassword(passwordUser.id, newPassword);
      setSuccessMessage(`Password for user "${passwordUser.fullName}" changed successfully.`);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setPasswordFormError({
        message: err.message || 'Failed to change user password.',
        details: err.errors,
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await usersApi.deleteUser(userToDelete.id);
      setSuccessMessage(`User "${userToDelete.fullName}" deactivated/deleted successfully.`);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to delete user account.',
        details: err.errors,
      });
    } finally {
      setIsDeleting(false);
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
    ...(!readOnly
      ? [
          {
            key: 'actions',
            header: 'ACTIONS',
            render: (u: UserProfile) => (
              <div className="table-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEditModal(u)}
                  title={u.id === currentUser?.id ? 'Edit Profile & Password' : 'Edit Profile'}
                >
                  <EditIcon size={14} />
                </Button>
                {/* Admin can ONLY update his own password after user creation */}
                {u.id === currentUser?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenPasswordModal(u)}
                    title="Change My Password"
                  >
                    <LockIcon size={14} />
                  </Button>
                )}
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
        ]
      : []),
  ];

  const handleExportPdf = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const rows = users.map((u) => {
      const roleLabel = UserRoleLabels[toUserRole(u.role)] || 'Staff';
      return [
        u.fullName,
        u.userName,
        u.email,
        u.phoneNumber || 'N/A',
        roleLabel,
        u.isActive ? 'Active' : 'Inactive',
      ];
    });

    exportToPdf({
      fileName: `Staff_Directory_${dateStr}.pdf`,
      title: 'System Personnel & User Account Directory',
      subtitle: 'Registered Platform Staff, Access Credentials & Operational Roles',
      authorOrRole: 'Administration',
      kpis: [
        { label: 'Total Accounts', value: totalCount, color: 'primary' },
        { label: 'Active Users', value: users.filter((u) => u.isActive).length, color: 'success' },
        { label: 'Currently in View', value: users.length, color: 'primary' },
      ],
      sections: [
        {
          title: 'Platform Staff Accounts',
          columns: ['Full Name', 'Username', 'Email Address', 'Phone', 'Role Scope', 'Status'],
          columnWidths: [2.5, 2, 3, 2, 2, 1.5],
          rows,
        },
      ],
    });
  };

  return (
    <div className="users-page-container">
      {/* Page Header */}
      <div className="page-header-row mb-4 flex-wrap gap-2">
        <div>
          <h2 className="main-page-title">
            {readOnly ? 'System User & Team Directory' : 'User Account Directory'}
          </h2>
          <p className="main-page-subtitle">
            {readOnly
              ? 'Directory of registered personnel, system roles, and operational contact profiles.'
              : 'Manage system access, identity credentials, and role assignments.'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          className="flex items-center gap-1.5"
          title="Export staff directory as PDF"
        >
          <PdfIcon size={14} />
          <span>Export Directory (.pdf)</span>
        </Button>
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
          !readOnly ? (
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
          ) : undefined
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          isLoading={isLoading}
          emptyIcon={<UsersIcon size={26} />}
          searchTerm={searchTerm}
          emptyTitle={searchTerm ? `No users matching "${searchTerm}"` : "No users found"}
          emptyMessage={
            searchTerm
              ? `We couldn't find any users matching "${searchTerm}". Try checking your spelling or clear your filters.`
              : 'No user accounts found in directory. Click "Create User" to register a new member.'
          }
          emptyAction={
            !readOnly ? (
              <Button
                size="sm"
                leftIcon={<PlusIcon size={14} />}
                onClick={() => {
                  setFormError(null);
                  setIsModalOpen(true);
                }}
              >
                Create User
              </Button>
            ) : undefined
          }
          emptySecondaryAction={
            (searchTerm || filterRole) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('');
                }}
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* --- 1. Add User Modal --- */}
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
              type={showAddPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowAddPassword(!showAddPassword)}
                  tabIndex={-1}
                  aria-label={showAddPassword ? 'Hide password' : 'Show password'}
                >
                  {showAddPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              }
            />
            <Select
              label="System Role"
              value={role}
              onChange={(e) => setRole(Number(e.target.value) as UserRole)}
              options={USER_ROLE_OPTIONS}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 0920496731"
              value={phone}
              error={phoneError || undefined}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              helperText="Digits only, min 7 digits (e.g. 0912345678 or +1 555-0199)"
            />
            <div className="user-form-full">
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="e.g. specialist@company.com"
                value={email}
                error={emailError || undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                helperText="Must be a valid email format and unique across all users"
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

      {/* --- 2. Edit User Profile Modal --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
        description={
          editingUser
            ? `Update profile details, contact information, and role for ${editingUser.fullName}.`
            : 'Update user profile details.'
        }
      >
        {editFormError && (
          <Alert
            variant="error"
            message={editFormError.message}
            details={editFormError.details}
            onClose={() => setEditFormError(null)}
          />
        )}

        <form onSubmit={handleSaveEditUser}>
          <div className="user-form-grid">
            <div className="user-form-full">
              <Input
                label="Full Name"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <Input
              label="Username"
              required
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 0920496731"
              value={editPhone}
              error={editPhoneError || undefined}
              onChange={(e) => {
                setEditPhone(e.target.value);
                if (editPhoneError) setEditPhoneError(null);
              }}
              helperText="Digits only, min 7 digits (e.g. 0912345678 or +1 555-0199)"
            />
            <div className="user-form-full">
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="e.g. specialist@company.com"
                value={editEmail}
                error={editEmailError || undefined}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  if (editEmailError) setEditEmailError(null);
                }}
                helperText="Must be a valid email format and unique across all users"
              />
            </div>
            <div className="user-form-full">
              <Select
                label="System Role"
                value={editRole}
                onChange={(e) => setEditRole(Number(e.target.value) as UserRole)}
                options={USER_ROLE_OPTIONS}
              />
            </div>

            {/* Admin can ONLY update his own password after user creation */}
            {editingUser?.id === currentUser?.id ? (
              <div className="user-form-full">
                <Input
                  label="New Password (Leave blank to keep current password)"
                  type={showEditPassword ? 'text' : 'password'}
                  placeholder="Enter new password (optional)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  rightIcon={
                    <button
                      type="button"
                      className="input-icon-btn"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      tabIndex={-1}
                      aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEditPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="user-form-full">
                <div
                  className="text-xs text-muted"
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-secondary-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <LockIcon size={15} className="text-secondary" />
                  <span>
                    <strong>Password Security:</strong> User credentials cannot be updated by administrators after account creation. Users manage their own passwords.
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions-right mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isEditSubmitting}
            >
              Update Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- 3. Change Password Modal --- */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change User Password"
        description={
          passwordUser
            ? `Set a secure new password for account "${passwordUser.fullName}" (@${passwordUser.userName || passwordUser.email}).`
            : 'Change user credentials.'
        }
      >
        {passwordFormError && (
          <Alert
            variant="error"
            message={passwordFormError.message}
            details={passwordFormError.details}
            onClose={() => setPasswordFormError(null)}
          />
        )}

        <form onSubmit={handleChangePassword}>
          <div className="user-form-grid">
            <div className="user-form-full">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                rightIcon={
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                }
              />
            </div>
            <div className="user-form-full">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                rightIcon={
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                }
              />
            </div>
          </div>
          <div className="modal-actions-right mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isPasswordSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPasswordSubmitting}
            >
              Set New Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- 4. Deactivate / Delete Confirmation Dialog --- */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Deactivate User Account"
        description={
          userToDelete ? (
            <div>
              Are you sure you want to deactivate user <strong>"{userToDelete.fullName}"</strong>?
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Their login access will be immediately revoked.
              </p>
            </div>
          ) : ''
        }
        confirmText="Deactivate User"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
