import { AgentBentoDashboard } from '../../components/bento/AgentBentoDashboard';
import React, { useEffect, useState } from 'react';
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
import type { ScheduleItem, SupportAssignment } from '../../types';

export interface AgentWorkspacePageProps {
  onNavigateToTouchpoints: () => void;
}

export const AgentWorkspacePage: React.FC<AgentWorkspacePageProps> = ({
  onNavigateToTouchpoints,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, assignRes, analyticsRes] = await Promise.allSettled([
          schedulesApi.getMyItems({ pageSize: 50 }),
          user ? assignmentsApi.getAssignmentsByUser(user.id) : Promise.resolve([]),
          feedbacksApi.getAnalytics(),
        ]);

        if (itemsRes.status === 'fulfilled') {
          setItems(itemsRes.value.items || []);
        }
        if (assignRes.status === 'fulfilled') {
          setAssignments(assignRes.value || []);
        }
        if (analyticsRes.status === 'fulfilled' && typeof analyticsRes.value?.averageRating === 'number' && analyticsRes.value.averageRating > 0) {
          setAvgRating(analyticsRes.value.averageRating);
        }
      } catch (err: any) {
        setPageError({
          message: err.message || 'Failed to load specialist workspace metrics.',
          details: err.errors,
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
          <h1 className="main-page-title">
            Specialist Dashboard
          </h1>
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

      {/* Visual-First Bento Grid Dashboard */}
      <AgentBentoDashboard
        items={items}
        assignments={assignments}
        avgRating={avgRating}
        onNavigateToTouchpoints={onNavigateToTouchpoints}
      />
    </div>
  );
};
