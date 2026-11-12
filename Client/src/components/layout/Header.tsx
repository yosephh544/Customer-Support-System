import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { UserRole, UserRoleLabels, getRoleLabel } from '../../types';
import {
  BellIcon,
  HelpCircleIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  ChevronDownIcon,
  LogoutIcon,
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
  const { user, role, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
    </header>
  );
};
