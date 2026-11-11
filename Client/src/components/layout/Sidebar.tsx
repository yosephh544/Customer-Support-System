import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogoPulse,
  DashboardIcon,
  UsersIcon,
  BuildingIcon,
  ProjectIcon,
  CalendarIcon,
  CheckSquareIcon,
  TrendingUpIcon,
  ShieldIcon,
  LogoutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HelpCircleIcon,
} from '../icons/Icons';
import { Badge } from '../common/Badge';

export interface NavGroup {
  groupName: string;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, role, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Grouped Navigation per role
  const getNavGroups = (): NavGroup[] => {
    switch (role) {
      case 'Admin':
        return [
          {
            groupName: 'Administration',
            items: [
              { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <DashboardIcon size={17} /> },
              { id: 'organizations', label: 'Organizations', icon: <BuildingIcon size={17} /> },
              { id: 'users', label: 'User accounts', icon: <UsersIcon size={17} /> },
              { id: 'permissions', label: 'Security matrix', icon: <ShieldIcon size={17} /> },
            ],
          },
        ];

      case 'TeamLead':
        return [
          {
            groupName: 'Operations',
            items: [
              { id: 'team-operations', label: 'Operations Dashboard', icon: <DashboardIcon size={17} /> },
              { id: 'schedule-planner', label: 'Schedule planner', icon: <CalendarIcon size={17} /> },
            ],
          },
          {
            groupName: 'Management',
            items: [
              { id: 'projects', label: 'Projects & Modules', icon: <ProjectIcon size={17} /> },
              { id: 'assignments', label: 'Team assignments', icon: <UsersIcon size={17} /> },
            ],
          },
        ];

      case 'SupportAgent':
        return [
          {
            groupName: 'Operations',
            items: [
              { id: 'agent-workspace', label: 'Specialist Dashboard', icon: <DashboardIcon size={17} /> },
              { id: 'my-touchpoints', label: 'My touchpoints', icon: <CalendarIcon size={17} /> },
            ],
          },
          {
            groupName: 'Portfolio',
            items: [
              { id: 'agent-projects', label: 'Assigned projects', icon: <ProjectIcon size={17} /> },
            ],
          },
        ];

      case 'Director':
        return [
          {
            groupName: 'Intelligence',
            items: [
              { id: 'executive-insights', label: 'Executive Dashboard', icon: <TrendingUpIcon size={17} /> },
              { id: 'organizations-view', label: 'Customer tenants', icon: <BuildingIcon size={17} /> },
              { id: 'projects-view', label: 'Projects & Delivery', icon: <ProjectIcon size={17} /> },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const navGroups = getNavGroups();

  const getRoleBadgeVariant = (userRole?: string) => {
    switch (userRole) {
      case 'Admin':
        return 'danger';
      case 'TeamLead':
        return 'primary';
      case 'Director':
        return 'purple';
      case 'SupportAgent':
        return 'accent';
      default:
        return 'neutral';
    }
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-left">
          <div className="brand-logo-container">
            <LogoPulse size={18} className="brand-logo-icon" />
          </div>
          {!isCollapsed && (
            <div className="brand-text-block">
              <span className="brand-name">DAF SUPPORT</span>
              <span className="brand-subtitle">Operations Portal</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRightIcon size={15} /> : <ChevronLeftIcon size={15} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.groupName} className="nav-group mb-2">
            {!isCollapsed && (
              <span className="nav-group-header">{group.groupName}</span>
            )}
            <ul className="nav-list">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id} className="nav-item">
                    <button
                      type="button"
                      className={`nav-button ${isActive ? 'active' : ''}`}
                      onClick={() => onTabChange(item.id)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {!isCollapsed && <span className="nav-label">{item.label}</span>}
                      {!isCollapsed && item.badge && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-card">
          <div className="user-avatar-wrap">
            <div className="user-avatar">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="user-status-dot" title="Active Specialist" />
          </div>

          {!isCollapsed && (
            <div className="user-info">
              <span className="user-name" title={user?.fullName || 'User'}>
                {user?.fullName || 'User'}
              </span>
              <span className="user-role-text">
                {role === 'SupportAgent' ? 'Specialist' : role || 'User'}
              </span>
            </div>
          )}

          <button
            type="button"
            className="btn-logout"
            onClick={logout}
            title="Sign out of workspace"
            aria-label="Sign out"
          >
            <LogoutIcon size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
