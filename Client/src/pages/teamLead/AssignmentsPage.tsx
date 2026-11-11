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

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [availableModules, setAvailableModules] = useState<ProjectModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await assignmentsApi.getAssignments({
        pageNumber: page,
        pageSize,
        searchTerm,
        projectId: filterProjectId || undefined,
      });
      setAssignments(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error(err);
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
        const [prjsRes, usersRes] = await Promise.all([
          projectsApi.getProjects({ pageSize: 100 }),
          usersApi.getUsers({ pageSize: 100 }),
        ]);
        setProjects(prjsRes.items || []);
        // filter agents or team members
        const activeAgents = (usersRes.items || []).filter(
          (u) => u.role === 'SupportAgent' || u.role === 'TeamLead'
        );
        setAgents(activeAgents);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPrjsAndAgents();
  }, []);

  // When project changes in the modal, load its modules
  useEffect(() => {
    if (selectedProjectId) {
      projectsApi
        .getProjectModules(selectedProjectId)
        .then(setAvailableModules)
        .catch(() => setAvailableModules([]));
    } else {
      setAvailableModules([]);
      setSelectedModuleId('');
    }
  }, [selectedProjectId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedAgentId || !selectedProjectId) {
      setFormError('Please select both a team member and a project.');
      return;
    }

    try {
      await assignmentsApi.createAssignment({
        userId: selectedAgentId,
        projectId: selectedProjectId,
        projectModuleId: selectedModuleId || undefined,
        isActive: true,
        notes: notes.trim(),
      });
      setIsModalOpen(false);
      setSelectedAgentId('');
      setSelectedProjectId('');
      setSelectedModuleId('');
      setNotes('');
      loadAssignments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to assign team member.');
    }
  };

  const handleDeleteAssignment = async (id: string, agentName: string) => {
    if (!confirm(`Remove assignment for "${agentName}"?`)) return;
    try {
      await assignmentsApi.deleteAssignment(id);
      loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignment.');
    }
  };

  const columns: Column<SupportAssignment>[] = [
    {
      key: 'userFullName',
      header: 'TEAM MEMBER',
      render: (a) => (
        <div className="agent-cell">
          <span className="agent-avatar">{a.userFullName.charAt(0)}</span>
          <div>
            <div className="font-semibold text-dark">{a.userFullName}</div>
            <div className="text-xs text-muted">{a.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'projectName',
      header: 'PROJECT & CODE',
      render: (a) => (
        <div>
          <div className="font-medium">{a.projectName}</div>
          <div className="text-xs text-muted">{a.projectCode}</div>
        </div>
      ),
    },
    {
      key: 'moduleName',
      header: 'ASSIGNED MODULE',
      render: (a) =>
        a.moduleName ? (
          <Badge variant="purple" size="sm">
            {a.moduleName} ({a.moduleCode})
          </Badge>
        ) : (
          <span className="text-xs text-muted">All project modules</span>
        ),
    },
    {
      key: 'isActive',
      header: 'STATUS',
      render: (a) => (
        <Badge variant={a.isActive ? 'success' : 'neutral'} dot>
          {a.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'assignedAt',
      header: 'ASSIGNED DATE',
      render: (a) => (
        <span className="text-xs text-muted">
          {new Date(a.assignedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (a) => (
        <button
          type="button"
          className="icon-action-btn danger"
          onClick={() => handleDeleteAssignment(a.id, a.userFullName)}
          title="Remove assignment"
        >
          <TrashIcon size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="assignments-page">
      <div className="page-header-row">
        <div>
          <h2 className="section-title">Team Member Project Assignments</h2>
          <p className="section-subtitle">
            Assign support agents and team members to client projects and specific delivery modules.
          </p>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search agents or projects..."
        actionButton={
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Assign team member
          </Button>
        }
      >
        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="filter-select"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </FilterBar>

      <div className="content-card">
        <Table
          columns={columns}
          data={assignments}
          keyExtractor={(a) => a.id}
          isLoading={isLoading}
          emptyMessage="No team assignments found. Click 'Assign team member' above to assign an agent to a project."
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Assign Team Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Team Member to Project"
        description="Select an agent and connect them to a client project."
      >
        {formError && <div className="form-error-alert">{formError}</div>}
        <form onSubmit={handleCreateAssignment}>
          <Select
            label="Support Agent / Specialist"
            required
            options={agents.map((a) => ({
              value: a.id,
              label: `${a.fullName} (${a.email})`,
            }))}
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            placeholder="Select a specialist..."
          />
          <Select
            label="Client Project"
            required
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.organizationName})`,
            }))}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            placeholder="Select a project..."
          />
          {availableModules.length > 0 && (
            <Select
              label="Specific Module (Optional)"
              options={availableModules.map((m) => ({
                value: m.id,
                label: `${m.moduleName} (${m.version || 'v1.0'})`,
              }))}
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              placeholder="All modules in project"
            />
          )}
          <Input
            label="Assignment Notes"
            placeholder="e.g. Primary point of contact for customer inquiries"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
