import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subtext?: string;
  subtextColor?: 'muted' | 'danger' | 'success' | 'warning' | 'primary' | 'accent' | 'neutral';
  progress?: number; // 0 - 100
  trend?: string;    // e.g. "+1.74%"
  trendDirection?: 'up' | 'down' | 'neutral';
  chartVariant?: 'amber' | 'teal' | 'navy' | 'none' | 'purple' | 'rose';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  subtext,
  subtextColor = 'muted',
  progress,
  trend,
  trendDirection = 'up',
  chartVariant = 'none',
  icon,
  className = '',
  onClick,
}) => {
  // SVG sparkline curves inspired by the user's uploaded dashboard reference
  const renderSparkline = () => {
    if (chartVariant === 'none') return null;

    const isAmber = chartVariant === 'amber';
    const strokeColor = isAmber ? '#F59E0B' : '#7D82B8';
    const fillColor = isAmber ? 'url(#amberGradient)' : 'url(#indigoGradient)';

    return (
      <div className="stat-mini-chart" aria-hidden="true">
        <svg viewBox="0 0 160 38" preserveAspectRatio="none">
          <defs>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7D82B8" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#7D82B8" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          {isAmber ? (
            <path
              d="M0,28 C25,24 40,34 65,30 C90,26 110,12 135,16 C148,18 155,10 160,8 L160,38 L0,38 Z"
              fill={fillColor}
            />
          ) : (
            <path
              d="M0,25 C30,28 50,15 80,18 C110,22 130,10 160,12 L160,38 L0,38 Z"
              fill={fillColor}
            />
          )}

          {/* Line curve */}
          {isAmber ? (
            <path
              d="M0,28 C25,24 40,34 65,30 C90,26 110,12 135,16 C148,18 155,10 160,8"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M0,25 C30,28 50,15 80,18 C110,22 130,10 160,12"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Key data pulse point */}
          <circle cx="135" cy="16" r="3.5" fill="var(--bg-card)" stroke={strokeColor} strokeWidth="2" />
        </svg>
      </div>
    );
  };

  return (
    <div
      className={`stat-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {trend ? (
          <span
            className={`stat-trend-pill ${
              trendDirection === 'up'
                ? 'positive'
                : trendDirection === 'down'
                ? 'negative'
                : 'neutral'
            }`}
          >
            {trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '•'} {trend}
          </span>
        ) : icon ? (
          <span className="stat-icon text-muted">{icon}</span>
        ) : null}
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
        <span className={`stat-subtext text-${subtextColor}`}>
          {subtext}
        </span>
      )}

      {renderSparkline()}
    </div>
  );
};
