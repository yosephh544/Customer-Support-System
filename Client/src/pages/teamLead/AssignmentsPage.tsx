import React, { useEffect, useState } from 'react';
import { assignmentsApi } from '../../api/assignmentsApi';
import { projectsApi } from '../../api/projectsApi';
import { usersApi } from '../../api/usersApi';
import { Button } from '../../components/common/Button';
import { FilterBar } from '../../components/common/FilterBar';
import { Table } from '../../components/common/Table';
import type { Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { PlusIcon, TrashIcon, UsersIcon } from '../../components/icons/Icons';
import type { Project, ProjectModule, SupportAssignment, UserProfile } from '../../types';

export const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<SupportAssignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Notifications
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [availableModules, setAvailableModules] = useState<ProjectModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAssignments = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await assignmentsApi.getAssignments({
        pageNumber: page,
        pageSize,
        searchTerm,
        projectId: filterProjectId || undefined,
      });
      setAssignments(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load team assignments.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [page, pageSize, searchTerm, filterProjectId]);

  useEffect(() => {
    const fetchPrjsAndAgents = async () => {
      try {
        const [prjRes, agentRes] = await Promise.all([
          projectsApi.getProjects({ pageSize: 100 }),
          usersApi.getUsers({ pageSize: 100, role: 'SupportAgent' }),
        ]);
        setProjects(prjRes.items || []);
        setAgents(agentRes.items || []);
      } catch {
        // Handled silently
      }
    };
    fetchPrjsAndAgents();
  }, []);

  const handleProjectSelectInModal = async (pId: string) => {
    setSelectedProjectId(pId);
    setSelectedModuleId('');
    if (pId) {
      try {
        const mods = await projectsApi.getProjectModules(pId);
        setAvailableModules(mods);
      } catch {
        setAvailableModules([]);
      }
    } else {
      setAvailableModules([]);
    }
  };

  const handleOpenModal = () => {
    setSelectedAgentId('');
    setSelectedProjectId('');
    setAvailableModules([]);
    setSelectedModuleId('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedAgentId || !selectedProjectId) {
      setFormError({ message: 'Support agent and target project are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await assignmentsApi.createAssignment({
        supportAgentId: selectedAgentId,
        projectId: selectedProjectId,
        projectModuleId: selectedModuleId || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccessMessage('Agent assigned to project successfully.');
      setIsModalOpen(false);
      loadAssignments();
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to assign team member.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignment: SupportAssignment) => {
    if (!confirm(`Remove assignment for agent "${assignment.agentName}" on project "${assignment.projectName}"?`)) return;
    try {
      await assignmentsApi.deleteAssignment(assignment.id);
      setSuccessMessage('Assignment removed successfully.');
      loadAssignments();
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to remove assignment.',
        details: err.errors,
      });
    }
  };

  const columns: Column<SupportAssignment>[] = [
    {
      key: 'agent',
      header: 'SUPPORT AGENT',
      render: (a) => (
        <div className="agent-cell">
          <span className="agent-avatar">{a.agentName.charAt(0)}</span>
          <div>
            <div className="font-semibold text-dark">{a.agentName}</div>
            <div className="text-xs text-muted">{a.agentEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'ASSIGNED PROJECT',
      render: (a) => (
        <div>
          <div className="font-semibold text-dark">{a.projectName}</div>
          <div className="text-xs text-muted">Client: {a.organizationName}</div>
        </div>
      ),
    },
    {
      key: 'module',
      header: 'FOCUSED MODULE',
      render: (a) =>
        a.moduleName ? (
          <Badge variant="purple" size="sm">
            {a.moduleName}
          </Badge>
        ) : (
          <span className="text-xs text-muted">All Modules (General)</span>
        ),
    },
    {
      key: 'assignedBy',
      header: 'ASSIGNED BY',
      render: (a) => (
        <span className="text-xs text-muted">
          {a.assignedByName || 'Team Lead'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (a) => (
        <div className="action-buttons-cell">
          <button
            type="button"
            className="icon-action-btn danger"
            onClick={() => handleDeleteAssignment(a)}
            title="Remove Assignment"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="assignments-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">Team Member Assignments</h2>
          <p className="main-page-subtitle">
            Team Leads allocate support agents to client projects and functional modules.
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {pageError && (
        <Alert
          variant="error"
          message={pageError.message}
          details={pageError.details}
          onClose={() => setPageError(null)}
          action={
            <Button size="sm" variant="outline" onClick={loadAssignments}>
              Retry Connection
            </Button>
          }
        />
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by agent name or project..."
        filters={
          <Select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        }
        actionButton={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon size={15} />}
            onClick={handleOpenModal}
          >
            Assign Member
          </Button>
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={assignments}
          keyExtractor={(a) => a.id}
          isLoading={isLoading}
          emptyMessage="No team assignments recorded. Click 'Assign Member' to allocate agents."
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Agent to Project"
        description="Allocate dedicated support capacity to a customer engagement."
      >
        {formError && (
          <Alert
            variant="error"
            message={formError.message}
            details={formError.details}
            onClose={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleCreateAssignment}>
          <Select
            label="Support Agent"
            required
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            options={[
              { value: '', label: 'Select support agent...' },
              ...agents.map((ag) => ({ value: ag.id, label: `${ag.fullName} (${ag.email})` })),
            ]}
          />

          <Select
            label="Customer Project"
            required
            value={selectedProjectId}
            onChange={(e) => handleProjectSelectInModal(e.target.value)}
            options={[
              { value: '', label: 'Select project...' },
              ...projects.map((pr) => ({ value: pr.id, label: `${pr.name} — ${pr.organizationName}` })),
            ]}
          />

          {availableModules.length > 0 && (
            <Select
              label="Specific Module (Optional)"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              options={[
                { value: '', label: 'All Project Modules (General)' },
                ...availableModules.map((m) => ({ value: m.id, label: `${m.moduleName} (${m.version || 'v1.0'})` })),
              ]}
              helperText="Target a specific domain module or leave general."
            />
          )}

          <Input
            label="Assignment Scope & Guidelines"
            placeholder="e.g. Focus on claims sync errors and billing escalations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
