import React from 'react';
import { InboxIcon } from '../icons/Icons';

export interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`empty-state-card ${compact ? 'compact' : ''} ${className}`}>
      <div className="empty-state-icon-wrapper">
        {icon || <InboxIcon size={28} className="empty-state-icon-default" />}
      </div>
      <h4 className="empty-state-title">{title}</h4>
      {description && <div className="empty-state-description">{description}</div>}
      {(action || secondaryAction) && (
        <div className="empty-state-actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
