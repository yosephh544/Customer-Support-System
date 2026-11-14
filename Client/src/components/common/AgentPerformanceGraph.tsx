import React, { useState } from 'react';
import { Badge } from './Badge';
import { CheckIcon, ClockIcon, AlertTriangleIcon, UsersIcon, StarIcon } from '../icons/Icons';

export interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  agentEmail?: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  skipped: number;
  completionRate: number; // 0 - 100
  avgRating?: number;
  assignedProjectsCount?: number;
}

export interface AgentPerformanceGraphProps {
  agents: AgentPerformanceData[];
  title?: string;
  subtitle?: string;
  className?: string;
  showProjectsCount?: boolean;
}

export const AgentPerformanceGraph: React.FC<AgentPerformanceGraphProps> = ({
  agents,
  title = 'Specialist Performance & Delivery Metrics',
  subtitle = 'Individual touchpoint execution, velocity completion rates, and workload capacity across support specialists',
  className = '',
  showProjectsCount = true,
}) => {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);

  // Fallback / mock visual display if no agents assigned yet
  const displayAgents = agents.length > 0 ? agents : [];

  // Find max total for bar chart normalization
  const maxTotal = Math.max(...displayAgents.map((a) => Math.max(a.totalAssigned, a.completed + a.pending + a.skipped)), 5);

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 30;
  const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

  return (
    <div className={`dashboard-card agent-performance-graph-card ${className}`}>
      {/* Header with Title and Metric Legend */}
      <div className="card-header-with-action flex-wrap gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="card-title">{title}</h3>
            <Badge variant="purple" size="sm">
              <UsersIcon size={12} /> {displayAgents.length} Specialists
            </Badge>
          </div>
          <p className="card-subtitle">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: '#10B981', display: 'inline-block' }} />
            <span className="text-muted">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: '#F59E0B', display: 'inline-block' }} />
            <span className="text-muted">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: '#EF4444', display: 'inline-block' }} />
            <span className="text-muted">Skipped</span>
          </div>
          <div className="flex items-center gap-1.5 border-l pl-3">
            <span style={{ width: 14, height: 2, borderTop: '2px dashed #0D9488', display: 'inline-block' }} />
            <span className="text-muted">85% Target SLA</span>
          </div>
        </div>
      </div>

      {displayAgents.length === 0 ? (
        <div className="p-8 text-center text-muted">
          <UsersIcon size={28} className="mx-auto mb-2 opacity-40" />
          <div className="text-sm font-semibold text-dark">No Specialist Activity Registered</div>
          <p className="text-xs text-muted mt-1">
            Specialist performance metrics and execution graphs will render as touchpoints are scheduled.
          </p>
        </div>
      ) : (
        <>
          {/* Visual SVG Grouped Bar & Target Benchmark Chart */}
          <div className="executive-chart-container mt-2 mb-4" style={{ height: chartHeight }}>
            <svg
              viewBox={`0 0 ${Math.max(displayAgents.length * 90, 500)} ${chartHeight}`}
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="completedBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="pendingBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="skippedBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity="0.75" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1="0"
                y1={chartPaddingTop}
                x2="100%"
                y2={chartPaddingTop}
                stroke="var(--border-light, #e2e8f0)"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1={chartPaddingTop + usableHeight * 0.5}
                x2="100%"
                y2={chartPaddingTop + usableHeight * 0.5}
                stroke="var(--border-light, #e2e8f0)"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1={chartHeight - chartPaddingBottom}
                x2="100%"
                y2={chartHeight - chartPaddingBottom}
                stroke="var(--border, #cbd5e1)"
                strokeWidth="1.5"
              />

              {/* 85% SLA Target Guideline */}
              <line
                x1="0"
                y1={chartHeight - chartPaddingBottom - usableHeight * 0.85}
                x2="100%"
                y2={chartHeight - chartPaddingBottom - usableHeight * 0.85}
                stroke="#0D9488"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />

              {/* Specialist Grouped Bars */}
              {displayAgents.map((agent, idx) => {
                const totalW = Math.max(displayAgents.length * 90, 500);
                const colWidth = totalW / displayAgents.length;
                const centerX = colWidth * idx + colWidth / 2;

                const completedH = Math.max((agent.completed / maxTotal) * usableHeight, agent.completed > 0 ? 4 : 0);
                const pendingH = Math.max((agent.pending / maxTotal) * usableHeight, agent.pending > 0 ? 4 : 0);
                const skippedH = Math.max((agent.skipped / maxTotal) * usableHeight, agent.skipped > 0 ? 4 : 0);

                const barWidth = 14;
                const spacing = 3;
                const groupStartX = centerX - (barWidth * 3 + spacing * 2) / 2;

                const isHovered = hoveredAgentId === agent.agentId;

                return (
                  <g
                    key={agent.agentId}
                    onMouseEnter={() => setHoveredAgentId(agent.agentId)}
                    onMouseLeave={() => setHoveredAgentId(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hover Column Highlight */}
                    {isHovered && (
                      <rect
                        x={centerX - colWidth * 0.45}
                        y={chartPaddingTop}
                        width={colWidth * 0.9}
                        height={usableHeight}
                        fill="var(--accent)"
                        fillOpacity="0.06"
                        rx="6"
                      />
                    )}

                    {/* Bar 1: Completed (Green) */}
                    <rect
                      x={groupStartX}
                      y={chartHeight - chartPaddingBottom - completedH}
                      width={barWidth}
                      height={completedH}
                      fill="url(#completedBarGrad)"
                      rx="3"
                    />

                    {/* Bar 2: Pending (Amber) */}
                    <rect
                      x={groupStartX + barWidth + spacing}
                      y={chartHeight - chartPaddingBottom - pendingH}
                      width={barWidth}
                      height={pendingH}
                      fill="url(#pendingBarGrad)"
                      rx="3"
                    />

                    {/* Bar 3: Skipped (Rose) */}
                    <rect
                      x={groupStartX + (barWidth + spacing) * 2}
                      y={chartHeight - chartPaddingBottom - skippedH}
                      width={barWidth}
                      height={skippedH}
                      fill="url(#skippedBarGrad)"
                      rx="3"
                    />

                    {/* Completion Rate Badge above group */}
                    <text
                      x={centerX}
                      y={chartHeight - chartPaddingBottom - Math.max(completedH, pendingH, skippedH) - 6}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill={agent.completionRate >= 80 ? '#10B981' : '#D97706'}
                    >
                      {agent.completionRate}%
                    </text>

                    {/* Agent Label on X Axis */}
                    <text
                      x={centerX}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isHovered ? 'bold' : '500'}
                      fill={isHovered ? 'var(--dark, #0f172a)' : 'var(--text-muted, #64748b)'}
                    >
                      {agent.agentName.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Individual Agent Performance Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayAgents.map((agent) => {
              const totalItems = agent.totalAssigned || agent.completed + agent.pending + agent.skipped;
              const completedPercent = totalItems > 0 ? (agent.completed / totalItems) * 100 : 0;
              const pendingPercent = totalItems > 0 ? (agent.pending / totalItems) * 100 : 0;
              const skippedPercent = totalItems > 0 ? (agent.skipped / totalItems) * 100 : 0;

              return (
                <div
                  key={agent.agentId}
                  className={`p-3 border rounded-lg bg-surface transition-all ${
                    hoveredAgentId === agent.agentId ? 'shadow-sm border-accent' : ''
                  }`}
                  onMouseEnter={() => setHoveredAgentId(agent.agentId)}
                  onMouseLeave={() => setHoveredAgentId(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        {agent.agentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-dark text-xs">{agent.agentName}</div>
                        {agent.agentEmail && (
                          <div className="text-xs text-muted font-mono leading-none mt-0.5">
                            {agent.agentEmail}
                          </div>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={
                        agent.completionRate >= 90
                          ? 'success'
                          : agent.completionRate >= 70
                          ? 'accent'
                          : agent.totalAssigned === 0
                          ? 'neutral'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {agent.completionRate}% Velocity
                    </Badge>
                  </div>

                  {/* Multi-segment Proportional Progress Bar */}
                  <div className="w-full bg-border-light h-2 rounded-full overflow-hidden flex my-2 border">
                    <div
                      className="h-full bg-success transition-all"
                      style={{ width: `${completedPercent}%` }}
                      title={`Completed: ${agent.completed}`}
                    />
                    <div
                      className="h-full bg-warning transition-all"
                      style={{ width: `${pendingPercent}%` }}
                      title={`Pending: ${agent.pending}`}
                    />
                    <div
                      className="h-full bg-danger transition-all"
                      style={{ width: `${skippedPercent}%` }}
                      title={`Skipped: ${agent.skipped}`}
                    />
                  </div>

                  {/* Touchpoint Breakdown Values */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-light mt-1 text-muted">
                    <span className="flex items-center gap-1 text-success font-semibold">
                      <CheckIcon size={12} /> {agent.completed} done
                    </span>
                    <span className="flex items-center gap-1 text-warning font-semibold">
                      <ClockIcon size={12} /> {agent.pending} pending
                    </span>
                    <span className="flex items-center gap-1 text-danger font-semibold">
                      <AlertTriangleIcon size={12} /> {agent.skipped} skipped
                    </span>

                    {showProjectsCount && agent.assignedProjectsCount !== undefined && (
                      <span className="text-muted font-mono">
                        {agent.assignedProjectsCount} proj
                      </span>
                    )}

                    {agent.avgRating !== undefined && (
                      <span className="flex items-center gap-0.5 text-warning font-semibold">
                        <StarIcon size={11} /> {agent.avgRating}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

