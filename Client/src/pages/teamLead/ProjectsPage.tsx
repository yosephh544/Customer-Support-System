import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projectsApi';
import { organizationsApi } from '../../api/organizationsApi';
import { modulesApi } from '../../api/modulesApi';
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
import { PlusIcon, EditIcon, TrashIcon, ModuleIcon } from '../../components/icons/Icons';
import type { MasterModule, Organization, Project, ProjectModule, ProjectStatus } from '../../types';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [masterModules, setMasterModules] = useState<MasterModule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Errors & notifications
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectForModules, setSelectedProjectForModules] = useState<Project | null>(null);
  const [isAssignModuleModalOpen, setIsAssignModuleModalOpen] = useState(false);
  const [projectModules, setProjectModules] = useState<ProjectModule[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [orgId, setOrgId] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [moduleVersion, setModuleVersion] = useState('v1.0');
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await projectsApi.getProjects({
        pageNumber: page,
        pageSize,
        searchTerm,
        organizationId: selectedOrgId || undefined,
      });
      setProjects(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load projects list.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const res = await organizationsApi.getOrganizations({ pageSize: 100 });
      setOrganizations(res.items || []);
    } catch {
      // Optional background metadata
    }
  };

  const loadMasterModules = async () => {
    try {
      const res = await modulesApi.getMasterModules({ pageSize: 100 });
      setMasterModules(res.items || []);
    } catch {
      // Optional background metadata
    }
  };

  useEffect(() => {
    loadOrganizations();
    loadMasterModules();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [page, pageSize, searchTerm, selectedOrgId]);

  const handleOpenCreateModal = () => {
    setName('');
    setCode('');
    setOrgId(organizations[0]?.id || '');
    setDescription('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !orgId) {
      setFormError({ message: 'Project name and target organization are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await projectsApi.createProject({
        name: name.trim(),
        code: code.trim() || undefined,
        organizationId: orgId,
        description: description.trim() || undefined,
      });
      setSuccessMessage(`Project "${name.trim()}" created successfully.`);
      setIsCreateModalOpen(false);
      loadProjects();
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to create project.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModulesModal = async (project: Project) => {
    setSelectedProjectForModules(project);
    setIsAssignModuleModalOpen(true);
    setFormError(null);
    try {
      const mods = await projectsApi.getProjectModules(project.id);
      setProjectModules(mods);
    } catch {
      setProjectModules([]);
    }
  };

  const handleAssignModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForModules || !selectedModuleId) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await projectsApi.assignModuleToProject(selectedProjectForModules.id, {
        moduleId: selectedModuleId,
        version: moduleVersion.trim() || 'v1.0',
      });
      const mods = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(mods);
      setSelectedModuleId('');
      setSuccessMessage(`Module assigned to "${selectedProjectForModules.name}" successfully.`);
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to attach module to project.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveModule = async (pmId: string) => {
    if (!selectedProjectForModules) return;
    try {
      await projectsApi.removeModuleFromProject(selectedProjectForModules.id, pmId);
      const mods = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(mods);
      setSuccessMessage('Module detached from project.');
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to remove module from project.',
        details: err.errors,
      });
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete project "${project.name}"?`)) return;
    try {
      await projectsApi.deleteProject(project.id);
      setSuccessMessage(`Project "${project.name}" deleted successfully.`);
      loadProjects();
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to delete project.',
        details: err.errors,
      });
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success" dot>Active</Badge>;
      case 'OnHold':
        return <Badge variant="warning" dot>On Hold</Badge>;
      case 'Completed':
        return <Badge variant="purple">Completed</Badge>;
      case 'Planning':
        return <Badge variant="primary" dot>Planning</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'PROJECT NAME',
      render: (p) => (
        <div>
          <div className="font-semibold text-dark">{p.name}</div>
          <div className="text-xs text-muted">CODE: {p.code}</div>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'ORGANIZATION',
      render: (p) => (
        <span className="font-medium text-sm text-dark">{p.organizationName}</span>
      ),
    },
    {
      key: 'modules',
      header: 'ATTACHED MODULES',
      render: (p) => (
        <button
          type="button"
          className="btn-module-pill"
          onClick={() => handleOpenModulesModal(p)}
          title="Manage modules for this project"
        >
          <ModuleIcon size={13} />
          <span>{p.moduleCount || 0} modules</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (p) => getStatusBadge(p.status),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (p) => (
        <div className="action-buttons-cell">
          <button
            type="button"
            className="icon-action-btn danger"
            onClick={() => handleDeleteProject(p)}
            title="Delete project"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="projects-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">Projects & Module Architecture</h2>
          <p className="main-page-subtitle">
            Configure client projects and attach functional modules under leadership governance.
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
            <Button size="sm" variant="outline" onClick={loadProjects}>
              Retry Connection
            </Button>
          }
        />
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={
          <Select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            options={[
              { value: '', label: 'All Organizations' },
              ...organizations.map((o) => ({ value: o.id, label: o.name })),
            ]}
          />
        }
        actionButton={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon size={15} />}
            onClick={handleOpenCreateModal}
          >
            New Project
          </Button>
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={projects}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyMessage="No customer projects found. Click 'New Project' to create one for your team."
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize Customer Project"
        description="Team Leads define the project scope and client organization mapping."
      >
        {formError && (
          <Alert
            variant="error"
            message={formError.message}
            details={formError.details}
            onClose={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleCreateProject}>
          <Select
            label="Client Organization"
            required
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            options={[
              { value: '', label: 'Select client organization...' },
              ...organizations.map((o) => ({ value: o.id, label: o.name })),
            ]}
          />

          <Input
            label="Project Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Project Code (Optional)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            helperText="If omitted, will be auto-generated."
          />

          <Input
            label="Description / Scope"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
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
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modules Assignment Modal */}
      <Modal
        isOpen={isAssignModuleModalOpen}
        onClose={() => setIsAssignModuleModalOpen(false)}
        title={`Modules: ${selectedProjectForModules?.name || 'Project'}`}
        description="Attach master domain modules to this project for agent outreach."
      >
        {formError && (
          <Alert
            variant="error"
            message={formError.message}
            details={formError.details}
            onClose={() => setFormError(null)}
          />
        )}

        <div className="mb-4">
          <h4 className="text-xs font-bold text-muted uppercase mb-2">Attached Modules</h4>
          {projectModules.length === 0 ? (
            <p className="text-xs text-muted">No modules attached yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {projectModules.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <span className="font-semibold text-sm">{pm.moduleName}</span>
                    <span className="text-xs text-muted ml-2">({pm.version || 'v1.0'})</span>
                  </div>
                  <button
                    type="button"
                    className="icon-action-btn danger"
                    onClick={() => handleRemoveModule(pm.id)}
                    title="Detach module"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAssignModule} className="border-t pt-3">
          <h4 className="text-xs font-bold text-muted uppercase mb-2">Attach Another Module</h4>
          <Select
            label="Select Module"
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            options={[
              { value: '', label: 'Choose a master module...' },
              ...masterModules.map((m) => ({ value: m.id, label: `${m.name} (${m.code})` })),
            ]}
          />
          <Input
            label="Module Version / Tag"
            value={moduleVersion}
            onChange={(e) => setModuleVersion(e.target.value)}
          />
          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModuleModalOpen(false)}
            >
              Done
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedModuleId || isSubmitting}
              isLoading={isSubmitting}
            >
              Attach Module
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
