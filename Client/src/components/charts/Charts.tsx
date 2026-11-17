import React, { useId, useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothPath = (points: Point[]): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
};

/* --------------------------------------------------------------------------
   Sparkline — compact trend inside KPI tiles
   -------------------------------------------------------------------------- */
export interface SparklineProps {
  values: number[];
  color?: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  color = 'var(--pl-accent)',
  className = '',
}) => {
  const gradientId = `spark-${useId().replace(/:/g, '')}`;
  const width = 100;
  const height = 30;
  const padding = 3;

  const points = useMemo(() => {
    const data = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * (width - padding * 2),
      y: height - padding - ((value - min) / range) * (height - padding * 2),
    }));
  }, [values]);

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      className={`pl-chart ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r="2.2" fill={color} />
    </svg>
  );
};

/* --------------------------------------------------------------------------
   TrendChart — time-series line/area chart
   -------------------------------------------------------------------------- */
export interface TrendSeries {
  label: string;
  color: string;
  values: number[];
  fill?: boolean;
  dashed?: boolean;
}

export interface TrendChartProps {
  series: TrendSeries[];
  labels?: string[];
  height?: number;
  yMin?: number;
  yMax?: number;
  valueSuffix?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  series,
  labels = [],
  height = 190,
  yMin,
  yMax,
  valueSuffix = '',
}) => {
  const gradientId = `trend-${useId().replace(/:/g, '')}`;
  const width = 640;
  const paddingTop = 12;
  const paddingBottom = 10;
  const usableHeight = height - paddingTop - paddingBottom;

  const cleanSeries = series.filter((s) => s.values.length > 0);
  const allValues = cleanSeries.flatMap((s) => s.values);

  const computedMin = allValues.length > 0 ? yMin ?? Math.min(...allValues) : 0;
  const computedMax = allValues.length > 0 ? yMax ?? Math.max(...allValues) : 1;
  const min = computedMin;
  const max = computedMax === computedMin ? computedMin + 1 : computedMax;

  if (cleanSeries.length === 0) {
    return <div className="pl-empty">No trend data available yet.</div>;
  }

  const project = (value: number, count: number, index: number): Point => {
    const x = count <= 1 ? width / 2 : (index / (count - 1)) * width;
    const ratio = clamp((value - min) / (max - min), 0, 1);
    return { x, y: paddingTop + (1 - ratio) * usableHeight };
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg
        className="pl-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ height }}
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          {cleanSeries.map((item, index) => (
            <linearGradient key={item.label} id={`${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridLines.map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={paddingTop + line * usableHeight}
            y2={paddingTop + line * usableHeight}
            stroke="var(--border-light)"
            strokeWidth="1"
            strokeDasharray={line === 1 ? '0' : '3 4'}
          />
        ))}

        {cleanSeries.map((item, index) => {
          const points = item.values.map((value, pointIndex) =>
            project(value, item.values.length, pointIndex)
          );
          const line = smoothPath(points);
          const last = points[points.length - 1];
          const area = item.fill
            ? `${line} L ${last.x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
            : '';

          return (
            <g key={item.label}>
              {item.fill && <path d={area} fill={`url(#${gradientId}-${index})`} />}
              <path
                d={line}
                fill="none"
                stroke={item.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={item.dashed ? '5 5' : undefined}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={last.x} cy={last.y} r="3.4" fill={item.color} />
            </g>
          );
        })}
      </svg>

      {labels.length > 0 && (
        <div className="pl-axis-labels">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
      )}

      {cleanSeries.length > 1 && (
        <div className="pl-legend" style={{ marginTop: 8 }}>
          {cleanSeries.map((item) => (
            <span key={item.label} className="pl-legend-item">
              <span className="pl-legend-dot" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
          {valueSuffix && <span style={{ marginLeft: 'auto' }}>{valueSuffix}</span>}
        </div>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------------
   GaugeChart — single progress / health metric
   -------------------------------------------------------------------------- */
export interface GaugeChartProps {
  value: number;
  max?: number;
  color?: string;
  colorEnd?: string;
  label?: string;
  caption?: string;
  scale?: boolean;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max = 100,
  color = 'var(--pl-accent)',
  colorEnd,
  label = 'Completion',
  caption,
  scale = true,
}) => {
  const gradientId = `gauge-${useId().replace(/:/g, '')}`;
  const percent = clamp((value / (max || 1)) * 100, 0, 100);
  const radius = 80;
  const arcLength = Math.PI * radius;

  return (
    <div className="pl-gauge-wrap">
      <div className="pl-gauge">
        <svg viewBox="0 0 200 112" role="img" aria-label={`${label}: ${Math.round(percent)}%`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={colorEnd ?? color} />
            </linearGradient>
          </defs>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--border-light)"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${(percent / 100) * arcLength} ${arcLength}`}
            className="pl-gauge-arc"
          />
        </svg>
        <div className="pl-gauge-value">
          <strong>{Math.round(percent)}%</strong>
          <span>{label}</span>
        </div>
      </div>
      {scale && (
        <div className="pl-gauge-scale">
          <span>0%</span>
          <span>{caption ?? 'Target 90%'}</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------------
   DonutChart — composition of a whole (max 5 slices)
   -------------------------------------------------------------------------- */
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  centerValue?: React.ReactNode;
  centerLabel?: string;
  thickness?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  centerValue,
  centerLabel,
  thickness = 13,
}) => {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="pl-donut-wrap">
      <div className="pl-donut">
        <svg viewBox="0 0 100 100" role="img" aria-label="Distribution chart">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--border-light)"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((segment) => {
              const fraction = Math.max(0, segment.value) / total;
              const dash = fraction * circumference;
              const node = (
                <circle
                  key={segment.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(0, dash - 1.5)} ${circumference}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 50 50)"
                />
              );
              offset += dash;
              return node;
            })}
        </svg>
        <div className="pl-donut-center">
          <strong>{centerValue ?? total}</strong>
          <span>{centerLabel ?? 'Total'}</span>
        </div>
      </div>

      <div className="pl-donut-legend">
        {segments.map((segment) => {
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <div key={segment.label} className="pl-legend-row">
              <span className="pl-legend-row-label">
                <span className="pl-legend-dot" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span>
              </span>
              <span className="pl-legend-row-value">
                {segment.value} · {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   BarChart — values across ordered categories (e.g. days)
   -------------------------------------------------------------------------- */
export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  highlight?: boolean;
}

export interface BarChartProps {
  data: BarDatum[];
  max?: number;
  suffix?: string;
  formatValue?: (value: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  max,
  suffix = '',
  formatValue,
}) => {
  const maxValue = max ?? Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="pl-bars">
      {data.map((item) => {
        const height = maxValue > 0 ? clamp((item.value / maxValue) * 100, 0, 100) : 0;
        return (
          <div
            key={`${item.label}-${item.value}`}
            className={`pl-bar-col${item.highlight ? ' is-today' : ''}`}
          >
            <span className="pl-bar-value">
              {formatValue ? formatValue(item.value) : `${item.value}${suffix}`}
            </span>
            <div className="pl-bar-track">
              <div
                className="pl-bar-fill"
                style={{
                  height: `${Math.max(item.value > 0 ? 3 : 0, height)}%`,
                  backgroundColor: item.color ?? 'var(--pl-accent)',
                }}
                title={`${item.label}: ${item.value}${suffix}`}
              />
            </div>
            <span className="pl-bar-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* --------------------------------------------------------------------------
   HBarList — ranking / comparison across labelled rows
   -------------------------------------------------------------------------- */
export interface HBarItem {
  id: string;
  label: string;
  sub?: string;
  value: number;
  valueLabel?: string;
  color?: string;
}

export interface HBarListProps {
  items: HBarItem[];
  max?: number;
  emptyText?: string;
}

export const HBarList: React.FC<HBarListProps> = ({
  items,
  max,
  emptyText = 'No records to display.',
}) => {
  if (items.length === 0) {
    return <div className="pl-empty">{emptyText}</div>;
  }

  const maxValue = max ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="pl-hbars">
      {items.map((item, index) => {
        const width = maxValue > 0 ? clamp((item.value / maxValue) * 100, 0, 100) : 0;
        return (
          <div key={item.id} className="pl-hbar">
            <span className="pl-hbar-rank">{index + 1}</span>
            <div className="pl-hbar-main">
              <div className="pl-hbar-label">
                <span>{item.label}</span>
                {item.sub && <span className="pl-hbar-sub">{item.sub}</span>}
              </div>
              <div className="pl-hbar-track">
                <div
                  className="pl-hbar-fill"
                  style={{
                    width: `${width}%`,
                    backgroundColor: item.color ?? 'var(--pl-accent)',
                  }}
                />
              </div>
            </div>
            <span className="pl-hbar-value">{item.valueLabel ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
};
