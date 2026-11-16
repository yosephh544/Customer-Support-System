import React, { useMemo } from 'react';
import { Badge } from './Badge';
import { BuildingIcon, ProjectIcon, ModuleIcon, CheckIcon } from '../icons/Icons';
import type { Organization, Project } from '../../types';

export interface OrganizationStatusGraphProps {
  organizations: Organization[];
  projects?: Project[];
  className?: string;
  onViewAll?: () => void;
}

export const OrganizationStatusGraph: React.FC<OrganizationStatusGraphProps> = ({
  organizations = [],
  projects = [],
  className = '',
  onViewAll,
}) => {
  // Compute organization status statistics
  const stats = useMemo(() => {
    const orgList = organizations || [];
    const projList = projects || [];
    const total = orgList.length;
    const active = orgList.filter((o) => o && o.isActive !== false).length;
    const inactive = total - active;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 100;

    // Total projects and modules
    const totalProjects = projList.length || orgList.reduce((acc, o) => acc + (o?.projectCount || 0), 0);
    const totalModules = projList.reduce((acc, p) => acc + (p?.moduleCount || 0), 0);

    // Project breakdown by status
    let activeProjects = 0;
    let maintenanceProjects = 0;
    let completedProjects = 0;

    projList.forEach((p) => {
      if (!p) return;
      const s = String(p.status || p.statusName || '').toLowerCase();
      if (s.includes('active') || s === '1') activeProjects++;
      else if (s.includes('maint') || s === '2') maintenanceProjects++;
      else completedProjects++;
    });

    if (totalProjects > 0 && activeProjects === 0 && maintenanceProjects === 0 && completedProjects === 0) {
      activeProjects = totalProjects;
    }

    // Top organizations by project count
    const sortedOrgs = [...orgList]
      .filter(Boolean)
      .sort((a, b) => (b.projectCount || 0) - (a.projectCount || 0))
      .slice(0, 5);

    const maxProjects = Math.max(...sortedOrgs.map((o) => o.projectCount || 1), 5);

    return {
      total,
      active,
      inactive,
      activeRate,
      totalProjects,
      totalModules,
      activeProjects,
      maintenanceProjects,
      completedProjects,
      sortedOrgs,
      maxProjects,
    };
  }, [organizations, projects]);

  // Donut SVG circumference calculations
  const donutRadius = 52;
  const circumference = 2 * Math.PI * donutRadius; // ~326.7
  const activeStroke = (stats.activeRate / 100) * circumference;
  const inactiveStroke = circumference - activeStroke;

  return (
    <div className={`dashboard-card organization-status-graph-card ${className}`}>
      {/* Header */}
      <div className="card-header-with-action flex-wrap gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="card-title">Client Organization & Enterprise Statuses</h3>
            <Badge variant="navy" size="sm">
              <BuildingIcon size={12} /> {stats.total} Organizations
            </Badge>
          </div>
          <p className="card-subtitle">
            Enterprise contract activity, tenant lifecycle health, and project portfolio distribution
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
          >
            Manage Organizations →
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Column: Radial Contract Status Ring */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
              <defs>
                <linearGradient id="orgActiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="orgInactiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {/* Background Track */}
              <circle
                cx="65"
                cy="65"
                r={donutRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="11"
                className="text-slate-200 dark:text-slate-700/60"
              />

              {/* Inactive segment */}
              <circle
                cx="65"
                cy="65"
                r={donutRadius}
                fill="transparent"
                stroke="url(#orgInactiveGradient)"
                strokeWidth="11"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={-activeStroke}
                strokeLinecap="round"
                className="transition-all duration-700"
              />

              {/* Active segment */}
              <circle
                cx="65"
                cy="65"
                r={donutRadius}
                fill="transparent"
                stroke="url(#orgActiveGradient)"
                strokeWidth="11"
                strokeDasharray={`${activeStroke} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {stats.activeRate}%
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Rate
              </span>
            </div>
          </div>

          {/* Quick Metrics Legend below Donut */}
          <div className="grid grid-cols-2 gap-3 w-full mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 text-center">
            <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Contracts
              </div>
              <div className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
                {stats.active}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Inactive / Pending
              </div>
              <div className="text-lg font-extrabold text-slate-700 dark:text-slate-300">
                {stats.inactive}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Portfolio Density & Top Orgs Ranking */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
          {/* Portfolio Summary Pills */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                <ProjectIcon size={12} />
                <span>Active Projects</span>
              </div>
              <div className="text-base font-bold text-blue-900 dark:text-blue-200 mt-1">
                {stats.activeProjects} / {stats.totalProjects}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                <ModuleIcon size={12} />
                <span>Total Modules</span>
              </div>
              <div className="text-base font-bold text-indigo-900 dark:text-indigo-200 mt-1">
                {stats.totalModules}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/40">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                <CheckIcon size={12} />
                <span>Avg Proj/Org</span>
              </div>
              <div className="text-base font-bold text-teal-900 dark:text-teal-200 mt-1">
                {stats.total > 0 ? (stats.totalProjects / stats.total).toFixed(1) : '0.0'}
              </div>
            </div>
          </div>

          {/* Top Organizations Project Density Bars */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Top Client Portfolios</span>
              <span className="text-[11px] text-slate-500 font-normal">By project deployment</span>
            </div>

            <div className="space-y-2">
              {stats.sortedOrgs.length > 0 ? (
                stats.sortedOrgs.map((org) => {
                  const pCount = org.projectCount || 0;
                  const percent = Math.min(100, Math.round((pCount / stats.maxProjects) * 100));

                  return (
                    <div key={org.id} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {org.name}
                          </span>
                          {org.isActive === false ? (
                            <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              Inactive
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                          {pCount} {pCount === 1 ? 'project' : 'projects'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 italic">
                  No organization records currently registered
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

