import React, { useMemo } from 'react';
import { Badge } from './Badge';
import { StarIcon } from '../icons/Icons';
import type { Feedback, FeedbackAnalytics } from '../../types';

export interface FeedbackStatusGraphProps {
  feedbacks: Feedback[];
  analytics?: FeedbackAnalytics | null;
  className?: string;
  onViewDetailedTable?: () => void;
}

export const FeedbackStatusGraph: React.FC<FeedbackStatusGraphProps> = ({
  feedbacks = [],
  analytics,
  className = '',
  onViewDetailedTable,
}) => {
  // Aggregate feedback statuses
  const statusCounts = useMemo(() => {
    let resolved = 0;
    let inProgress = 0;
    let open = 0;
    let closed = 0;

    const fbList = feedbacks || [];
    fbList.forEach((f) => {
      const s = (f?.status || '').toLowerCase();
      if (s === 'resolved') resolved++;
      else if (s === 'inprogress' || s === 'in_progress') inProgress++;
      else if (s === 'open') open++;
      else if (s === 'closed') closed++;
      else resolved++; // default fallback
    });

    const total = fbList.length || 1;
    return {
      total: fbList.length,
      resolved,
      inProgress,
      open,
      closed,
      resolvedRate: Math.round((resolved / total) * 100),
      inProgressRate: Math.round((inProgress / total) * 100),
      openRate: Math.round((open / total) * 100),
      closedRate: Math.round((closed / total) * 100),
    };
  }, [feedbacks]);

  // Aggregate CSAT Star Ratings
  const ratings = useMemo(() => {
    const fbList = feedbacks || [];
    const star5 = analytics?.ratingDistribution?.['5'] || fbList.filter((f) => f?.rating === 5).length;
    const star4 = analytics?.ratingDistribution?.['4'] || fbList.filter((f) => f?.rating === 4).length;
    const star3 = analytics?.ratingDistribution?.['3'] || fbList.filter((f) => f?.rating === 3).length;
    const star1_2 =
      (analytics?.ratingDistribution?.['1'] || 0) +
      (analytics?.ratingDistribution?.['2'] || 0) ||
      fbList.filter((f) => f && f.rating <= 2).length;

    const totalCount = star5 + star4 + star3 + star1_2 || 1;
    const avgScore = analytics?.averageRating
      ? analytics.averageRating.toFixed(1)
      : fbList.length > 0
      ? (fbList.reduce((acc, f) => acc + (f?.rating || 0), 0) / fbList.length).toFixed(1)
      : '—';

    const positiveRate =
      analytics?.positivePercentage || (fbList.length > 0 ? Math.round(((star5 + star4) / totalCount) * 100) : 0);

    return {
      star5,
      star4,
      star3,
      star1_2,
      totalCount: feedbacks.length || totalCount,
      avgScore,
      positiveRate,
      p5: Math.round((star5 / totalCount) * 100),
      p4: Math.round((star4 / totalCount) * 100),
      p3: Math.round((star3 / totalCount) * 100),
      p1_2: Math.round((star1_2 / totalCount) * 100),
    };
  }, [feedbacks, analytics]);

  // Donut SVG circumference calculations
  const donutRadius = 54;
  const circumference = 2 * Math.PI * donutRadius; // ~339.29
  const totalSafe = statusCounts.total || 1;

  const strokeResolved = (statusCounts.resolved / totalSafe) * circumference;
  const strokeInProgress = (statusCounts.inProgress / totalSafe) * circumference;
  const strokeOpen = (statusCounts.open / totalSafe) * circumference;
  const strokeClosed = (statusCounts.closed / totalSafe) * circumference;

  const offsetResolved = 0;
  const offsetInProgress = -strokeResolved;
  const offsetOpen = -(strokeResolved + strokeInProgress);
  const offsetClosed = -(strokeResolved + strokeInProgress + strokeOpen);

  return (
    <div className={`dashboard-card ${className}`}>
      {/* Header */}
      <div className="card-header-with-action flex-wrap gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="card-title">Customer Feedback Status & CSAT Quality Spectrum</h3>
            <Badge variant="accent" size="sm">
              <StarIcon size={12} /> {ratings.avgScore} ★ CSAT Rating
            </Badge>
          </div>
          <p className="card-subtitle">
            Resolution statuses of customer inquiries, star satisfaction spectrum, and sentiment benchmark
          </p>
        </div>

        {onViewDetailedTable && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onViewDetailedTable}
          >
            Audit Feedback Records &rarr;
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
        {/* Left 5 Cols: Creative Donut Gauge of Resolution Statuses */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-surface border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark uppercase tracking-wider">Inquiry Resolution Status</span>
            <span className="text-xs font-semibold text-muted">{statusCounts.total} Evaluations</span>
          </div>

          <div className="flex items-center justify-center my-3">
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg viewBox="0 0 140 140" width="140" height="140">
                <g transform="rotate(-90 70 70)">
                  {/* Background Track */}
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="transparent"
                    stroke="var(--border-light, #e2e8f0)"
                    strokeWidth="12"
                  />

                  {/* 1. Resolved (Emerald) */}
                  {strokeResolved > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="12"
                      strokeDasharray={`${strokeResolved} ${circumference}`}
                      strokeDashoffset={offsetResolved}
                      strokeLinecap="round"
                    />
                  )}

                  {/* 2. In Progress (Cyan) */}
                  {strokeInProgress > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#06B6D4"
                      strokeWidth="12"
                      strokeDasharray={`${strokeInProgress} ${circumference}`}
                      strokeDashoffset={offsetInProgress}
                      strokeLinecap="round"
                    />
                  )}

                  {/* 3. Open (Amber) */}
                  {strokeOpen > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      strokeDasharray={`${strokeOpen} ${circumference}`}
                      strokeDashoffset={offsetOpen}
                      strokeLinecap="round"
                    />
                  )}

                  {/* 4. Closed (Slate) */}
                  {strokeClosed > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#64748B"
                      strokeWidth="12"
                      strokeDasharray={`${strokeClosed} ${circumference}`}
                      strokeDashoffset={offsetClosed}
                      strokeLinecap="round"
                    />
                  )}
                </g>
              </svg>

              {/* Center Metrics */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
                  {statusCounts.resolvedRate}%
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                  Resolved
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-light">
            <div className="flex items-center justify-between p-1.5 rounded bg-card border">
              <div className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span className="text-muted font-medium">Resolved</span>
              </div>
              <span className="font-bold text-dark">{statusCounts.resolved}</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-card border">
              <div className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#06B6D4' }} />
                <span className="text-muted font-medium">In Progress</span>
              </div>
              <span className="font-bold text-dark">{statusCounts.inProgress}</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-card border">
              <div className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <span className="text-muted font-medium">Open</span>
              </div>
              <span className="font-bold text-dark">{statusCounts.open}</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-card border">
              <div className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#64748B' }} />
                <span className="text-muted font-medium">Closed</span>
              </div>
              <span className="font-bold text-dark">{statusCounts.closed}</span>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: CSAT Star Distribution & Quality Benchmark */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-surface border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-dark uppercase tracking-wider block">
                  Customer Satisfaction (CSAT) Spectrum
                </span>
                <span className="text-xs text-muted">Client star ratings distribution across all interactions</span>
              </div>
              <div className="flex items-center gap-1 text-warning font-bold text-sm bg-card px-2.5 py-1 rounded-md border">
                <span>{ratings.avgScore}</span>
                <StarIcon size={13} />
              </div>
            </div>

            {/* Creative Horizontal Rating Progress Bars */}
            <div className="space-y-2.5">
              {/* 5 Stars */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-dark flex items-center gap-1">
                    <span className="text-warning">★★★★★</span>
                    <span>5 Stars (Exceptional)</span>
                  </span>
                  <span className="font-semibold text-muted">
                    {ratings.star5} ({ratings.p5}%)
                  </span>
                </div>
                <div className="w-full bg-card h-2.5 rounded-full overflow-hidden border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${ratings.p5}%`,
                      background: 'linear-gradient(90deg, #10B981, #059669)',
                    }}
                  />
                </div>
              </div>

              {/* 4 Stars */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-dark flex items-center gap-1">
                    <span className="text-warning">★★★★</span>
                    <span className="text-muted">☆</span>
                    <span>4 Stars (Good)</span>
                  </span>
                  <span className="font-semibold text-muted">
                    {ratings.star4} ({ratings.p4}%)
                  </span>
                </div>
                <div className="w-full bg-card h-2.5 rounded-full overflow-hidden border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${ratings.p4}%`,
                      background: 'linear-gradient(90deg, #06B6D4, #0891B2)',
                    }}
                  />
                </div>
              </div>

              {/* 3 Stars */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-dark flex items-center gap-1">
                    <span className="text-warning">★★★</span>
                    <span className="text-muted">☆☆</span>
                    <span>3 Stars (Average)</span>
                  </span>
                  <span className="font-semibold text-muted">
                    {ratings.star3} ({ratings.p3}%)
                  </span>
                </div>
                <div className="w-full bg-card h-2.5 rounded-full overflow-hidden border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${ratings.p3}%`,
                      background: 'linear-gradient(90deg, #F59E0B, #D97706)',
                    }}
                  />
                </div>
              </div>

              {/* 1-2 Stars */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-dark flex items-center gap-1">
                    <span className="text-danger">★</span>
                    <span className="text-muted">☆☆☆☆</span>
                    <span>1-2 Stars (Critical Review)</span>
                  </span>
                  <span className="font-semibold text-muted">
                    {ratings.star1_2} ({ratings.p1_2}%)
                  </span>
                </div>
                <div className="w-full bg-card h-2.5 rounded-full overflow-hidden border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${ratings.p1_2}%`,
                      background: 'linear-gradient(90deg, #EF4444, #DC2626)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quality Sentiment Callout */}
          <div className="mt-3 p-2.5 rounded-lg bg-card border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span className="text-muted font-medium">Customer Sentiment Index</span>
            </div>
            <span className="font-bold text-success">{ratings.positiveRate}% Positive Sentiment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

