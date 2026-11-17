import React, { useEffect, useState } from 'react';
import { AgentPulseDashboard } from '../../components/dashboards/AgentPulseDashboard';
import { schedulesApi } from '../../api/schedulesApi';
import { assignmentsApi } from '../../api/assignmentsApi';
import { feedbacksApi } from '../../api/feedbacksApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { PdfIcon } from '../../components/icons/Icons';
import { exportToPdf } from '../../utils/exportUtils';
import {
  isCompletedTouchpoint,
  isPendingTouchpoint,
  isSkippedTouchpoint,
} from '../../types';
import type { ScheduleItem, SupportAssignment, WeeklySchedule } from '../../types';

export interface AgentWorkspacePageProps {
  onNavigateToTouchpoints: () => void;
}

export const AgentWorkspacePage: React.FC<AgentWorkspacePageProps> = ({
  onNavigateToTouchpoints,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [weekLabel, setWeekLabel] = useState('Current week');
  const [, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, feedbackRes] = await Promise.allSettled([
          user ? assignmentsApi.getAssignmentsByUser(user.id) : Promise.resolve([]),
          user
            ? feedbacksApi.getFeedbacks({ assignedUserId: user.id, pageSize: 100 })
            : Promise.resolve({ items: [], totalCount: 0, pageNumber: 1, pageSize: 100, totalPages: 0 }),
        ]);

        let schedule: WeeklySchedule | null = null;
        try {
          schedule = await schedulesApi.getCurrentSchedule();
        } catch {
          try {
            const res = await schedulesApi.getSchedules({ pageSize: 1 });
            schedule = res.items?.[0] ?? null;
          } catch {
            schedule = null;
          }
        }

        if (schedule && user) {
          setWeekLabel(`Week ${schedule.weekNumber}, ${schedule.year}`);
          try {
            const itemsRes = await schedulesApi.getScheduleItems(schedule.id, {
              assignedUserId: user.id,
              pageSize: 100,
            });
            setItems(itemsRes.items || []);
          } catch {
            setItems([]);
          }
        } else if (user) {
          setWeekLabel('All assigned');
          const myItems = await schedulesApi.getMyItems({ pageSize: 100 });
          setItems(myItems.items || []);
        }

        if (assignRes.status === 'fulfilled') {
          setAssignments(assignRes.value || []);
        }
        if (feedbackRes.status === 'fulfilled') {
          const agentFeedbacks = feedbackRes.value.items || [];
          setReviewCount(feedbackRes.value.totalCount || agentFeedbacks.length);
          setAvgRating(
            agentFeedbacks.length > 0
              ? Number(
                  (
                    agentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / agentFeedbacks.length
                  ).toFixed(1)
                )
              : null
          );
        }
      } catch (err: unknown) {
        const e = err as { message?: string; errors?: string[] };
        setPageError({
          message: e.message || 'Failed to load specialist workspace metrics.',
          details: e.errors,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const total = items.length;
  const completed = items.filter((i) => isCompletedTouchpoint(i.status)).length;
  const skipped = items.filter((i) => isSkippedTouchpoint(i.status)).length;
  const pending = items.filter((i) => isPendingTouchpoint(i.status)).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleExportPdf = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const rows = items.map((i) => [
      i.organizationName || 'Client Org',
      i.contactPersonName || 'Contact',
      i.contactPersonPhone || 'N/A',
      i.projectName || 'Project',
      i.projectModuleName || 'General',
      i.scheduledDate ? new Date(i.scheduledDate).toLocaleDateString() : 'N/A',
      isCompletedTouchpoint(i.status) ? 'Completed' : isSkippedTouchpoint(i.status) ? 'Skipped' : 'Pending',
      i.notes ? i.notes.slice(0, 30) : 'None',
    ]);

    exportToPdf({
      fileName: `Specialist_Schedule_Log_${dateStr}.pdf`,
      title: 'Support Specialist Touchpoint Schedule & Engagement Log',
      subtitle: `Assigned Engagements for ${user?.fullName || 'Specialist'}`,
      authorOrRole: user?.fullName || 'Support Specialist',
      kpis: [
        { label: 'Assigned Touchpoints', value: total, color: 'primary' },
        { label: 'Completed Engagements', value: completed, color: 'success' },
        { label: 'Pending Outreach', value: pending, color: 'warning' },
        { label: 'Skipped Calls', value: skipped, color: 'danger' },
        { label: 'Completion Rate', value: `${rate}%`, color: 'success' },
      ],
      sections: [
        {
          title: 'Specialist Touchpoint Schedule',
          columns: ['Organization', 'Contact Person', 'Phone', 'Project', 'Module', 'Date', 'Status', 'Notes'],
          columnWidths: [2.5, 2.2, 2, 2, 1.8, 1.6, 1.4, 2.5],
          rows,
        },
      ],
      notes: [
        'Engagements verified through client outreach logs.',
        'Touchpoints marked Completed reflect customer contact resolution.',
      ],
    });
  };

  return (
    <div className="agent-workspace-view">
      <div className="view-headline-row">
        <div>
          <h1 className="main-page-title">Specialist Dashboard</h1>
          <p className="main-page-subtitle">
            Your calls, queue, and customer quality in one focused view.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf} title="Export shift schedule log as PDF">
            <PdfIcon size={14} />
            <span>Export Schedule (.pdf)</span>
          </Button>

          <Button variant="accent" size="sm" onClick={onNavigateToTouchpoints}>
            Open Ticket Queue
          </Button>
        </div>
      </div>

      {pageError && (
        <Alert
          variant="warning"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
        />
      )}

      <AgentPulseDashboard
        items={items}
        assignments={assignments}
        avgRating={avgRating}
        reviewCount={reviewCount}
        weekLabel={weekLabel}
        onNavigateToTouchpoints={onNavigateToTouchpoints}
      />
    </div>
  );
};
