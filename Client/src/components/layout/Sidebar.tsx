import React from 'react';
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
} from '../icons/Icons';
import { Badge } from '../common/Badge';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, role, logout } = useAuth();

  // Role-specific navigation items
  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'Admin':
        return [
          { id: 'admin-dashboard', label: 'Admin operations', icon: <DashboardIcon size={19} /> },
          { id: 'organizations', label: 'Organizations', icon: <BuildingIcon size={19} /> },
          { id: 'users', label: 'User management', icon: <UsersIcon size={19} /> },
          { id: 'permissions', label: 'Role permissions', icon: <ShieldIcon size={19} /> },
        ];

      case 'TeamLead':
        return [
          { id: 'team-workspace', label: 'My workspace', icon: <CheckSquareIcon size={19} /> },
          { id: 'team-operations', label: 'Team operations', icon: <DashboardIcon size={19} /> },
          { id: 'schedule-planner', label: 'Schedule planner', icon: <CalendarIcon size={19} /> },
          { id: 'projects', label: 'Projects & Modules', icon: <ProjectIcon size={19} /> },
          { id: 'assignments', label: 'Team assignments', icon: <UsersIcon size={19} /> },
        ];

      case 'SupportAgent':
        return [
          { id: 'agent-workspace', label: 'My workspace', icon: <DashboardIcon size={19} /> },
          { id: 'my-touchpoints', label: 'My touchpoints', icon: <CalendarIcon size={19} /> },
          { id: 'agent-projects', label: 'Assigned projects', icon: <ProjectIcon size={19} /> },
        ];

      case 'Director':
        return [
          { id: 'executive-insights', label: 'Executive insights', icon: <TrendingUpIcon size={19} /> },
          { id: 'organizations-view', label: 'Organizations', icon: <BuildingIcon size={19} /> },
          { id: 'projects-view', label: 'Projects & Delivery', icon: <ProjectIcon size={19} /> },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleBadgeVariant = (userRole?: string) => {
    switch (userRole) {
      case 'Admin':
        return 'danger';
      case 'TeamLead':
        return 'primary';
      case 'Director':
        return 'purple';
      case 'SupportAgent':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-container">
          <LogoPulse size={22} className="brand-logo-icon" />
        </div>
        <span className="brand-name">DAF Support</span>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-button ${isActive ? 'active' : ''}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-card">
          <div className="user-avatar">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || 'User'}</span>
            <div className="user-meta">
              <Badge variant={getRoleBadgeVariant(role)} size="sm">
                {role || 'User'}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            className="btn-logout"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogoutIcon size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

