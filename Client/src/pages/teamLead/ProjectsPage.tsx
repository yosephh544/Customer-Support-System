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
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [page, pageSize, searchTerm, selectedOrgId]);

  useEffect(() => {
    const fetchOrgsAndModules = async () => {
      try {
        const [orgsRes, modsRes] = await Promise.all([
          organizationsApi.getOrganizations({ pageSize: 100 }),
          modulesApi.getMasterModules({ pageSize: 100 }),
        ]);
        setOrganizations(orgsRes.items || []);
        setMasterModules(modsRes.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrgsAndModules();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !orgId) {
      setFormError('Project name and organization are required.');
      return;
    }

    try {
      await projectsApi.createProject({
        organizationId: orgId,
        name: name.trim(),
        code: code.trim(),
        description: description.trim(),
        status: 1, // Active
      });
      setIsCreateModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      loadProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    }
  };

  const handleOpenModules = async (project: Project) => {
    setSelectedProjectForModules(project);
    try {
      const modules = await projectsApi.getProjectModules(project.id);
      setProjectModules(modules);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForModules || !selectedModuleId) return;

    try {
      await projectsApi.assignModule(selectedProjectForModules.id, {
        masterModuleId: selectedModuleId,
        version: moduleVersion.trim(),
        isEnabled: true,
      });
      setIsAssignModuleModalOpen(false);
      setSelectedModuleId('');
      // refresh module list
      const modules = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(modules);
      loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to assign module.');
    }
  };

  const handleRemoveModule = async (moduleId: string) => {
    if (!selectedProjectForModules) return;
    if (!confirm('Are you sure you want to remove this module from the project?')) return;

    try {
      await projectsApi.removeModule(selectedProjectForModules.id, moduleId);
      const modules = await projectsApi.getProjectModules(selectedProjectForModules.id);
      setProjectModules(modules);
      loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to remove module.');
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'PROJECT NAME',
      render: (p) => (
        <div>
          <div className="font-semibold text-dark">{p.name}</div>
          <div className="text-xs text-muted">{p.code || 'NO-CODE'}</div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      header: 'ORGANIZATION',
      render: (p) => <span className="font-medium">{p.organizationName}</span>,
    },
    {
      key: 'modules',
      header: 'CONFIGURED MODULES',
      render: (p) => (
        <button
          type="button"
          className="btn-module-pill"
          onClick={() => handleOpenModules(p)}
        >
          <ModuleIcon size={14} />
          <span>{p.moduleCount} modules</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (p) => <Badge variant={p.status === 1 ? 'success' : 'neutral'}>{p.statusName}</Badge>,
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (p) => (
        <div className="action-buttons-cell">
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => handleOpenModules(p)}
            title="Manage Modules"
          >
            <ModuleIcon size={16} />
          </button>
          <button
            type="button"
            className="icon-action-btn danger"
            onClick={async () => {
              if (confirm(`Delete project "${p.name}"?`)) {
                await projectsApi.deleteProject(p.id);
                loadProjects();
              }
            }}
            title="Delete Project"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="projects-page">
      <div className="page-header-row">
        <div>
          <h2 className="section-title">Projects & System Modules</h2>
          <p className="section-subtitle">
            Configure client projects and assign active modules under each project.
          </p>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search projects or codes..."
        actionButton={
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={18} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create project
          </Button>
        }
      >
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="filter-select"
        >
          <option value="">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </FilterBar>

      <div className="content-card">
        <Table
          columns={columns}
          data={projects}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyMessage="No projects created yet. Click 'Create project' above to add your first one."
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
        title="Create New Project"
        description="Add a client project under an existing customer organization."
      >
        {formError && <div className="form-error-alert">{formError}</div>}
        <form onSubmit={handleCreateProject}>
          <Select
            label="Organization"
            required
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="Select organization..."
          />
          <Input
            label="Project Name"
            required
            placeholder="e.g. Core Banking Integration"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Project Code"
            placeholder="e.g. PRJ-CBI-01"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Brief project scope or overview"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Project Modules Modal */}
      <Modal
        isOpen={!!selectedProjectForModules}
        onClose={() => setSelectedProjectForModules(null)}
        title={`Modules in ${selectedProjectForModules?.name || 'Project'}`}
        description="Assign master modules and maintain project-specific versioning."
        maxWidth="lg"
      >
        <div className="modules-management-pane">
          <div className="modal-subheading-row">
            <h4>Assigned Modules ({projectModules.length})</h4>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<PlusIcon size={14} />}
              onClick={() => setIsAssignModuleModalOpen(true)}
            >
              Assign module
            </Button>
          </div>

          {projectModules.length === 0 ? (
            <p className="text-muted text-sm py-4">
              No modules assigned to this project yet. Click &quot;Assign module&quot; to link one.
            </p>
          ) : (
            <div className="table-responsive mt-3">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>MODULE</th>
                    <th>CODE</th>
                    <th>VERSION</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>REMOVE</th>
                  </tr>
                </thead>
                <tbody>
                  {projectModules.map((pm) => (
                    <tr key={pm.id}>
                      <td className="font-semibold">{pm.moduleName}</td>
                      <td>{pm.moduleCode}</td>
                      <td>
                        <span className="badge badge-neutral text-xs">
                          {pm.version || 'v1.0'}
                        </span>
                      </td>
                      <td>
                        <Badge variant={pm.isEnabled ? 'success' : 'neutral'} size="sm">
                          {pm.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={() => handleRemoveModule(pm.id)}
                          title="Unassign module"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Sub-modal: Assign Module */}
      <Modal
        isOpen={isAssignModuleModalOpen}
        onClose={() => setIsAssignModuleModalOpen(false)}
        title="Assign Module to Project"
        description="Choose a module from the master catalog."
      >
        <form onSubmit={handleAssignModule}>
          <Select
            label="Master Module"
            required
            options={masterModules.map((m) => ({
              value: m.id,
              label: `${m.name} (${m.code})`,
            }))}
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            placeholder="Select a module..."
          />
          <Input
            label="Module Version / Notes"
            placeholder="e.g. v2.4.1"
            value={moduleVersion}
            onChange={(e) => setModuleVersion(e.target.value)}
          />
          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModuleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Assign Module
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
