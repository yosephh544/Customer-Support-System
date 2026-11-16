import React, { useMemo } from 'react';
import type { ScheduleItem, SupportAssignment } from '../../types';
import {
  isCompletedTouchpoint,
  isPendingTouchpoint,
  isSkippedTouchpoint,
} from '../../types';
import { StarIcon } from '../icons/Icons';

export interface AgentBentoDashboardProps {
  items?: ScheduleItem[];
  assignments?: SupportAssignment[];
  avgRating?: number;
  onStartNextCall?: () => void;
  onNavigateToTouchpoints?: () => void;
}

export const AgentBentoDashboard: React.FC<AgentBentoDashboardProps> = ({
  items = [],
  assignments = [],
  avgRating = 5.0,
  onStartNextCall,
  onNavigateToTouchpoints,
}) => {
  // Aggregate agent today & weekly metrics
  const stats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let skipped = 0;

    items.forEach((item) => {
      if (isCompletedTouchpoint(item.status)) {
        completed++;
      } else if (isSkippedTouchpoint(item.status)) {
        skipped++;
      } else {
        pending++;
      }
    });

    const total = items.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      skipped,
      rate,
    };
  }, [items]);

  // Find next pending call
  const nextCall = useMemo(() => {
    return items.find((i) => isPendingTouchpoint(i.status));
  }, [items]);

  // Semantic status token based on percentage
  const getRateToken = (rate: number) => {
    if (rate >= 90) return { color: '#10B981', name: 'emerald', label: 'Optimal (≥90%)' };
    if (rate >= 70) return { color: '#F59E0B', name: 'amber', label: 'On Track (70–89%)' };
    return { color: '#EF4444', name: 'crimson', label: 'Attention (<70%)' };
  };

  const agentToken = getRateToken(stats.rate);

  // Hero Radial Gauge Calculations (Radius 52, circumference ~326.7)
  const heroR = 52;
  const heroCirc = 2 * Math.PI * heroR;
  const heroStroke = (stats.rate / 100) * heroCirc;

  // 7-Day Vertical Pill Chart (Mon–Sun daily completion %)
  const weeklyStreak = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayJs = new Date().getDay();
    const todayIndex = (todayJs + 6) % 7; // 0=Mon, ..., 6=Sun

    const counts = days.map((day, idx) => ({
      day,
      completed: 0,
      planned: 0,
      isToday: idx === todayIndex,
    }));

    items.forEach((item) => {
      if (item.scheduledDate) {
        const d = new Date(item.scheduledDate);
        const jsDay = d.getDay();
        const mapIdx = (jsDay + 6) % 7;
        counts[mapIdx].planned++;
        if (isCompletedTouchpoint(item.status)) {
          counts[mapIdx].completed++;
        }
      }
    });

    // If items had no dates, map today's totals to today
    if (counts.every((c) => c.planned === 0) && items.length > 0) {
      counts[todayIndex].planned = stats.total;
      counts[todayIndex].completed = stats.completed;
    }

    return counts.map((d) => {
      const rate = d.planned > 0 ? Math.round((d.completed / d.planned) * 100) : 0;
      let status = 'slate';
      if (d.planned > 0) {
        if (rate >= 90) status = 'emerald';
        else if (rate >= 70) status = 'amber';
        else status = 'crimson';
      }
      return {
        ...d,
        rate,
        status,
      };
    });
  }, [items, stats]);

  // Calculate active streak (consecutive days with completed calls)
  const activeStreak = useMemo(() => {
    let streak = 0;
    for (const day of weeklyStreak) {
      if (day.completed > 0) {
        streak++;
      }
    }
    return streak;
  }, [weeklyStreak]);

  // Personal CSAT points
  const csatWidth = 180;
  const csatHeight = 36;
  const csatHistory = useMemo(() => {
    const base = avgRating > 0 ? avgRating : 5.0;
    return [base - 0.2, base - 0.1, base, base - 0.1, base, base];
  }, [avgRating]);

  const csatPoints = useMemo(() => {
    const minVal = 4.0;
    const maxVal = 5.0;
    const step = csatWidth / (csatHistory.length - 1);
    return csatHistory.map((val, idx) => {
      const x = idx * step;
      const y = csatHeight - Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal))) * (csatHeight - 10) - 5;
      return { x, y, val };
    });
  }, [csatHistory]);

  const csatPath = useMemo(() => {
    if (csatPoints.length === 0) return '';
    return csatPoints.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = csatPoints[idx - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');
  }, [csatPoints]);

  // Latest customer note / feedback remark
  const latestRemark = useMemo(() => {
    return items.find((i) => i.notes && i.notes.trim().length > 0)?.notes;
  }, [items]);

  return (
    <div className="bento-container">
      <div className="bento-grid">
        {/* ========================================================
            CARD 1: Today's Contact Ring (Hero Circular Progress Card)
            ======================================================== */}
        <div className="bento-card bento-col-4">
          <div>
            <div className="bento-card-header">
              <div>
                <h3 className="bento-card-title">Today's Contact Focus</h3>
                <p className="bento-card-subtitle">Active shift touchpoint execution</p>
              </div>
              <span className={`bento-pill bento-pill-${agentToken.name}`}>
                <span className={`bento-dot bento-dot-${agentToken.name}`} />
                {stats.rate}% Target
              </span>
            </div>

            {/* Hero Radial Ring */}
            <div className="flex flex-col items-center justify-center my-3">
              <div className="bento-radial-wrapper" style={{ width: 140, height: 140 }}>
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 124 124">
                  <defs>
                    <linearGradient id="agentRadialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="62"
                    cy="62"
                    r={heroR}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="11"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="62"
                    cy="62"
                    r={heroR}
                    fill="none"
                    stroke="url(#agentRadialGrad)"
                    strokeWidth="11"
                    strokeDasharray={`${heroStroke} ${heroCirc}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="bento-radial-inner">
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="bento-hero-metric text-emerald-600 dark:text-emerald-400">
                      {stats.completed}
                    </span>
                    <span className="text-sm font-bold text-slate-400 font-mono">
                      /{stats.total}
                    </span>
                  </div>
                  <span className="bento-metric-label">Calls Delivered</span>
                </div>
              </div>

              {/* Sub-counters */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.completed} Completed
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> {stats.pending} Calls Remaining Today
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA: Start Next Call */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={onStartNextCall || onNavigateToTouchpoints}
              className="bento-action-btn w-full"
            >
              <span>Start Next Scheduled Call</span>
              <span>&rarr;</span>
            </button>
            <span className="text-[11px] text-center text-slate-400 truncate px-2">
              {nextCall
                ? `Next: ${nextCall.organizationName || 'Client'} (${nextCall.projectName || 'Project'})`
                : 'All scheduled calls completed'}
            </span>
          </div>
        </div>

        {/* ========================================================
            CARD 2: Weekly Performance Streak (7-Day Vertical Pill Chart)
            ======================================================== */}
        <div className="bento-card bento-col-4">
          <div>
            <div className="bento-card-header">
              <div>
                <h3 className="bento-card-title">Weekly Performance Streak</h3>
                <p className="bento-card-subtitle">Daily completion momentum (Mon – Sun)</p>
              </div>
              <span className="bento-pill bento-pill-emerald">
                🔥 {activeStreak > 0 ? `${activeStreak}-Day Streak` : 'Active Shift'}
              </span>
            </div>

            {/* 7-Day Vertical Pill Chart */}
            <div className="py-2">
              <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
                {weeklyStreak.map((d) => {
                  const token = getRateToken(d.rate);
                  const isUpcoming = d.status === 'slate';
                  return (
                    <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      {/* Percent badge above bar */}
                      <span className={`text-[10px] font-mono font-bold ${isUpcoming ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {isUpcoming ? '—' : `${d.rate}%`}
                      </span>

                      {/* Rounded Vertical Pill */}
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-full transition-all duration-700 relative group"
                          style={{
                            height: isUpcoming ? '15%' : `${Math.max(18, d.rate)}%`,
                            backgroundColor: isUpcoming ? '#CBD5E1' : token.color,
                            opacity: isUpcoming ? 0.4 : 1,
                          }}
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-20 whitespace-nowrap">
                            {d.completed}/{d.planned} calls
                          </div>
                        </div>
                      </div>

                      {/* Day Label */}
                      <span className={`text-[11px] font-semibold ${d.isToday ? 'text-indigo-600 dark:text-indigo-400 font-extrabold underline' : 'text-slate-500'}`}>
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Weekly Target: <b>≥90% Consistency</b></span>
            <span className="text-emerald-600 font-semibold text-[11px]">On Track</span>
          </div>
        </div>

        {/* ========================================================
            CARD 3: My Feedback & Rating Snapshot (Mini Stat + Trend Line)
            ======================================================== */}
        <div className="bento-card bento-col-4">
          <div>
            <div className="bento-card-header">
              <div>
                <h3 className="bento-card-title">My Feedback & Quality</h3>
                <p className="bento-card-subtitle">Personal CSAT evaluations & ticket resolution</p>
              </div>
              <span className="bento-pill bento-pill-indigo">
                <StarIcon size={12} className="text-amber-500 fill-amber-500" />
                <span>Verified CSAT</span>
              </span>
            </div>

            {/* Top: Large CSAT Rating + Trend Sparkline */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 my-2">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-base font-bold text-amber-500">★</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                  Average Client CSAT
                </span>
              </div>

              {/* Sparkline */}
              <div className="w-24 h-9">
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${csatWidth} ${csatHeight}`}>
                  <path d={csatPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  {csatPoints.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={i === csatPoints.length - 1 ? 3.5 : 2}
                      fill={i === csatPoints.length - 1 ? '#10B981' : '#FFFFFF'}
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Two Compact Pill Counters: On Progress vs Resolved */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-center">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  In Flight / Progress
                </span>
                <span className="text-xl font-black text-amber-800 dark:text-amber-300 mt-0.5 block font-mono">
                  {stats.pending} Active
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-center">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Resolved Tickets
                </span>
                <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block font-mono">
                  {stats.completed} Done
                </span>
              </div>
            </div>

            {/* Latest Customer Remark Quote */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs italic text-slate-600 dark:text-slate-400 line-clamp-2">
              {latestRemark ? `"${latestRemark}"` : 'No recent customer feedback remarks recorded.'}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Customer Praise Rate: <b className="text-emerald-600">{stats.rate > 0 ? `${stats.rate}%` : '100%'}</b></span>
            {onNavigateToTouchpoints && (
              <button
                type="button"
                onClick={onNavigateToTouchpoints}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                My Queue &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
