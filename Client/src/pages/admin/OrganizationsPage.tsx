import React, { useEffect, useState } from 'react';
import { organizationsApi } from '../../api/organizationsApi';
import { Button } from '../../components/common/Button';
import { FilterBar } from '../../components/common/FilterBar';
import { Table } from '../../components/common/Table';
import type { Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { PlusIcon, EditIcon, TrashIcon, BuildingIcon } from '../../components/icons/Icons';
import type { Organization } from '../../types';

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const res = await organizationsApi.getOrganizations({
        pageNumber: page,
        pageSize,
        searchTerm,
      });
      setOrganizations(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error(err);
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
      setFormError('Organization name is required.');
      return;
    }

    try {
      if (editingOrg) {
        await organizationsApi.updateOrganization(editingOrg.id, {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          isActive,
        });
      } else {
        await organizationsApi.createOrganization({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          isActive,
        });
      }
      setIsModalOpen(false);
      loadOrganizations();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete organization "${org.name}"?`)) return;
    try {
      await organizationsApi.deleteOrganization(org.id);
      loadOrganizations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete organization.');
    }
  };

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: 'ORGANIZATION',
      render: (o) => (
        <div className="agent-cell">
          <span className="agent-avatar"><BuildingIcon size={16} /></span>
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
            <EditIcon size={16} />
          </button>
          <button
            type="button"
            className="icon-action-btn danger"
            onClick={() => handleDelete(o)}
            title="Delete Organization"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="organizations-page">
      <div className="page-header-row">
        <div>
          <h2 className="section-title">Customer Organizations</h2>
          <p className="section-subtitle">
            Manage customer tenant companies and organizational hierarchies.
          </p>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, code, or contact..."
        actionButton={
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={18} />}
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
          emptyMessage="No customer organizations registered yet. Click 'Add Organization' to create one."
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
        {formError && <div className="form-error-alert">{formError}</div>}
        <form onSubmit={handleSubmit}>
          {!editingOrg && (
            <div className="security-policy-pill mb-4" style={{ display: 'inline-flex' }}>
              <span>⚙️ Organization code will be automatically generated from the company name (e.g. ORG-NWL).</span>
            </div>
          )}

          <Input
            label="Organization Name"
            required
            placeholder="e.g. Northwind Logistics"
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
            placeholder="ops@northwind.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="+1 (555) 019-2834"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Physical Address"
            placeholder="124 Market Street, Seattle, WA"
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
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingOrg ? 'Save Changes' : 'Register Organization'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
