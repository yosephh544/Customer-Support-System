import React from 'react';
import { Sparkline } from '../charts/Charts';
import type { PillTone } from './dashboardUtils';

export type DeltaTone = 'good' | 'bad' | 'warn' | 'flat';

export interface KpiDelta {
  text: string;
  tone: DeltaTone;
}

export interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  delta?: KpiDelta;
  sub?: string;
  spark?: number[];
  sparkColor?: string;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  unit,
  icon,
  delta,
  sub,
  spark,
  sparkColor = 'var(--pl-accent)',
}) => {
  return (
    <div className="pl-kpi">
      <div className="pl-kpi-top">
        <span className="pl-kpi-label">{label}</span>
        {icon && <span className="pl-kpi-icon">{icon}</span>}
      </div>
      <div className="pl-kpi-value">
        {value}
        {unit && <span className="pl-kpi-unit">{unit}</span>}
      </div>
      <div className="pl-kpi-foot">
        <div className="pl-kpi-copy">
          {delta && (
            <span className={`pl-delta pl-delta-${delta.tone}`}>{delta.text}</span>
          )}
          {sub && <div className="pl-kpi-sub">{sub}</div>}
        </div>
        {spark && spark.length > 0 && (
          <Sparkline values={spark} color={sparkColor} className="pl-kpi-spark" />
        )}
      </div>
    </div>
  );
};

export interface PanelProps {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
  className?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  meta,
  span = 6,
  className = '',
  children,
}) => {
  return (
    <section className={`pl-panel pl-span-${span} ${className}`}>
      <div className="pl-panel-head">
        <div>
          <h3 className="pl-panel-title">{title}</h3>
          {subtitle && <p className="pl-panel-sub">{subtitle}</p>}
        </div>
        {meta && <div className="pl-panel-meta">{meta}</div>}
      </div>
      <div className="pl-panel-body">{children}</div>
    </section>
  );
};

export const StatusPill: React.FC<{ tone: PillTone; children: React.ReactNode }> = ({
  tone,
  children,
}) => <span className={`pl-pill pl-pill-${tone}`}>{children}</span>;
