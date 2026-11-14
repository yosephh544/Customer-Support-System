import React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { UserIcon, ShieldIcon, CalendarIcon, CheckSquareIcon, AlertCircleIcon, TrendingUpIcon } from '../icons/Icons';
import type { UserProfile } from '../../types';

export interface TeamLeaderPerformanceCardProps {
  teamLeads: UserProfile[];
  totalCycles: number;
  completedCycles: number;
  overallTeamSlaRate: number;
  totalTeamTouchpoints: number;
  completedTeamTouchpoints: number;
  skippedTeamTouchpoints: number;
  specialistUtilizationRate: number;
  assignedSpecialistsCount: number;
  totalSpecialistsCount: number;
  onNavigateToSchedules?: () => void;
  onNavigateToUsers?: () => void;
}

export const TeamLeaderPerformanceCard: React.FC<TeamLeaderPerformanceCardProps> = ({
  teamLeads,
  totalCycles,
  completedCycles,
  overallTeamSlaRate,
  totalTeamTouchpoints,
  completedTeamTouchpoints,
  skippedTeamTouchpoints,
  specialistUtilizationRate,
  assignedSpecialistsCount,
  totalSpecialistsCount,
  onNavigateToSchedules,
  onNavigateToUsers,
}) => {
  return (
    <div className="dashboard-card team-leader-performance-card">
      <div className="card-header-with-action flex-wrap gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="card-title">Team Leader Operational Oversight & Governance</h3>
            <Badge variant="purple" size="sm">
              <ShieldIcon size={12} /> {teamLeads.length} Lead Operations
            </Badge>
          </div>
          <p className="card-subtitle">
            Executive oversight of Team Leader schedule delivery, specialist resource allocation, and team execution SLA
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToSchedules && (
            <Button variant="outline" size="sm" onClick={onNavigateToSchedules}>
              Operational Cycles &rarr;
            </Button>
          )}
        </div>
      </div>

      {teamLeads.length === 0 ? (
        <div className="p-6 text-center text-muted">
          <UserIcon size={24} className="mx-auto mb-2 opacity-50" />
          <div className="text-sm font-semibold text-dark">No Team Leader Account Found</div>
          <p className="text-xs text-muted mt-1">
            Assign the Team Lead role in User Directory to view leadership operational metrics.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Team Leaders Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamLeads.map((tl) => (
              <div
                key={tl.id}
                className="p-3.5 border rounded-lg bg-surface flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: '#7D82B8',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}
                      >
                        {tl.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-dark text-sm">{tl.fullName}</div>
                        <div className="text-xs text-muted font-mono">{tl.email || `@${tl.userName}`}</div>
                      </div>
                    </div>

                    <Badge variant={tl.isActive ? 'success' : 'neutral'} size="sm" dot>
                      {tl.isActive ? 'Active Duty' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted font-mono mb-3">
                    {tl.phoneNumber ? `Direct: ${tl.phoneNumber}` : 'DAF Operations Command'}
                  </div>
                </div>

                {/* Team Lead Operational Scores */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                  <div className="p-2 rounded bg-card border">
                    <div className="text-xs text-muted font-medium">Cycles Planned</div>
                    <div className="text-sm font-bold text-dark mt-0.5">{totalCycles}</div>
                  </div>
                  <div className="p-2 rounded bg-card border">
                    <div className="text-xs text-muted font-medium">Team SLA Rate</div>
                    <div className="text-sm font-bold text-success mt-0.5">{overallTeamSlaRate}%</div>
                  </div>
                  <div className="p-2 rounded bg-card border">
                    <div className="text-xs text-muted font-medium">Team Capacity</div>
                    <div className="text-sm font-bold text-accent mt-0.5">{specialistUtilizationRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Operational Delivery Governance Summary Banner */}
          <div className="p-3.5 border rounded-lg bg-card grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-surface text-accent">
                <CalendarIcon size={16} />
              </div>
              <div>
                <span className="text-xs text-muted block">Cycles Execution</span>
                <span className="text-xs font-bold text-dark">
                  {completedCycles} completed of {totalCycles} cycles
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-surface text-success">
                <CheckSquareIcon size={16} />
              </div>
              <div>
                <span className="text-xs text-muted block">Touchpoint Throughput</span>
                <span className="text-xs font-bold text-success">
                  {completedTeamTouchpoints} / {totalTeamTouchpoints} delivered
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-surface text-danger">
                <AlertCircleIcon size={16} />
              </div>
              <div>
                <span className="text-xs text-muted block">Blocker Items</span>
                <span className="text-xs font-bold text-danger">
                  {skippedTeamTouchpoints} skipped touchpoints
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-surface text-primary">
                <TrendingUpIcon size={16} />
              </div>
              <div>
                <span className="text-xs text-muted block">Supervised Specialists</span>
                <span className="text-xs font-bold text-dark">
                  {assignedSpecialistsCount} of {totalSpecialistsCount} active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

