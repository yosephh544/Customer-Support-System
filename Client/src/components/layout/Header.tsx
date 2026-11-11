import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { SearchIcon, BellIcon, HelpCircleIcon } from '../icons/Icons';

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
  const { user, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const getFirstName = () => {
    if (!user?.fullName) return 'Specialist';
    return user.fullName.split(' ')[0];
  };

  const getSectionCategory = () => {
    switch (role) {
      case 'Admin':
        return 'Administration';
      case 'TeamLead':
        return 'Operations';
      case 'SupportAgent':
        return 'Specialist Portal';
      case 'Director':
        return 'Executive Oversight';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="app-header">
      {/* Left Greeting & Breadcrumb */}
      <div className="header-left-col">
        <div className="header-greeting-block">
          <div className="header-greeting">
            <span>👋</span>
            <span>Welcome back, {getFirstName()}</span>
          </div>
          <div className="header-breadcrumbs">
            <span>{getSectionCategory()}</span>
            <span>/</span>
            <span className="crumb-active">{currentViewLabel}</span>
          </div>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="header-search-bar">
        <SearchIcon size={14} className="text-muted" />
        <input
          type="text"
          className="header-search-input"
          placeholder="Search tickets, clients, modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-shortcut-badge">⌘K</span>
      </div>

      {/* Right Actions & Utilities */}
      <div className="header-actions">
        {rightActions ? (
          rightActions
        ) : (
          <>
            {role === 'TeamLead' && (
              <>
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
              </>
            )}
          </>
        )}

        <button
          type="button"
          className="btn-header-icon"
          title="Notifications (2 updates)"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <BellIcon size={16} />
          <span className="unread-indicator-dot" />
        </button>

        <button
          type="button"
          className="btn-header-icon"
          title="Documentation & Help Center"
          onClick={() => alert('DAF Support Documentation: SOPs, SLA guides, and ticket runbooks are accessible in the knowledge portal.')}
        >
          <HelpCircleIcon size={16} />
        </button>
      </div>
    </header>
  );
};
