import { TeamLeadBentoDashboard } from '../../components/bento/TeamLeadBentoDashboard';
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { schedulesApi } from '../../api/schedulesApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { usersApi } from '../../api/usersApi';
import { feedbacksApi } from '../../api/feedbacksApi';
import type { AgentPerformanceData } from '../../components/common/AgentPerformanceGraph';
import { PdfIcon } from '../../components/icons/Icons';
import { exportToPdf } from '../../utils/exportUtils';
import {
  UserRole,
  toUserRole,
  isCompletedTouchpoint,
  isPendingTouchpoint,
  isSkippedTouchpoint,
} from '../../types';
import type { SupportAssignment, WeeklySchedule, ScheduleItem, UserProfile } from '../../types';

export interface TeamOperationsPageProps {
  onNavigateToAssignments?: () => void;
  onNavigateToPlanner?: () => void;
}

export const TeamOperationsPage: React.FC<TeamOperationsPageProps> = ({
  onNavigateToAssignments,
  onNavigateToPlanner,
}) => {
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);
  const [csatScore, setCsatScore] = useState<number>(5.0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      let activeSched: WeeklySchedule | null = null;
      try {
        activeSched = await schedulesApi.getCurrentSchedule();
      } catch {
        // Fallback to most recent schedule in system
        const res = await schedulesApi.getSchedules({ pageSize: 1 });
        if (res.items && res.items.length > 0) {
          activeSched = res.items[0];
        }
      }

      const [assignRes, usersRes, analyticsRes] = await Promise.all([
        assignmentsApi.getAssignments({ pageSize: 100 }).catch(() => null),
        usersApi.getUsers({ pageSize: 100 }).catch(() => null),
        feedbacksApi.getAnalytics().catch(() => null),
      ]);

      if (activeSched) {
        setCurrentSchedule(activeSched);
        try {
          const itemsRes = await schedulesApi.getScheduleItems(activeSched.id, { pageSize: 200 });
          setScheduleItems(itemsRes.items || []);
        } catch {
          setScheduleItems([]);
        }
      }
      if (assignRes) {
        setAssignments(assignRes.items || []);
      }
      if (usersRes) {
        const agents = (usersRes.items || []).filter((u) => toUserRole(u.role) === UserRole.SupportAgent);
        setSpecialists(agents);
      }
      if (analyticsRes && typeof analyticsRes.averageRating === 'number' && analyticsRes.averageRating > 0) {
        setCsatScore(analyticsRes.averageRating);
      }
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to synchronize latest team operations data.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute per-agent performance metrics
  const agentPerformanceData: AgentPerformanceData[] = useMemo(() => {
    return specialists.map((sp) => {
      const agentItems = scheduleItems.filter((i) => i.assignedUserId === sp.id);
      const done = agentItems.filter((i) => isCompletedTouchpoint(i.status)).length;
      const skipped = agentItems.filter((i) => isSkippedTouchpoint(i.status)).length;
      const pending = agentItems.filter((i) => isPendingTouchpoint(i.status)).length;
      const total = agentItems.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      const assignedProjects = assignments.filter((a) => a.userId === sp.id && a.isActive).length;

      return {
        agentId: sp.id,
        agentName: sp.fullName,
        agentEmail: sp.email,
        totalAssigned: total,
        completed: done,
        pending,
        skipped,
        completionRate: rate,
        assignedProjectsCount: assignedProjects,
      };
    });
  }, [specialists, scheduleItems, assignments]);

  // Calculate delivery stats from real data
  const totalPlanned = scheduleItems.length > 0 ? scheduleItems.length : currentSchedule?.totalItems || 0;
  const completed = scheduleItems.length > 0
    ? scheduleItems.filter((i) => isCompletedTouchpoint(i.status)).length
    : currentSchedule?.completedItems || 0;
  const pending = scheduleItems.length > 0
    ? scheduleItems.filter((i) => isPendingTouchpoint(i.status)).length
    : currentSchedule?.pendingItems || 0;
  const skipped = scheduleItems.length > 0
    ? scheduleItems.filter((i) => isSkippedTouchpoint(i.status)).length
    : currentSchedule?.skippedItems || 0;
  const completionRate = totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0;
  const activeAssignmentsCount = assignments.filter((a) => a.isActive).length;
  const uniqueProjectsCount = new Set(assignments.map((a) => a.projectId).filter(Boolean)).size;

  const handleExportShiftPdf = () => {
    const cycleLabel = currentSchedule ? `Year ${currentSchedule.year} - Week ${currentSchedule.weekNumber}` : 'Current Week';
    const dateStr = new Date().toISOString().slice(0, 10);
    const assignmentRows = assignments.map((a) => [
      a.userFullName || 'Assigned Specialist',
      a.projectName || 'Active Project',
      a.organizationName || 'Client Org',
      a.moduleName || 'General',
      a.isActive ? 'Active Duty' : 'Inactive',
    ]);

    exportToPdf({
      fileName: `Team_Shift_Report_${dateStr}.pdf`,
      title: `Team Operations Shift Execution Report (${cycleLabel})`,
      subtitle: 'Real-time Weekly Schedule Execution, Workforce Capacity & Touchpoints Progress',
      authorOrRole: 'Team Lead Operations',
      kpis: [
        { label: 'Weekly Completion', value: `${completionRate}%`, color: 'success' },
        { label: 'Resolved Touchpoints', value: `${completed} / ${totalPlanned}`, color: 'primary' },
        { label: 'Pending in Queue', value: pending, color: 'warning' },
        { label: 'Skipped Inquiries', value: skipped, color: 'danger' },
        { label: 'Active Assignments', value: activeAssignmentsCount, color: 'primary' },
      ],
      sections: [
        {
          title: 'Specialist Project Assignments & Coverage',
          columns: ['Specialist Name', 'Project Assigned', 'Client Organization', 'Module Scope', 'Status'],
          columnWidths: [3, 2.5, 2.5, 2, 1.5],
          rows: assignmentRows,
        },
      ],
      notes: [
        'Shift metrics generated from live operational schedule feeds.',
        'Weekly completion is calculated as completed items divided by total planned schedule items.',
      ],
    });
  };

  return (
    <div className="team-operations-view">
      {/* Page Title & Subtitle Banner */}
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">
            Operations Dashboard
          </h1>
        </div>

        <div className="headline-actions flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportShiftPdf}
            className="flex items-center gap-1.5"
            title="Export shift operations report as PDF"
          >
            <PdfIcon size={14} />
            <span>Export Shift Report (.pdf)</span>
          </Button>

          <div className="pill-date-button">
            <span>📅</span>
            <span>{currentSchedule ? `Week ${currentSchedule.weekNumber}, ${currentSchedule.year}` : 'Current Week'}</span>
          </div>
        </div>
      </div>

      {pageError && (
        <Alert
          variant="warning"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
          action={
            <Button size="sm" variant="outline" onClick={loadData}>
              Retry Connection
            </Button>
          }
        />
      )}

      {/* Visual-First Bento Grid Dashboard */}
      <TeamLeadBentoDashboard
        currentSchedule={currentSchedule}
        scheduleItems={scheduleItems}
        agentPerformanceData={agentPerformanceData}
        specialists={specialists}
        csatScore={csatScore}
        onNavigateToAssignments={onNavigateToAssignments}
        onNavigateToPlanner={onNavigateToPlanner}
      />
    </div>
  );
};
