import React from 'react';

export interface AlertProps {
  variant?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  details?: string[];
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'error',
  title,
  message,
  details,
  onClose,
  action,
  className = '',
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'error':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'success':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div className={`app-alert alert-${variant} ${className}`} role="alert">
      <div className="alert-icon-box">{getIcon()}</div>
      <div className="alert-body">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{message}</div>
        {details && details.length > 0 && (
          <ul className="alert-details-list">
            {details.map((detail, idx) => (
              <li key={idx} className="alert-detail-item">
                {detail}
              </li>
            ))}
          </ul>
        )}
        {action && <div className="alert-action-row">{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          aria-label="Close notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

