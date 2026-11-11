import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subtext?: string;
  subtextColor?: 'muted' | 'danger' | 'success' | 'warning';
  progress?: number; // 0 - 100
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  subtext,
  subtextColor = 'muted',
  progress,
  icon,
  className = '',
}) => {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>

      <div className="stat-value-container">
        <span className="stat-value">{value}</span>
        {subValue && <span className="stat-subvalue">{subValue}</span>}
      </div>

      {progress !== undefined && (
        <div className="stat-progress-bar">
          <div
            className="stat-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {subtext && (
        <div className={`stat-subtext text-${subtextColor}`}>
          {subtext}
        </div>
      )}
    </div>
  );
};

