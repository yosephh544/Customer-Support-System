import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

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
  const { role } = useAuth();

  const getRolePrefix = () => {
    switch (role) {
      case 'Admin':
        return 'System administrator view';
      case 'TeamLead':
        return 'Team lead view';
      case 'SupportAgent':
        return 'Support specialist view';
      case 'Director':
        return 'Executive director view';
      default:
        return 'Workspace view';
    }
  };

  return (
    <header className="app-header">
      <div className="header-breadcrumbs">
        <span className="role-view-badge">{getRolePrefix()}</span>
        <h2 className="current-view-title">{currentViewLabel}</h2>
      </div>

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
                  <Button variant="primary" size="sm" onClick={onReviewEscalations}>
                    Review escalations
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};

