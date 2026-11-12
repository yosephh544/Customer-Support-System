import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projectsApi';
import { organizationsApi } from '../../api/organizationsApi';
import { Button } from '../../components/common/Button';
import { FilterBar } from '../../components/common/FilterBar';
import { Table } from '../../components/common/Table';
import type { Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { PlusIcon, EditIcon, TrashIcon, ModuleIcon, CheckIcon, CloseIcon, ProjectIcon } from '../../components/icons/Icons';
import type { Organization, Project, ProjectModule, ProjectStatus } from '../../types';

interface StagedModule {
  name: string;
  version?: string;
  description?: string;
}

export interface ProjectsPageProps {
  readOnly?: boolean;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ readOnly = false }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Errors & notifications
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Create Project Modal States ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [description, setDescription] = useState('');
  const [stagedModules, setStagedModules] = useState<StagedModule[]>([]);
  const [stagedModName, setStagedModName] = useState('');
  const [stagedModVersion, setStagedModVersion] = useState('v1.0');
  const [stagedModDesc, setStagedModDesc] = useState('');
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Manage Modules Modal States ---
  const [selectedProjectForModules, setSelectedProjectForModules] = useState<Project | null>(null);
  const [isManageModulesModalOpen, setIsManageModulesModalOpen] = useState(false);
  const [projectModules, setProjectModules] = useState<ProjectModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [modulesModalError, setModulesModalError] = useState<{ message: string; details?: string[] } | null>(null);

  // Add new module directly to existing project
  const [directModName, setDirectModName] = useState('');
  const [directModVersion, setDirectModVersion] = useState('v1.0');
  const [directModDesc, setDirectModDesc] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  // Edit existing module states
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModName, setEditModName] = useState('');
  const [editModVersion, setEditModVersion] = useState('v1.0');
  const [editModDesc, setEditModDesc] = useState('');
  const [editModEnabled, setEditModEnabled] = useState(true);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);

  // Deletion confirm states
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [moduleToRemove, setModuleToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingModule, setIsRemovingModule] = useState(false);

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

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [page, pageSize, searchTerm, selectedOrgId]);

  // --- Handlers for Create Project & Staged Modules ---

  const handleOpenCreateModal = () => {
    setName('');
    setOrgId(organizations[0]?.id || '');
    setDescription('');
    setStagedModules([]);
    setStagedModName('');
    setStagedModVersion('v1.0');
    setStagedModDesc('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleAddStagedModule = () => {
    const trimmedName = stagedModName.trim();
    if (!trimmedName) return;

    if (stagedModules.some((m) => m.name.toLowerCase() === trimmedName.toLowerCase())) {
      setFormError({ message: `A module named "${trimmedName}" is already added to this project list.` });
      return;
    }

    setStagedModules((prev) => [
      ...prev,
      {
        name: trimmedName,
        version: stagedModVersion.trim() || 'v1.0',
        description: stagedModDesc.trim() || undefined,
      },
    ]);

    setStagedModName('');
    setStagedModVersion('v1.0');
    setStagedModDesc('');
    setFormError(null);
  };

  const handleRemoveStagedModule = (index: number) => {
    setStagedModules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !orgId) {
      setFormError({ message: 'Project name and client organization are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await projectsApi.createProject({
        name: name.trim(),
        organizationId: orgId,
        description: description.trim() || undefined,
        modules: stagedModules.length > 0 ? stagedModules : undefined,
      });

      setSuccessMessage(
        stagedModules.length > 0
          ? `Project "${name.trim()}" and ${stagedModules.length} module(s) created successfully.`
          : `Project "${name.trim()}" created successfully.`
      );
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

  // --- Handlers for Manage Modules Modal ---

  const handleOpenModulesModal = async (project: Project) => {
    setSelectedProjectForModules(project);
    setIsManageModulesModalOpen(true);
    setModulesModalError(null);
    setEditingModuleId(null);
    setDirectModName('');
    setDirectModVersion('v1.0');
    setDirectModDesc('');
    setIsLoadingModules(true);
    try {
      const mods = await projectsApi.getProjectModules(project.id);
      setProjectModules(mods);
    } catch {
      setProjectModules([]);
    } finally {
      setIsLoadingModules(false);
    }
  };

  const handleCreateDirectModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForModules || !directModName.trim()) return;

    setIsAddingModule(true);
    setModulesModalError(null);
    try {
      await projectsApi.createProjectModule(selectedProjectForModules.id, {
        name: directModName.trim(),
        version: directModVersion.trim() || 'v1.0',
        description: directModDesc.trim() || undefined,
        isEnabled: true,
      });

      const updatedMods = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(updatedMods);
      setDirectModName('');
      setDirectModVersion('v1.0');
      setDirectModDesc('');
      setSuccessMessage(`Module added to "${selectedProjectForModules.name}" successfully.`);
      loadProjects();
    } catch (err: any) {
      setModulesModalError({
        message: err.message || 'Failed to add module to project.',
        details: err.errors,
      });
    } finally {
      setIsAddingModule(false);
    }
  };

  const handleStartEditModule = (mod: ProjectModule) => {
    setEditingModuleId(mod.id);
    setEditModName(mod.name || mod.moduleName || '');
    setEditModVersion(mod.version || 'v1.0');
    setEditModDesc(mod.description || mod.customNotes || '');
    setEditModEnabled(mod.isEnabled !== false);
    setModulesModalError(null);
  };

  const handleCancelEditModule = () => {
    setEditingModuleId(null);
  };

  const handleSaveEditModule = async (moduleId: string) => {
    if (!selectedProjectForModules || !editModName.trim()) return;

    setIsUpdatingModule(true);
    setModulesModalError(null);
    try {
      await projectsApi.updateProjectModule(selectedProjectForModules.id, moduleId, {
        name: editModName.trim(),
        version: editModVersion.trim() || 'v1.0',
        description: editModDesc.trim() || undefined,
        isEnabled: editModEnabled,
      });

      const updatedMods = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(updatedMods);
      setEditingModuleId(null);
      setSuccessMessage('Module updated successfully.');
      loadProjects();
    } catch (err: any) {
      setModulesModalError({
        message: err.message || 'Failed to update module.',
        details: err.errors,
      });
    } finally {
      setIsUpdatingModule(false);
    }
  };

  const handleRemoveModule = (pmId: string, modName?: string) => {
    setModuleToRemove({ id: pmId, name: modName || 'Selected Module' });
  };

  const handleConfirmRemoveModule = async () => {
    if (!selectedProjectForModules || !moduleToRemove) return;
    setIsRemovingModule(true);
    try {
      await projectsApi.removeModule(selectedProjectForModules.id, moduleToRemove.id);
      const mods = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(mods);
      setSuccessMessage('Module removed from project.');
      setModuleToRemove(null);
      loadProjects();
    } catch (err: any) {
      setModulesModalError({
        message: err.message || 'Failed to remove module from project.',
        details: err.errors,
      });
    } finally {
      setIsRemovingModule(false);
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      await projectsApi.deleteProject(projectToDelete.id);
      setSuccessMessage(`Project "${projectToDelete.name}" deleted successfully.`);
      setProjectToDelete(null);
      loadProjects();
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to delete project.',
        details: err.errors,
      });
    } finally {
      setIsDeletingProject(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const statusStr = typeof status === 'number' ? (status === 1 ? 'Active' : status === 2 ? 'Maintenance' : 'Completed') : String(status);
    switch (statusStr) {
      case 'Active':
      case '1':
        return <Badge variant="success" dot>Active</Badge>;
      case 'OnHold':
      case '3':
        return <Badge variant="warning" dot>On Hold</Badge>;
      case 'Completed':
      case '4':
        return <Badge variant="purple">Completed</Badge>;
      default:
        return <Badge variant="neutral">{statusStr}</Badge>;
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'PROJECT NAME',
      render: (p) => (
        <div>
          <div className="font-semibold text-dark">{p.name}</div>
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
            className="icon-action-btn primary"
            onClick={() => handleOpenModulesModal(p)}
            title={readOnly ? 'View project modules' : 'Manage project modules'}
          >
            <ModuleIcon size={14} />
          </button>
          {!readOnly && (
            <button
              type="button"
              className="icon-action-btn danger"
              onClick={() => handleDeleteProject(p)}
              title="Delete project"
            >
              <TrashIcon size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="projects-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">
            {readOnly ? 'Customer Solution Projects & Delivery' : 'Projects & Module Architecture'}
          </h2>
          <p className="main-page-subtitle">
            {readOnly
              ? 'Monitor deployed client solution projects, module architecture, and delivery status.'
              : 'Configure client projects and manage their dedicated operational modules.'}
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          autoCloseDuration={4000}
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
          !readOnly ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusIcon size={15} />}
              onClick={handleOpenCreateModal}
            >
              New Project
            </Button>
          ) : undefined
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={projects}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyIcon={<ProjectIcon size={26} />}
          searchTerm={searchTerm}
          emptyTitle={searchTerm ? `No projects matching "${searchTerm}"` : 'No customer projects found'}
          emptyMessage={
            searchTerm
              ? `We couldn't find any projects matching "${searchTerm}". Try checking your spelling or clear your filters.`
              : 'No customer projects found. Click "New Project" to register one.'
          }
          emptyAction={
            !readOnly ? (
              <Button
                size="sm"
                leftIcon={<PlusIcon size={14} />}
                onClick={handleOpenCreateModal}
              >
                New Project
              </Button>
            ) : undefined
          }
          emptySecondaryAction={
            (searchTerm || selectedOrgId) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedOrgId('');
                }}
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* --- 1. Create Project Modal (With Integrated Module Creation) --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Customer Project"
        description="Define project scope, organization, and initialize functional modules at the same time."
        maxWidth="lg"
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
          <div className="user-form-grid">
            <div>
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
            </div>

            <div>
              <Input
                label="Project Name"
                required
                placeholder="e.g. Enterprise Portal"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Description / Scope"
                placeholder="Brief summary of project objectives"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Integrated Module Creation Section */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-dark">
                  Initial Project Modules (Optional)
                </h4>
                <p className="text-xs text-muted">
                  Create functional modules simultaneously with the project.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-surface text-secondary">
                {stagedModules.length} {stagedModules.length === 1 ? 'module' : 'modules'} added
              </span>
            </div>

            {/* Staged Modules List */}
            {stagedModules.length > 0 && (
              <div className="staged-modules-list mb-3">
                {stagedModules.map((mod, idx) => (
                  <div key={idx} className="staged-module-item">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-dark">{mod.name}</span>
                        <span className="role-pill-badge">{mod.version || 'v1.0'}</span>
                      </div>
                      {mod.description && (
                        <p className="text-xs text-muted mt-0.5">{mod.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      onClick={() => handleRemoveStagedModule(idx)}
                      title="Remove module"
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Module Adder */}
            <div className="staged-module-form">
              <div className="user-form-grid mb-2">
                <Input
                  label="Module Name"
                  placeholder="e.g. Billing & Invoicing"
                  value={stagedModName}
                  onChange={(e) => setStagedModName(e.target.value)}
                />
                <Input
                  label="Version"
                  placeholder="v1.0"
                  value={stagedModVersion}
                  onChange={(e) => setStagedModVersion(e.target.value)}
                />
                <Input
                  label="Description (Optional)"
                  placeholder="e.g. Client invoice lifecycle"
                  value={stagedModDesc}
                  onChange={(e) => setStagedModDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<PlusIcon size={14} />}
                  onClick={handleAddStagedModule}
                  disabled={!stagedModName.trim()}
                >
                  Add Module to Project
                </Button>
              </div>
            </div>
          </div>

          <div className="modal-actions-right mt-4">
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
              Create Project {stagedModules.length > 0 && `& ${stagedModules.length} Module(s)`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- 2. Manage Modules Modal --- */}
      <Modal
        isOpen={isManageModulesModalOpen}
        onClose={() => setIsManageModulesModalOpen(false)}
        title={readOnly ? `Project Modules: ${selectedProjectForModules?.name || 'Project'}` : `Manage Modules: ${selectedProjectForModules?.name || 'Project'}`}
        description={
          readOnly
            ? 'View registered solution modules and feature scope for this project.'
            : 'Add, edit, or remove functional modules specifically for this project.'
        }
        maxWidth="lg"
      >
        {modulesModalError && (
          <Alert
            variant="error"
            message={modulesModalError.message}
            details={modulesModalError.details}
            onClose={() => setModulesModalError(null)}
          />
        )}

        <div className="mb-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Active Project Modules ({projectModules.length})
          </h4>

          {isLoadingModules ? (
            <p className="text-xs text-muted">Loading project modules...</p>
          ) : projectModules.length === 0 ? (
            <EmptyState
              compact
              icon={<ModuleIcon size={20} />}
              title="No modules registered"
              description="No modules attached to this project yet. Use the form below to register modules."
            />
          ) : (
            <div className="module-mgmt-list">
              {projectModules.map((pm) => {
                const isEditing = editingModuleId === pm.id;
                const displayName = pm.name || pm.moduleName || 'Unnamed Module';
                const displayDesc = pm.description || pm.customNotes || '';

                if (isEditing) {
                  return (
                    <div key={pm.id} className="module-item-edit-box">
                      <div className="user-form-grid mb-2">
                        <Input
                          label="Module Name"
                          required
                          value={editModName}
                          onChange={(e) => setEditModName(e.target.value)}
                        />
                        <Input
                          label="Version"
                          value={editModVersion}
                          onChange={(e) => setEditModVersion(e.target.value)}
                        />
                        <Input
                          label="Description"
                          value={editModDesc}
                          onChange={(e) => setEditModDesc(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <label className="flex items-center gap-2 text-xs font-medium text-dark cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editModEnabled}
                            onChange={(e) => setEditModEnabled(e.target.checked)}
                          />
                          <span>Module Enabled</span>
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<CloseIcon size={13} />}
                            onClick={handleCancelEditModule}
                            disabled={isUpdatingModule}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckIcon size={13} />}
                            onClick={() => handleSaveEditModule(pm.id)}
                            isLoading={isUpdatingModule}
                            disabled={!editModName.trim()}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={pm.id} className="module-item-card">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-dark">{displayName}</span>
                        <span className="role-pill-badge">{pm.version || 'v1.0'}</span>
                        <Badge variant={pm.isEnabled !== false ? 'success' : 'neutral'} dot>
                          {pm.isEnabled !== false ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {displayDesc && <p className="text-xs text-muted mt-1">{displayDesc}</p>}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="icon-action-btn primary"
                          onClick={() => handleStartEditModule(pm)}
                          title="Edit module"
                        >
                          <EditIcon size={13} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={() => handleRemoveModule(pm.id, displayName)}
                          title="Delete module"
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Module directly to project form */}
        {!readOnly ? (
          <form onSubmit={handleCreateDirectModule} className="border-t pt-3">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
              Create & Add Another Module
            </h4>
            <div className="user-form-grid mb-2">
              <Input
                label="Module Name"
                required
                placeholder="e.g. Reporting Engine"
                value={directModName}
                onChange={(e) => setDirectModName(e.target.value)}
              />
              <Input
                label="Version"
                placeholder="v1.0"
                value={directModVersion}
                onChange={(e) => setDirectModVersion(e.target.value)}
              />
              <Input
                label="Description (Optional)"
                placeholder="Module functionality scope"
                value={directModDesc}
                onChange={(e) => setDirectModDesc(e.target.value)}
              />
            </div>
            <div className="modal-actions-right mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsManageModulesModalOpen(false)}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<PlusIcon size={14} />}
                disabled={!directModName.trim() || isAddingModule}
                isLoading={isAddingModule}
              >
                Add Module
              </Button>
            </div>
          </form>
        ) : (
          <div className="modal-actions-right border-t pt-3 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManageModulesModalOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      {/* --- Delete Project Confirmation Dialog --- */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDeleteProject}
        title="Delete Project"
        description={
          projectToDelete ? (
            <div>
              Are you sure you want to delete project <strong>"{projectToDelete.name}"</strong>?
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                This will also remove all configured project modules, member assignments, and associated schedule items.
              </p>
            </div>
          ) : ''
        }
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingProject}
      />

      {/* --- Remove Module Confirmation Dialog --- */}
      <ConfirmDialog
        isOpen={!!moduleToRemove}
        onClose={() => setModuleToRemove(null)}
        onConfirm={handleConfirmRemoveModule}
        title="Remove Module"
        description={
          moduleToRemove ? (
            <div>
              Are you sure you want to remove module <strong>"{moduleToRemove.name}"</strong> from this project?
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Active assignments linked to this module will be affected.
              </p>
            </div>
          ) : ''
        }
        confirmText="Remove Module"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRemovingModule}
      />
    </div>
  );
};
