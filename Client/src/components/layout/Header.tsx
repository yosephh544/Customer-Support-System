import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { usersApi } from '../../api/usersApi';
import { UserRole, UserRoleLabels, getRoleLabel } from '../../types';
import {
  BellIcon,
  SunIcon,
  MoonIcon,
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
  CalendarIcon,
  BuildingIcon,
  ProjectIcon,
  StarIcon,
} from '../icons/Icons';
import { validateEmail, validatePhone, sanitizePhoneInput } from '../../utils/validation';
import { notificationsApi } from '../../api/notificationsApi';
import type { AppNotification } from '../../types';

export interface HeaderProps {
  currentViewLabel?: string;
  onPlanWeek?: () => void;
  onReviewEscalations?: () => void;
  rightActions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  currentViewLabel = 'Team operations',
  rightActions,
}) => {
  const { user, role, logout, updateCurrentUser } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationTab, setNotificationTab] = useState<'all' | 'unread'>('all');
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Edit Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);
  const [editEmailError, setEditEmailError] = useState<string | null>(null);
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
    setEditPhoneError(null);
    setEditEmailError(null);
    setEditPassword('');
    setShowEditPassword(false);
    setProfileError(null);
    setProfileSuccess(null);
    setShowProfileMenu(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setEditPhoneError(null);
    setEditEmailError(null);

    if (!editFullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }
    if (!editUserName.trim()) {
      setProfileError('Username is required.');
      return;
    }

    // Validate phone number format & digits
    if (editPhone.trim()) {
      const phoneValidationErr = validatePhone(editPhone.trim(), false);
      if (phoneValidationErr) {
        setEditPhoneError(phoneValidationErr);
        setProfileError(phoneValidationErr);
        return;
      }
    }

    // Validate email format & data type
    if (editEmail.trim()) {
      const emailValidationErr = validateEmail(editEmail.trim(), false);
      if (emailValidationErr) {
        setEditEmailError(emailValidationErr);
        setProfileError(emailValidationErr);
        return;
      }
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
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showProfileMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showNotifications]);

  // Load notifications and poll periodically
  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getMyNotifications({ limit: 40 });
      setNotifications(res.items || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore transient poll error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const displayedNotifications = useMemo(() => {
    if (notificationTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, notificationTab]);

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
      {/* Left: View Breadcrumbs */}
      <div className="header-left-col">
        <div className="header-greeting-block">
          <div className="header-breadcrumbs">
            <span>{getSectionCategory()}</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-active">{currentViewLabel}</span>
          </div>
        </div>
      </div>

      {/* Right: Theme Toggle (Icons Only), Notifications, Profile */}
      <div className="header-actions">
        {rightActions}

        {/* Simplified Icon-Only Light / Dark Mode Toggle */}
        <div className="navbar-theme-switch icon-only-switch" role="group" aria-label="Theme switcher">
          <button
            type="button"
            className={`theme-switch-btn icon-only ${themeMode === 'light' ? 'active' : ''}`}
            onClick={() => setThemeMode('light')}
            title="Switch to Light mode"
            aria-label="Light mode"
          >
            <SunIcon size={14} />
          </button>
          <button
            type="button"
            className={`theme-switch-btn icon-only ${themeMode === 'dark' ? 'active' : ''}`}
            onClick={() => setThemeMode('dark')}
            title="Switch to Dark mode"
            aria-label="Dark mode"
          >
            <MoonIcon size={14} />
          </button>
        </div>

        {/* Notification Bell & Live Popover */}
        <div className="navbar-notifications-wrapper" ref={notificationMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`btn-header-icon ${showNotifications ? 'active' : ''}`}
            title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <BellIcon size={16} />
            {unreadCount > 0 && (
              <span className="unread-counter-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-popover" role="dialog" aria-label="Notifications panel">
              <div className="notifications-popover-header">
                <div className="flex items-center gap-2">
                  <span className="notifications-title">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge badge-accent" style={{ fontSize: 10 }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notifications-mark-all-btn"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Filter Tabs */}
              <div className="notifications-tab-bar">
                <button
                  type="button"
                  className={`notifications-tab-btn ${notificationTab === 'all' ? 'active' : ''}`}
                  onClick={() => setNotificationTab('all')}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  className={`notifications-tab-btn ${notificationTab === 'unread' ? 'active' : ''}`}
                  onClick={() => setNotificationTab('unread')}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="notifications-popover-list">
                {displayedNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted">
                    <div className="flex justify-center mb-2 text-muted">
                      <BellIcon size={22} />
                    </div>
                    <span>No {notificationTab === 'unread' ? 'unread' : ''} notifications at this time.</span>
                  </div>
                ) : (
                  displayedNotifications.map((notif) => {
                    return (
                      <div
                        key={notif.id}
                        className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                      >
                        <div className="notification-icon-col">
                          {notif.type === 'ScheduleAssignment' || notif.type === 'ScheduleUpdate' ? (
                            <div className="notification-icon-wrap schedule">
                              <CalendarIcon size={14} />
                            </div>
                          ) : notif.type === 'NewOrganization' ? (
                            <div className="notification-icon-wrap org">
                              <BuildingIcon size={14} />
                            </div>
                          ) : notif.type === 'TaskIncomplete' ? (
                            <div className="notification-icon-wrap alert">
                              <AlertCircleIcon size={14} />
                            </div>
                          ) : notif.type === 'CriticalFeedback' ? (
                            <div className="notification-icon-wrap star">
                              <StarIcon size={14} />
                            </div>
                          ) : (
                            <div className="notification-icon-wrap default">
                              <ProjectIcon size={14} />
                            </div>
                          )}
                        </div>

                        <div className="notification-content-col">
                          <div className="notification-title-row">
                            <span className="notification-item-title">{notif.title}</span>
                            <span className="notification-item-time">{formatTimeAgo(notif.createdAt)}</span>
                          </div>
                          <p className="notification-item-msg">{notif.message}</p>
                        </div>

                        {!notif.isRead && <span className="notification-unread-dot" title="Mark as read" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                leftIcon={<UserIcon size={15} />}
              />
            </div>

            <div>
              <Input
                label="Username"
                required
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Email Address"
                type="email"
                value={editEmail}
                error={editEmailError || undefined}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  if (editEmailError) setEditEmailError(null);
                }}
                leftIcon={<MailIcon size={15} />}
              />
            </div>

            <div className="user-form-full">
              <Input
                label="Phone Number"
                type="tel"
                value={editPhone}
                error={editPhoneError || undefined}
                onChange={(e) => {
                  setEditPhone(sanitizePhoneInput(e.target.value));
                  if (editPhoneError) setEditPhoneError(null);
                }}
                leftIcon={<PhoneIcon size={15} />}
              />
            </div>

            <div className="user-form-full">
              <Input
                label="New Password"
                type={showEditPassword ? 'text' : 'password'}
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
