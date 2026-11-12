import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { usersApi } from '../../api/usersApi';
import { UserRole, UserRoleLabels, getRoleLabel } from '../../types';
import {
  BellIcon,
  HelpCircleIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  ChevronDownIcon,
  LogoutIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  ShieldIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  AlertCircleIcon,
  CheckIcon,
} from '../icons/Icons';

export interface HeaderProps {
  currentViewLabel?: string;
  onPlanWeek?: () => void;
  onReviewEscalations?: () => void;
  rightActions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  currentViewLabel = 'Team operations',
  onPlanWeek,
  onReviewEscalations,
  rightActions,
}) => {
  const { user, role, logout, updateCurrentUser } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Edit Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenEditProfile = () => {
    setEditFullName(user?.fullName || '');
    setEditUserName(user?.userName || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phoneNumber || '');
    setEditPassword('');
    setShowEditPassword(false);
    setProfileError(null);
    setProfileSuccess(null);
    setShowProfileMenu(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }
    if (!editUserName.trim()) {
      setProfileError('Username is required.');
      return;
    }

    setIsSubmitting(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const updatedUser = await usersApi.updateMyProfile({
        fullName: editFullName.trim(),
        userName: editUserName.trim(),
        email: editEmail.trim() || undefined,
        phoneNumber: editPhone.trim() || undefined,
        password: editPassword.trim() ? editPassword : undefined,
      });

      updateCurrentUser({
        fullName: updatedUser.fullName,
        userName: updatedUser.userName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
      });

      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileSuccess(null);
      }, 1200);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'Failed to update profile. Please try again.';
      setProfileError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Display user's true full name accurately
  const userFullName = user?.fullName?.trim() || user?.userName?.trim() || 'Specialist';

  const getUserInitials = () => {
    if (!userFullName) return 'U';
    const parts = userFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return userFullName.substring(0, 2).toUpperCase();
  };

  const getSectionCategory = () => {
    switch (role) {
      case UserRole.Admin:
        return 'Administration';
      case UserRole.TeamLead:
        return 'Operations';
      case UserRole.SupportAgent:
        return 'Specialist Portal';
      case UserRole.Director:
        return 'Executive Oversight';
      default:
        return 'Workspace';
    }
  };

  const getRoleDisplayName = () => {
    switch (role) {
      case UserRole.Admin:
        return UserRoleLabels[UserRole.Admin];
      case UserRole.TeamLead:
        return UserRoleLabels[UserRole.TeamLead];
      case UserRole.SupportAgent:
        return 'Support Specialist';
      case UserRole.Director:
        return UserRoleLabels[UserRole.Director];
      default:
        return role ? getRoleLabel(role) : 'Specialist';
    }
  };

  return (
    <header className="app-header">
      {/* Left: Greeting & Breadcrumbs */}
      <div className="header-left-col">
        <div className="header-greeting-block">
          <div className="header-greeting">
            <span role="img" aria-label="wave">👋</span>
            <span>
              Welcome back, <strong className="header-fullname">{userFullName}</strong>
            </span>
          </div>
          <div className="header-breadcrumbs">
            <span>{getSectionCategory()}</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-active">{currentViewLabel}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Theme Switcher, Utilities, Profile */}
      <div className="header-actions">
        {rightActions ? (
          rightActions
        ) : (
          <>
            {role === UserRole.TeamLead && (
              <div className="header-context-actions">
                {onPlanWeek && (
                  <Button variant="outline" size="sm" onClick={onPlanWeek}>
                    Plan week
                  </Button>
                )}
                {onReviewEscalations && (
                  <Button variant="accent" size="sm" onClick={onReviewEscalations}>
                    Review escalations
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Segmented Light / Dark / Auto Theme Toggle */}
        <div className="navbar-theme-switch" role="group" aria-label="Theme mode switcher">
          <button
            type="button"
            className={`theme-switch-btn ${themeMode === 'light' ? 'active' : ''}`}
            onClick={() => setThemeMode('light')}
            title="Switch to Light mode"
            aria-label="Light mode"
          >
            <SunIcon size={13} />
            <span>Light</span>
          </button>
          <button
            type="button"
            className={`theme-switch-btn ${themeMode === 'dark' ? 'active' : ''}`}
            onClick={() => setThemeMode('dark')}
            title="Switch to Dark mode"
            aria-label="Dark mode"
          >
            <MoonIcon size={13} />
            <span>Dark</span>
          </button>
          <button
            type="button"
            className={`theme-switch-btn ${themeMode === 'system' ? 'active' : ''}`}
            onClick={() => setThemeMode('system')}
            title="System default theme"
            aria-label="System auto theme"
          >
            <MonitorIcon size={13} />
            <span>Auto</span>
          </button>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="btn-header-icon"
          title="Notifications (2 updates)"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
        >
          <BellIcon size={16} />
          <span className="unread-indicator-dot" />
        </button>

        {/* Knowledge & Help */}
        <button
          type="button"
          className="btn-header-icon"
          title="Documentation & Knowledge Portal"
          onClick={() =>
            alert(
              'DAF Support Documentation: SOPs, SLA guides, and ticket runbooks are accessible in the knowledge portal.'
            )
          }
          aria-label="Help and Documentation"
        >
          <HelpCircleIcon size={16} />
        </button>

        <div className="navbar-divider" />

        {/* Profile Component & Popover Menu */}
        <div className="navbar-profile-wrapper" ref={profileMenuRef}>
          <button
            type="button"
            className={`navbar-profile-btn ${showProfileMenu ? 'active' : ''}`}
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
            aria-label="User profile menu"
          >
            <div className="navbar-avatar">
              <span className="navbar-avatar-text">{getUserInitials()}</span>
              <span className="navbar-avatar-status" />
            </div>
            <div className="navbar-profile-meta">
              <span className="navbar-profile-name" title={userFullName}>
                {userFullName}
              </span>
              <span className="navbar-profile-role">{getRoleDisplayName()}</span>
            </div>
            <ChevronDownIcon
              size={13}
              className={`navbar-profile-chevron ${showProfileMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showProfileMenu && (
            <div className="navbar-profile-dropdown" role="menu">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar">
                  <span>{getUserInitials()}</span>
                </div>
                <div className="profile-dropdown-user-details">
                  <div className="profile-dropdown-fullname" title={userFullName}>
                    {userFullName}
                  </div>
                  <div
                    className="profile-dropdown-email"
                    title={user?.email || user?.userName || ''}
                  >
                    {user?.email || user?.userName || 'specialist@daf.corp'}
                  </div>
                  <div className="profile-dropdown-badge-wrap">
                    <span className="role-pill-badge">{getRoleDisplayName()}</span>
                    {user?.isActive !== false && (
                      <span className="status-pill-badge">Active</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-dropdown-body">
                <div className="profile-dropdown-item-info">
                  <span className="dropdown-info-label">Username</span>
                  <span className="dropdown-info-value">{user?.userName || '—'}</span>
                </div>
                <div className="profile-dropdown-item-info">
                  <span className="dropdown-info-label">Security Role</span>
                  <span className="dropdown-info-value">{role || 'Specialist'}</span>
                </div>
                <div className="profile-dropdown-item-info">
                  <span className="dropdown-info-label">Theme Mode</span>
                  <span className="dropdown-info-value" style={{ textTransform: 'capitalize' }}>
                    {themeMode}
                  </span>
                </div>
              </div>

              <div className="profile-dropdown-actions">
                <button
                  type="button"
                  className="profile-dropdown-edit-btn"
                  onClick={handleOpenEditProfile}
                  role="menuitem"
                >
                  <EditIcon size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="profile-dropdown-footer">
                <button
                  type="button"
                  className="profile-dropdown-logout-btn"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  role="menuitem"
                >
                  <LogoutIcon size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit My Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Edit My Profile"
        description="Update your personal details, email, contact number, or account password."
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="modal-form-content">
          {profileError && (
            <div className="alert-message alert-danger" style={{ marginBottom: '14px' }}>
              <AlertCircleIcon size={16} />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="alert-message alert-success" style={{ marginBottom: '14px' }}>
              <CheckIcon size={16} />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="user-form-grid">
            <div className="user-form-full">
              <Input
                label="Full Name"
                required
                placeholder="e.g. Bereket Geberew"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                leftIcon={<UserIcon size={15} />}
              />
            </div>

            <div>
              <Input
                label="Username"
                required
                placeholder="e.g. beki"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. specialist@daf.corp"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                leftIcon={<MailIcon size={15} />}
              />
            </div>

            <div className="user-form-full">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. 0920496731"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                leftIcon={<PhoneIcon size={15} />}
              />
            </div>

            <div className="user-form-full">
              <Input
                label="New Password"
                type={showEditPassword ? 'text' : 'password'}
                placeholder="Leave blank to keep existing password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                leftIcon={<LockIcon size={15} />}
                helperText="Leave blank if you don't wish to change your password."
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

            <div className="user-form-full">
              <div className="profile-role-field-wrap">
                <label className="form-label">Role & Security Privileges</label>
                <div className="profile-role-display-box">
                  <div className="profile-role-display-left">
                    <ShieldIcon size={16} className="role-shield-icon" />
                    <span className="profile-role-text">{getRoleDisplayName()}</span>
                  </div>
                  <span className="profile-role-lock-badge">
                    <LockIcon size={11} /> Read Only
                  </span>
                </div>
                <span className="profile-role-notice">
                  Security roles are managed exclusively by system administrators and cannot be altered here.
                </span>
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProfileModalOpen(false)}
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
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
