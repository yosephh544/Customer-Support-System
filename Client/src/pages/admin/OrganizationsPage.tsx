import React, { useEffect, useState } from 'react';
import { organizationsApi } from '../../api/organizationsApi';
import { Button } from '../../components/common/Button';
import { FilterBar } from '../../components/common/FilterBar';
import { Table } from '../../components/common/Table';
import type { Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { PlusIcon, EditIcon, TrashIcon, BuildingIcon } from '../../components/icons/Icons';
import type { Organization } from '../../types';

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Notifications & error states
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<{ message: string; details?: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm dialog
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadOrganizations = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const res = await organizationsApi.getOrganizations({
        pageNumber: page,
        pageSize,
        searchTerm,
      });
      setOrganizations(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load customer organizations.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [page, pageSize, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingOrg(null);
    setName('');
    setCode('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setCode(org.code);
    setEmail(org.email || '');
    setPhone(org.phone || '');
    setAddress(org.address || '');
    setIsActive(org.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError({ message: 'Organization name is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingOrg) {
        await organizationsApi.updateOrganization(editingOrg.id, {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          isActive,
        });
        setSuccessMessage(`Organization "${name.trim()}" updated successfully.`);
      } else {
        await organizationsApi.createOrganization({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          isActive,
        });
        setSuccessMessage(`Organization "${name.trim()}" registered successfully.`);
      }
      setIsModalOpen(false);
      loadOrganizations();
    } catch (err: any) {
      setFormError({
        message: err.message || 'Failed to save organization.',
        details: err.errors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (org: Organization) => {
    setOrgToDelete(org);
  };

  const handleConfirmDelete = async () => {
    if (!orgToDelete) return;
    setIsDeleting(true);
    try {
      await organizationsApi.deleteOrganization(orgToDelete.id);
      setSuccessMessage(`Organization "${orgToDelete.name}" deleted successfully.`);
      setOrgToDelete(null);
      loadOrganizations();
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to delete organization.',
        details: err.errors,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: 'ORGANIZATION',
      render: (o) => (
        <div className="agent-cell">
          <span className="agent-avatar"><BuildingIcon size={14} /></span>
          <div>
            <div className="font-semibold text-dark">{o.name}</div>
            <div className="text-xs text-muted">CODE: {o.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'CONTACT',
      render: (o) => (
        <div>
          <div className="text-sm">{o.email || '—'}</div>
          <div className="text-xs text-muted">{o.phone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'projectCount',
      header: 'PROJECTS',
      render: (o) => (
        <Badge variant="purple" size="sm">
          {o.projectCount} projects
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'STATUS',
      render: (o) => (
        <Badge variant={o.isActive ? 'success' : 'neutral'} dot>
          {o.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (o) => (
        <div className="action-buttons-cell">
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => handleOpenEditModal(o)}
            title="Edit Organization"
          >
            <EditIcon size={14} />
          </button>
          <button
            type="button"
            className="icon-action-btn danger"
            onClick={() => handleDelete(o)}
            title="Delete Organization"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="organizations-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">Customer Organizations</h2>
          <p className="main-page-subtitle">
            Manage customer tenant companies and organizational hierarchies.
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
            <Button size="sm" variant="outline" onClick={loadOrganizations}>
              Retry Connection
            </Button>
          }
        />
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actionButton={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon size={15} />}
            onClick={handleOpenCreateModal}
          >
            Add Organization
          </Button>
        }
      />

      <div className="content-card">
        <Table
          columns={columns}
          data={organizations}
          keyExtractor={(o) => o.id}
          isLoading={isLoading}
          emptyIcon={<BuildingIcon size={26} />}
          emptyTitle="No organizations found"
          emptyMessage="No customer organizations registered yet. Add an organization to start onboarding projects and support contracts."
          emptyAction={
            <Button
              size="sm"
              leftIcon={<PlusIcon size={14} />}
              onClick={handleOpenCreateModal}
            >
              Add Organization
            </Button>
          }
          emptySecondaryAction={
            searchTerm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
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

      {/* Create / Edit Organization Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrg ? 'Edit Organization' : 'Register New Organization'}
        description={
          editingOrg
            ? 'Update customer company information and settings.'
            : 'Enter company details; the organization code will be generated automatically.'
        }
      >
        {formError && (
          <Alert
            variant="error"
            message={formError.message}
            details={formError.details}
            onClose={() => setFormError(null)}
          />
        )}

        <form onSubmit={handleSubmit}>
          {!editingOrg && (
            <div className="security-policy-pill mb-3" style={{ display: 'inline-flex' }}>
              <span>⚙️ Code is generated automatically from name (e.g. ORG-NWL).</span>
            </div>
          )}

          <Input
            label="Organization Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {editingOrg && (
            <Input
              label="Organization Code (System Generated)"
              value={code}
              readOnly
              disabled
              helperText="Unique code generated automatically by the system (View-only)."
            />
          )}

          <Input
            label="Contact Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Physical Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {editingOrg && (
            <div className="form-group">
              <label className="checkbox-label mt-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Organization is Active</span>
              </label>
            </div>
          )}
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
              {editingOrg ? 'Save Changes' : 'Register Organization'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Delete Organization Confirmation Dialog --- */}
      <ConfirmDialog
        isOpen={!!orgToDelete}
        onClose={() => setOrgToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Organization"
        description={
          orgToDelete ? (
            <div>
              Are you sure you want to delete organization <strong>"{orgToDelete.name}"</strong>?
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                This will remove its associations with customer projects and support touchpoints.
              </p>
            </div>
          ) : ''
        }
        confirmText="Delete Organization"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
