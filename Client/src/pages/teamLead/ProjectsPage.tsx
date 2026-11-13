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
import { PlusIcon, EditIcon, TrashIcon, ModuleIcon, CheckIcon, CloseIcon, ProjectIcon, UserIcon, PhoneIcon } from '../../components/icons/Icons';
import type { Organization, Project, ProjectModule, ProjectStatus } from '../../types';
import { validatePhone } from '../../utils/validation';

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
  // Project primary & optional secondary contact
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [secondaryContactPersonName, setSecondaryContactPersonName] = useState('');
  const [secondaryContactPersonPhone, setSecondaryContactPersonPhone] = useState('');
  const [contactPhoneError, setContactPhoneError] = useState<string | null>(null);
  const [secondaryContactPhoneError, setSecondaryContactPhoneError] = useState<string | null>(null);
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
  const [directContactName, setDirectContactName] = useState('');
  const [directContactPhone, setDirectContactPhone] = useState('');
  const [directSecondaryContactName, setDirectSecondaryContactName] = useState('');
  const [directSecondaryContactPhone, setDirectSecondaryContactPhone] = useState('');
  const [directPhoneError, setDirectPhoneError] = useState<string | null>(null);
  const [directSecondaryPhoneError, setDirectSecondaryPhoneError] = useState<string | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);

  // Edit existing module states
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModName, setEditModName] = useState('');
  const [editModVersion, setEditModVersion] = useState('v1.0');
  const [editModDesc, setEditModDesc] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editSecondaryContactName, setEditSecondaryContactName] = useState('');
  const [editSecondaryContactPhone, setEditSecondaryContactPhone] = useState('');
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);
  const [editSecondaryPhoneError, setEditSecondaryPhoneError] = useState<string | null>(null);
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

  // --- Handlers for Create Project ---

  const handleOpenCreateModal = () => {
    setName('');
    setOrgId(organizations[0]?.id || '');
    setDescription('');
    setContactPersonName('');
    setContactPersonPhone('');
    setSecondaryContactPersonName('');
    setSecondaryContactPersonPhone('');
    setContactPhoneError(null);
    setSecondaryContactPhoneError(null);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setContactPhoneError(null);
    setSecondaryContactPhoneError(null);

    if (!name.trim() || !orgId) {
      setFormError({ message: 'Project name and client organization are required.' });
      return;
    }

    // Validate contact phone numbers
    if (contactPersonPhone.trim()) {
      const phoneErr = validatePhone(contactPersonPhone.trim(), false);
      if (phoneErr) {
        setContactPhoneError(phoneErr);
        setFormError({ message: phoneErr });
        return;
      }
    }

    if (secondaryContactPersonPhone.trim()) {
      const secPhoneErr = validatePhone(secondaryContactPersonPhone.trim(), false);
      if (secPhoneErr) {
        setSecondaryContactPhoneError(secPhoneErr);
        setFormError({ message: secPhoneErr });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await projectsApi.createProject({
        name: name.trim(),
        organizationId: orgId,
        description: description.trim() || undefined,
        contactPersonName: contactPersonName.trim() || undefined,
        contactPersonPhone: contactPersonPhone.trim() || undefined,
        secondaryContactPersonName: secondaryContactPersonName.trim() || undefined,
        secondaryContactPersonPhone: secondaryContactPersonPhone.trim() || undefined,
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

  // --- Handlers for Manage Modules Modal ---

  const handleOpenModulesModal = async (project: Project) => {
    setSelectedProjectForModules(project);
    setIsManageModulesModalOpen(true);
    setModulesModalError(null);
    setEditingModuleId(null);
    setDirectModName('');
    setDirectModVersion('v1.0');
    setDirectModDesc('');
    setDirectContactName('');
    setDirectContactPhone('');
    setDirectSecondaryContactName('');
    setDirectSecondaryContactPhone('');
    setDirectPhoneError(null);
    setDirectSecondaryPhoneError(null);
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

    setModulesModalError(null);
    setDirectPhoneError(null);
    setDirectSecondaryPhoneError(null);

    // Validate direct module contact phone numbers
    if (directContactPhone.trim()) {
      const phoneErr = validatePhone(directContactPhone.trim(), false);
      if (phoneErr) {
        setDirectPhoneError(phoneErr);
        setModulesModalError({ message: phoneErr });
        return;
      }
    }

    if (directSecondaryContactPhone.trim()) {
      const secPhoneErr = validatePhone(directSecondaryContactPhone.trim(), false);
      if (secPhoneErr) {
        setDirectSecondaryPhoneError(secPhoneErr);
        setModulesModalError({ message: secPhoneErr });
        return;
      }
    }

    setIsAddingModule(true);
    try {
      await projectsApi.createProjectModule(selectedProjectForModules.id, {
        name: directModName.trim(),
        version: directModVersion.trim() || 'v1.0',
        description: directModDesc.trim() || undefined,
        isEnabled: true,
        contactPersonName: directContactName.trim() || undefined,
        contactPersonPhone: directContactPhone.trim() || undefined,
        secondaryContactPersonName: directSecondaryContactName.trim() || undefined,
        secondaryContactPersonPhone: directSecondaryContactPhone.trim() || undefined,
      });

      const updatedMods = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(updatedMods);
      setDirectModName('');
      setDirectModVersion('v1.0');
      setDirectModDesc('');
      setDirectContactName('');
      setDirectContactPhone('');
      setDirectSecondaryContactName('');
      setDirectSecondaryContactPhone('');
      setDirectPhoneError(null);
      setDirectSecondaryPhoneError(null);
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
    setEditContactName(mod.contactPersonName || '');
    setEditContactPhone(mod.contactPersonPhone || '');
    setEditSecondaryContactName(mod.secondaryContactPersonName || '');
    setEditSecondaryContactPhone(mod.secondaryContactPersonPhone || '');
    setEditPhoneError(null);
    setEditSecondaryPhoneError(null);
    setModulesModalError(null);
  };

  const handleCancelEditModule = () => {
    setEditingModuleId(null);
  };

  const handleSaveEditModule = async (moduleId: string) => {
    if (!selectedProjectForModules || !editModName.trim()) return;

    setModulesModalError(null);
    setEditPhoneError(null);
    setEditSecondaryPhoneError(null);

    // Validate edit module contact phone numbers
    if (editContactPhone.trim()) {
      const phoneErr = validatePhone(editContactPhone.trim(), false);
      if (phoneErr) {
        setEditPhoneError(phoneErr);
        setModulesModalError({ message: phoneErr });
        return;
      }
    }

    if (editSecondaryContactPhone.trim()) {
      const secPhoneErr = validatePhone(editSecondaryContactPhone.trim(), false);
      if (secPhoneErr) {
        setEditSecondaryPhoneError(secPhoneErr);
        setModulesModalError({ message: secPhoneErr });
        return;
      }
    }

    setIsUpdatingModule(true);
    try {
      await projectsApi.updateProjectModule(selectedProjectForModules.id, moduleId, {
        name: editModName.trim(),
        version: editModVersion.trim() || 'v1.0',
        description: editModDesc.trim() || undefined,
        isEnabled: editModEnabled,
        contactPersonName: editContactName.trim() || undefined,
        contactPersonPhone: editContactPhone.trim() || undefined,
        secondaryContactPersonName: editSecondaryContactName.trim() || undefined,
        secondaryContactPersonPhone: editSecondaryContactPhone.trim() || undefined,
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
      key: 'contact',
      header: 'PRIMARY CONTACT',
      render: (p) => (
        <div>
          {p.contactPersonName ? (
            <div>
              <div className="font-semibold text-xs text-dark flex items-center gap-1.5">
                <UserIcon size={13} className="text-primary flex-shrink-0" />
                <span>{p.contactPersonName}</span>
              </div>
              {p.contactPersonPhone && (
                <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5 ml-4">
                  <PhoneIcon size={11} className="flex-shrink-0" />
                  <span>{p.contactPersonPhone}</span>
                </div>
              )}
              {p.secondaryContactPersonName && (
                <div className="text-[11px] text-muted flex items-center gap-1 mt-1 pt-1 border-t border-[var(--border-subtle)]">
                  <span className="badge badge-neutral text-[10px] py-0 px-1">2nd</span>
                  <span>{p.secondaryContactPersonName}</span>
                  {p.secondaryContactPersonPhone && <span>({p.secondaryContactPersonPhone})</span>}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted text-xs italic">No contact assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'modules',
      header: 'PROJECT MODULES',
      render: (p) => (
        <button
          type="button"
          className="btn-module-pill"
          onClick={() => handleOpenModulesModal(p)}
          title={readOnly ? 'View modules for this project' : 'Manage modules for this project'}
        >
          <ModuleIcon size={13} />
          <span>{p.moduleCount || 0} {p.moduleCount === 1 ? 'module' : 'modules'}</span>
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
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ModuleIcon size={13} />}
            onClick={() => handleOpenModulesModal(p)}
            title={readOnly ? 'View project modules' : 'Manage project modules'}
          >
            Manage Modules
          </Button>
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

      {/* --- 1. Create Project Modal --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Customer Project"
        description="Define project scope, organization, and primary contact information."
        maxWidth="md"
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

          {/* Project Contact Persons Section */}
          <div className="mt-3 pt-3 border-t">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark mb-1">
              Project Contact Persons
            </h4>
            <p className="text-xs text-muted mb-2">
              Primary and optional secondary contact person for weekly touchpoint communication.
            </p>
            <div className="user-form-grid mb-2">
              <Input
                label="Primary Contact Name"
                placeholder="e.g. Michael Scott"
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
              />
              <Input
                label="Primary Contact Phone"
                type="tel"
                placeholder="e.g. +1 555-0144 or 0912345678"
                value={contactPersonPhone}
                error={contactPhoneError || undefined}
                onChange={(e) => {
                  setContactPersonPhone(e.target.value);
                  if (contactPhoneError) setContactPhoneError(null);
                }}
                helperText="Digits only, min 7 digits"
              />
            </div>
            <div className="user-form-grid">
              <Input
                label="Secondary Contact Name (Optional)"
                placeholder="e.g. Jim Halpert"
                value={secondaryContactPersonName}
                onChange={(e) => setSecondaryContactPersonName(e.target.value)}
              />
              <Input
                label="Secondary Contact Phone (Optional)"
                type="tel"
                placeholder="e.g. +1 555-0145 or 0912345679"
                value={secondaryContactPersonPhone}
                error={secondaryContactPhoneError || undefined}
                onChange={(e) => {
                  setSecondaryContactPersonPhone(e.target.value);
                  if (secondaryContactPhoneError) setSecondaryContactPhoneError(null);
                }}
                helperText="Digits only, min 7 digits"
              />
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
              Create Project
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
                      <div className="user-form-grid mb-2 pt-2 border-t border-[var(--border-subtle)]">
                        <Input
                          label="Primary Contact Name (Optional)"
                          placeholder="e.g. Dwight Schrute"
                          value={editContactName}
                          onChange={(e) => setEditContactName(e.target.value)}
                        />
                        <Input
                          label="Primary Contact Phone (Optional)"
                          type="tel"
                          placeholder="e.g. +1 555-0177 or 0912345678"
                          value={editContactPhone}
                          error={editPhoneError || undefined}
                          onChange={(e) => {
                            setEditContactPhone(e.target.value);
                            if (editPhoneError) setEditPhoneError(null);
                          }}
                          helperText="Digits only, min 7 digits"
                        />
                        <Input
                          label="Secondary Contact Name (Optional)"
                          placeholder="e.g. Pam Beesly"
                          value={editSecondaryContactName}
                          onChange={(e) => setEditSecondaryContactName(e.target.value)}
                        />
                        <Input
                          label="Secondary Contact Phone (Optional)"
                          type="tel"
                          placeholder="e.g. +1 555-0178 or 0912345679"
                          value={editSecondaryContactPhone}
                          error={editSecondaryPhoneError || undefined}
                          onChange={(e) => {
                            setEditSecondaryContactPhone(e.target.value);
                            if (editSecondaryPhoneError) setEditSecondaryPhoneError(null);
                          }}
                          helperText="Digits only, min 7 digits"
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
                      {(pm.contactPersonName || pm.secondaryContactPersonName) && (
                        <div className="text-[11px] text-muted mt-1 flex flex-wrap items-center gap-3">
                          {pm.contactPersonName && (
                            <span className="flex items-center gap-1">
                              <UserIcon size={11} className="text-primary" />
                              <strong>Contact:</strong> {pm.contactPersonName} {pm.contactPersonPhone && `(${pm.contactPersonPhone})`}
                            </span>
                          )}
                          {pm.secondaryContactPersonName && (
                            <span className="flex items-center gap-1">
                              <span className="badge badge-neutral text-[9px] py-0 px-1">2nd</span>
                              {pm.secondaryContactPersonName} {pm.secondaryContactPersonPhone && `(${pm.secondaryContactPersonPhone})`}
                            </span>
                          )}
                        </div>
                      )}
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
            <div className="user-form-grid mb-2">
              <Input
                label="Module Contact Name (Optional)"
                placeholder="e.g. Stanley Hudson"
                value={directContactName}
                onChange={(e) => setDirectContactName(e.target.value)}
              />
              <Input
                label="Module Contact Phone (Optional)"
                type="tel"
                placeholder="e.g. +1 555-0188 or 0912345678"
                value={directContactPhone}
                error={directPhoneError || undefined}
                onChange={(e) => {
                  setDirectContactPhone(e.target.value);
                  if (directPhoneError) setDirectPhoneError(null);
                }}
                helperText="Digits only, min 7 digits"
              />
              <Input
                label="Secondary Contact Name (Optional)"
                placeholder="e.g. Phyllis Vance"
                value={directSecondaryContactName}
                onChange={(e) => setDirectSecondaryContactName(e.target.value)}
              />
              <Input
                label="Secondary Contact Phone (Optional)"
                type="tel"
                placeholder="e.g. +1 555-0189 or 0912345679"
                value={directSecondaryContactPhone}
                error={directSecondaryPhoneError || undefined}
                onChange={(e) => {
                  setDirectSecondaryContactPhone(e.target.value);
                  if (directSecondaryPhoneError) setDirectSecondaryPhoneError(null);
                }}
                helperText="Digits only, min 7 digits"
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
