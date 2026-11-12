import React from 'react';
import { InboxIcon, SearchXIcon } from '../icons/Icons';

export interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  searchTerm?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  searchTerm,
  action,
  secondaryAction,
  className = '',
  compact = false,
}) => {
  const defaultIcon = searchTerm ? (
    <SearchXIcon size={compact ? 22 : 30} className="empty-state-icon-default" />
  ) : (
    <InboxIcon size={compact ? 22 : 30} className="empty-state-icon-default" />
  );

  return (
    <div className={`empty-state-card ${compact ? 'compact' : ''} ${className}`}>
      <div className={`empty-state-icon-wrapper ${searchTerm ? 'search-variant' : ''}`}>
        {icon || defaultIcon}
      </div>

      <h4 className="empty-state-title">
        {searchTerm ? (
          <>
            No results matching <span className="empty-search-highlight">"{searchTerm}"</span>
          </>
        ) : (
          title
        )}
      </h4>

      {description && (
        <div className="empty-state-description">
          {description}
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="empty-state-actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
