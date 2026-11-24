import React, { useState, useEffect } from 'react';
import { ticketsApi } from '../../api/ticketsApi';
import { organizationsApi } from '../../api/organizationsApi';
import { projectsApi } from '../../api/projectsApi';
import { usersApi } from '../../api/usersApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import type {
  Organization,
  Project,
  ProjectModule,
  TicketCategory,
  FailureType,
  TicketPriority,
  SupportChannel,
  UserProfile,
} from '../../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('SoftwareBug');
  const [failureType, setFailureType] = useState<FailureType>('MinorBug');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [channel, setChannel] = useState<SupportChannel>('WebPortal');
  const [assignedToUserId, setAssignedToUserId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [orgRes, userRes] = await Promise.all([
        organizationsApi.getOrganizations({ pageSize: 100 }),
        usersApi.getUsers({ pageSize: 100 }),
      ]);
      setOrganizations(orgRes.items || []);
      setSpecialists(userRes.items || []);
    } catch {
      // Non-critical
    }
  };

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedProjectId('');
    setSelectedModuleId('');
    setProjects([]);
    setModules([]);

    if (orgId) {
      try {
        const projRes = await projectsApi.getProjects({ organizationId: orgId, pageSize: 50 });
        setProjects(projRes.items || []);
      } catch {
        // Non-critical
      }
    }
  };

  const handleProjectChange = async (projId: string) => {
    setSelectedProjectId(projId);
    setSelectedModuleId('');
    setModules([]);

    if (projId) {
      try {
        const p = await projectsApi.getProjectById(projId);
        setModules(p.modules || []);
      } catch {
        // Non-critical
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !selectedProjectId || !title.trim() || !description.trim()) {
      setError('Please fill in all required fields (Organization, Project, Title, Description).');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await ticketsApi.createTicket({
        organizationId: selectedOrgId,
        projectId: selectedProjectId,
        projectModuleId: selectedModuleId || undefined,
        title: title.trim(),
        description: description.trim(),
        category,
        failureType,
        priority,
        channel,
        assignedToUserId: assignedToUserId || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedOrgId('');
      setSelectedProjectId('');
      setSelectedModuleId('');
      setAssignedToUserId('');
      onTicketCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create support ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log New Reactive Support Ticket"
      description="Initiates Ethiopian working-hours SLA tracking and coverage validation."
      size="lg"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <Alert variant="danger" message={error} />}

        {/* Scope Hierarchy: Organization & Project */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Customer Organization *</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={selectedOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              required
            >
              <option value="">-- Select Organization --</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Project *</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={!selectedOrgId}
              required
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Module selection (if available) */}
        {modules.length > 0 && (
          <div>
            <label className="form-label text-xs">Module (Optional)</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
            >
              <option value="">-- Project-wide / All Modules --</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="form-label text-xs">Ticket Title / Summary *</label>
          <input
            type="text"
            className="form-input w-full"
            placeholder="e.g. Database connection timeout during peak hours"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem' }}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="form-label text-xs">Detailed Problem Description *</label>
          <textarea
            className="form-input w-full"
            rows={4}
            placeholder="Describe the failure, steps to reproduce, impacted users, and environment details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
            required
          />
        </div>

        {/* Classification & SLA Inputs: Category, Priority, Channel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Category</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
            >
              <option value="SoftwareBug">Software Bug</option>
              <option value="HardwareIssue">Hardware Issue</option>
              <option value="NetworkInfrastructure">Network / Infrastructure</option>
              <option value="TrainingRequest">Training Request</option>
              <option value="BillingInquiry">Billing Inquiry</option>
              <option value="SystemConfiguration">System Configuration</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Priority (Sets SLA Target)</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              <option value="Low">Low (48h Ethiopian SLA)</option>
              <option value="Medium">Medium (24h Ethiopian SLA)</option>
              <option value="High">High (8h Ethiopian SLA)</option>
              <option value="Blocker">Blocker (4h Urgent SLA)</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Channel</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={channel}
              onChange={(e) => setChannel(e.target.value as SupportChannel)}
            >
              <option value="WebPortal">Web Portal</option>
              <option value="Phone">Phone Support</option>
              <option value="Email">Email Desk</option>
              <option value="FieldVisit">Field Visit</option>
            </select>
          </div>
        </div>

        {/* Assign Specialist */}
        <div>
          <label className="form-label text-xs">Assign Specialist (Optional)</label>
          <select
            className="form-input w-full"
            style={{ width: '100%', fontSize: '0.85rem' }}
            value={assignedToUserId}
            onChange={(e) => setAssignedToUserId(e.target.value)}
          >
            <option value="">-- Unassigned (Triage Queue) --</option>
            {specialists.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>
            ))}
          </select>
        </div>

        {/* Form Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Create Ticket & Start SLA
          </Button>
        </div>
      </form>
    </Modal>
  );
};
