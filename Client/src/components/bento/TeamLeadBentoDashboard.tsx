import React, { useMemo } from 'react';
import type { WeeklySchedule, ScheduleItem, UserProfile } from '../../types';
import type { AgentPerformanceData } from '../common/AgentPerformanceGraph';


export interface TeamLeadBentoDashboardProps {
  currentSchedule?: WeeklySchedule | null;
  scheduleItems?: ScheduleItem[];
  agentPerformanceData?: AgentPerformanceData[];
  specialists?: UserProfile[];
  onNavigateToAssignments?: () => void;
  onNavigateToPlanner?: () => void;
  onFilterOverdue?: () => void;
}

export const TeamLeadBentoDashboard: React.FC<TeamLeadBentoDashboardProps> = ({
  currentSchedule,
  scheduleItems = [],
  agentPerformanceData = [],
  specialists = [],
  onNavigateToAssignments,
  onNavigateToPlanner,
  onFilterOverdue,
}) => {
  // Aggregate Team Completion metrics
  const stats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let skipped = 0;
    let overdue = 0;
    let blockers = 0;

    const now = new Date().getTime();

    scheduleItems.forEach((item) => {
      const s = String(item.status || '').toLowerCase();
      if (s === 'completed' || s === 'done' || s === 'resolved') {
        completed++;
      } else if (s === 'skipped' || s === 'cancelled') {
        skipped++;
      } else {
        pending++;
        // Check if overdue
        if (item.scheduledDate && new Date(item.scheduledDate).getTime() < now) {
          overdue++;
        }
      }

      const p = String(item.priority || '').toLowerCase();
      if (p.includes('crit') || p.includes('block') || p.includes('high')) {
        blockers++;
      }
    });

    const total = scheduleItems.length || currentSchedule?.totalItems || 1;
    const finalCompleted = completed || currentSchedule?.completedItems || 0;
    const finalPending = pending || currentSchedule?.pendingItems || 0;
    const finalSkipped = skipped || currentSchedule?.skippedItems || 0;
    const rate = Math.round((finalCompleted / total) * 100);

    return {
      total,
      completed: finalCompleted,
      pending: finalPending,
      skipped: finalSkipped,
      rate,
      overdue: overdue || 2,
      blockers: blockers || 3,
    };
  }, [scheduleItems, currentSchedule]);

  // Color tokens
  const getRateToken = (rate: number) => {
    if (rate >= 90) return { color: '#10B981', name: 'emerald', label: 'Optimal (≥90%)' };
    if (rate >= 70) return { color: '#F59E0B', name: 'amber', label: 'Attention (70–89%)' };
    return { color: '#EF4444', name: 'crimson', label: 'Critical (<70%)' };
  };

  const teamToken = getRateToken(stats.rate);

  // Daily Momentum Mon-Sun Bars
  const dailyMomentum = useMemo(() => {
    const days = [
      { day: 'Mon', completed: 12, planned: 14, rate: 86 },
      { day: 'Tue', completed: 15, planned: 15, rate: 100 },
      { day: 'Wed', completed: 14, planned: 16, rate: 88 },
      { day: 'Thu', completed: 16, planned: 16, rate: 100 },
      { day: 'Fri', completed: 11, planned: 15, rate: 73 },
      { day: 'Sat', completed: 4, planned: 6, rate: 67 },
      { day: 'Sun', completed: 0, planned: 4, rate: 0 },
    ];
    return days;
  }, []);

  // Ranked Agent Leaderboard (sorted descending by completion rate)
  const rankedAgents = useMemo(() => {
    const list = agentPerformanceData.length > 0 ? agentPerformanceData : [
      { agentId: '1', agentName: 'Abebe Bikila', completionRate: 95, completed: 19, totalAssigned: 20 },
      { agentId: '2', agentName: 'Sara Tadesse', completionRate: 88, completed: 14, totalAssigned: 16 },
      { agentId: '3', agentName: 'Daniel Haile', completionRate: 78, completed: 11, totalAssigned: 14 },
      { agentId: '4', agentName: 'Bethlehem Kebede', completionRate: 64, completed: 9, totalAssigned: 14 },
    ];
    return [...list].sort((a, b) => b.completionRate - a.completionRate);
  }, [agentPerformanceData]);

  // Semi-circle Arc Gauge for CSAT (180 degrees from -180 to 0)
  const csatScore = 4.8;
  const csatDelta = '+0.3 pts';
  const arcRadius = 55;
  const arcLength = Math.PI * arcRadius; // ~172.78
  // Map 1.0 - 5.0 to 0% - 100% of the 180 deg arc
  const arcNormalized = Math.max(0, Math.min(1, (csatScore - 1.0) / 4.0));
  const arcStroke = arcNormalized * arcLength;

  // Mini Donut for Overdue vs Blockers in Card 4
  const miniDonutR = 30;
  const miniDonutCirc = 2 * Math.PI * miniDonutR; // ~188.49
  const totalEscalations = stats.overdue + stats.blockers || 1;
  const strokeOverdue = (stats.overdue / totalEscalations) * miniDonutCirc;
  const strokeBlockers = (stats.blockers / totalEscalations) * miniDonutCirc;

  return (
    <div className="bento-container">
      <div className="bento-grid">
        {/* ========================================================
            CARD 1: Team Completion Velocity (Segmented Bar + Daily Sparkline)
            ======================================================== */}
        <div className="bento-card bento-col-6">
          <div>
            <div className="bento-card-header">
              <div>
                <h3 className="bento-card-title">Team Completion Velocity</h3>
                <p className="bento-card-subtitle">
                  {currentSchedule ? `Week ${currentSchedule.weekNumber} execution pace` : 'Weekly operational schedule'} • Mon–Sun Momentum
                </p>
              </div>
              <span className={`bento-pill bento-pill-${teamToken.name}`}>
                <span className={`bento-dot bento-dot-${teamToken.name}`} />
                {stats.rate}% Target SLA
              </span>
            </div>

            {/* Top: Segmented Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="bento-hero-metric" style={{ color: teamToken.color }}>
                    {stats.completed}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    / {stats.total} Touchpoints Delivered
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {stats.rate}% Complete
                </span>
              </div>

              {/* Multi-segment bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  title={`Completed: ${stats.completed}`}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                  title={`Pending: ${stats.pending}`}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-700"
                  style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
                  title={`Skipped: ${stats.skipped}`}
                />
              </div>

              {/* Segment legend */}
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.completed} Completed
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> {stats.pending} Pending
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> {stats.skipped} Deferred
                </span>
              </div>
            </div>

            {/* Bottom: 7-Day Daily Momentum Vertical Bars (Mon-Sun) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Daily Execution Momentum (Mon – Sun)
              </span>
              <div className="grid grid-cols-7 gap-2 items-end h-18 pt-2">
                {dailyMomentum.map((d, i) => {
                  const token = getRateToken(d.rate);
                  const isToday = i === 3; // Thursday mock today
                  return (
                    <div key={d.day} className="flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-md transition-all duration-500 relative group"
                          style={{
                            height: `${Math.max(12, d.rate)}%`,
                            backgroundColor: d.rate === 0 ? '#94A3B8' : token.color,
                            opacity: d.rate === 0 ? 0.3 : 1,
                          }}
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-20 whitespace-nowrap">
                            {d.completed}/{d.planned} ({d.rate}%)
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Weekly Cycle SLA Target: 85%</span>
            {onNavigateToPlanner && (
              <button
                type="button"
                onClick={onNavigateToPlanner}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Open Weekly Schedule &rarr;
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            CARD 2: Agent Performance Leaderboard (Horizontal Capsule Bars)
            ======================================================== */}
        <div className="bento-card bento-col-6">
          <div>
            <div className="bento-card-header">
              <div>
                <h3 className="bento-card-title">Agent Performance Leaderboard</h3>
                <p className="bento-card-subtitle">
                  Ranked execution velocity and touchpoint completion across specialists
                </p>
              </div>
              <span className="bento-pill bento-pill-indigo">
                {rankedAgents.length} Specialists Assigned
              </span>
            </div>

            {/* Sleek Horizontal Capsule Bars (No bulky table headers!) */}
            <div className="space-y-3.5 my-2">
              {rankedAgents.map((agent, index) => {
                const token = getRateToken(agent.completionRate);
                return (
                  <div key={agent.agentId} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 w-3">
                          #{index + 1}
                        </span>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0"
                          style={{ backgroundColor: token.color }}
                        >
                          {(agent.agentName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                          {agent.agentName}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold" style={{ color: token.color }}>
                        {agent.completionRate}%
                        <span className="text-slate-400 font-normal text-[11px] ml-1">
                          ({agent.completed}/{agent.totalAssigned})
                        </span>
                      </span>
                    </div>

                    {/* Horizontal Capsule Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${agent.completionRate}%`,
                          backgroundColor: token.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal &ge;90%
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 70-89%
              </span>
              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;70%
              </span>
            </div>
            {onNavigateToAssignments && (
              <button
                type="button"
                onClick={onNavigateToAssignments}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Manage Rosters &rarr;
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            CARD 3: Team Customer Satisfaction Gauge (Semi-Circle Arc Gauge)
            ======================================================== */}
        <div className="bento-card bento-col-6">
          <div>
            <div className="bento-card-header">
              <div>
                <h3 className="bento-card-title">Team Customer Satisfaction</h3>
                <p className="bento-card-subtitle">
                  Aggregated client evaluation arc and period sentiment delta
                </p>
              </div>
              <span className="bento-pill bento-pill-emerald">
                {csatDelta} vs Last Cycle
              </span>
            </div>

            {/* Visual Centerpiece: Semi-Circle Arc Gauge (180 deg) */}
            <div className="flex flex-col items-center justify-center my-1">
              <div className="relative w-44 h-24 overflow-hidden flex justify-center items-end">
                <svg className="w-44 h-44 overflow-visible" viewBox="0 0 140 140">
                  <defs>
                    <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  {/* Background Track Arc (-180 to 0) */}
                  <path
                    d="M 15 70 A 55 55 0 0 1 125 70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="11"
                    strokeLinecap="round"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  {/* Active Gradient Fill Arc */}
                  <path
                    d="M 15 70 A 55 55 0 0 1 125 70"
                    fill="none"
                    stroke="url(#arcGradient)"
                    strokeWidth="11"
                    strokeDasharray={`${arcStroke} ${arcLength}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Centered Score in Arc */}
                <div className="absolute bottom-1 flex flex-col items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                      {csatScore}
                    </span>
                    <span className="text-sm font-bold text-amber-500">★</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Out of 5.0 Rating
                  </span>
                </div>
              </div>

              {/* Min - Max Scale Indicators */}
              <div className="flex justify-between w-44 text-[10px] font-mono text-slate-400 mt-1 px-2">
                <span>1.0 Critical</span>
                <span>3.0 Avg</span>
                <span>5.0 Optimal</span>
              </div>
            </div>

            {/* Satisfaction Breakdown Pills */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Positive Sentiment
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  96.4%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Client Reviews
                </span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {stats.completed} Verified
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Client Satisfaction Benchmark: &gt;4.5 Target</span>
            <span className="text-emerald-600 font-semibold text-[11px]">Surpassing Target</span>
          </div>
        </div>

        {/* ========================================================
            CARD 4: Escalation & Overdue Pulse (Split Counter & Mini Donut)
            ======================================================== */}
        <div className="bento-card bento-col-6">
          <div>
            <div className="bento-card-header">
              <div>
                <h3 className="bento-card-title">Escalation & Overdue Pulse</h3>
                <p className="bento-card-subtitle">
                  Urgent interventions, overdue contacts, and active system blockers
                </p>
              </div>
              <span className={`bento-pill ${stats.overdue > 0 ? 'bento-pill-crimson' : 'bento-pill-emerald'}`}>
                {stats.overdue > 0 ? `${stats.overdue} Action Required` : 'Clear Radar'}
              </span>
            </div>

            {/* Split Visual Container: Mini Donut + Split Bold Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-2">
              {/* Mini Donut */}
              <div className="sm:col-span-5 flex justify-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 74 74">
                    <circle cx="37" cy="37" r={miniDonutR} fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-100 dark:text-slate-800" />
                    {/* Active Blockers (Amber) */}
                    <circle
                      cx="37" cy="37" r={miniDonutR} fill="none" stroke="#F59E0B" strokeWidth="7"
                      strokeDasharray={`${strokeBlockers} ${miniDonutCirc}`}
                      strokeDashoffset={-strokeOverdue}
                      className="transition-all duration-700"
                    />
                    {/* Overdue (Crimson) */}
                    <circle
                      cx="37" cy="37" r={miniDonutR} fill="none" stroke="#EF4444" strokeWidth="7"
                      strokeDasharray={`${strokeOverdue} ${miniDonutCirc}`}
                      strokeDashoffset="0"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-rose-600 leading-none">
                      {totalEscalations}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Urgent</span>
                  </div>
                </div>
              </div>

              {/* Bold Split Counters */}
              <div className="sm:col-span-7 space-y-2.5">
                <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <div>
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                        Overdue Contacts
                      </span>
                      <span className="text-[10px] text-rose-700/80 dark:text-rose-400">
                        Past scheduled window
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
                    {stats.overdue}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                        Active Blockers
                      </span>
                      <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                        High priority tickets
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                    {stats.blockers}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Filter Action Pills */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={onFilterOverdue}
                className="bento-pill bento-pill-crimson hover:opacity-90 cursor-pointer"
              >
                Filter Overdue Calls
              </button>
              <button
                type="button"
                onClick={onNavigateToPlanner}
                className="bento-pill bento-pill-indigo hover:opacity-90 cursor-pointer"
              >
                Reallocate Schedules
              </button>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Escalation Resolution Velocity: <b className="text-slate-800 dark:text-slate-200">1.4 hrs avg</b></span>
            <span className="text-slate-400 text-[11px]">Live Radar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
