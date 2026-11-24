import React, { useState } from 'react';
import { portalApi } from '../../api/portalApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import type {
  PortalProjectSummary,
  TicketCategory,
  TicketPriority,
  FailureType,
} from '../../types';

interface GuidedTicketWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: PortalProjectSummary[];
  onTicketCreated: () => void;
}

export const GuidedTicketWizardModal: React.FC<GuidedTicketWizardModalProps> = ({
  isOpen,
  onClose,
  projects,
  onTicketCreated,
}) => {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('SoftwareBug');
  const [failureType, setFailureType] = useState<FailureType>('MinorBug');
  const [priority, setPriority] = useState<TicketPriority>('Medium');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === projectId) || projects[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project to proceed.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a descriptive summary for the issue.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide details describing what happened.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await portalApi.submitTicket({
        projectId,
        title: title.trim(),
        description: description.trim(),
        category,
        failureType,
        priority,
      });

      setTitle('');
      setDescription('');
      onTicketCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to submit your support ticket. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit a Support Request"
      description="Report an incident, system error, or request assistance from the DAFTECH engineering team."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="ticket-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

        {/* Step 1: Project Selection & Warranty Coverage Indicator */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#1e293b' }}>
            1. Select Your Project System *
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={isLoading || projects.length === 0}
            style={{
              width: '100%',
              padding: '0.625rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              fontSize: '0.925rem',
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isWarrantyActive ? '🛡️ (Active Warranty)' : '⚠️ (Warranty Expired)'}
              </option>
            ))}
          </select>

          {/* Warranty Coverage Status Card */}
          {selectedProject && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: selectedProject.isWarrantyActive ? '#ecfdf5' : '#fffbeb',
                border: `1px solid ${selectedProject.isWarrantyActive ? '#a7f3d0' : '#fde68a'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.825rem',
              }}
            >
              <div>
                <strong style={{ color: selectedProject.isWarrantyActive ? '#065f46' : '#92400e' }}>
                  {selectedProject.isWarrantyActive
                    ? '✅ Comprehensive SLA Warranty Coverage Active'
                    : '⚠️ Out-of-Warranty Support Window'}
                </strong>
                <div style={{ color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedProject.isWarrantyActive
                    ? `Expiring on ${new Date(selectedProject.warrantyExpiryDate).toLocaleDateString()} (${selectedProject.daysRemainingInWarranty} days left). Guaranteed resolution SLA enforced.`
                    : 'Warranty coverage period ended. Standard best-effort response queues apply.'}
                </div>
              </div>
              <span
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  backgroundColor: selectedProject.isWarrantyActive ? '#059669' : '#d97706',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedProject.isWarrantyActive ? `${selectedProject.daysRemainingInWarranty}d Remaining` : 'Expired'}
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Category and Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Issue Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            >
              <option value="SoftwareBug">Software Bug / Error</option>
              <option value="DataIssue">Data / Database Discrepancy</option>
              <option value="UsabilityQuestion">Usability / How-To</option>
              <option value="SystemCrash">System Down / Crash</option>
              <option value="HardwareNetwork">Hardware / Connectivity</option>
              <option value="FeatureRequest">Feature Request</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Severity Level *
            </label>
            <select
              value={failureType}
              onChange={(e) => setFailureType(e.target.value as FailureType)}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            >
              <option value="MinorBug">Minor Inconvenience</option>
              <option value="MajorBug">Major Feature Malfunction</option>
              <option value="CriticalCrash">System Inaccessible / Critical</option>
              <option value="DataCorruption">Data Issue / Mismatch</option>
              <option value="PerformanceDegradation">Slowness / Latency</option>
              <option value="SecurityConcern">Security Concern</option>
              <option value="TrainingGap">User Training Question</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Urgency / Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            >
              <option value="Low">Low (Can wait regular review)</option>
              <option value="Medium">Medium (Affecting normal duties)</option>
              <option value="High">High (Impacting operations)</option>
              <option value="Blocker">Blocker (Operations completely stopped)</option>
            </select>
          </div>
        </div>

        {/* Step 3: Title */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
            Summary of Issue *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Cannot finalize sales invoice #1042 due to validation timeout"
            disabled={isLoading}
            required
            maxLength={200}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.925rem' }}
          />
        </div>

        {/* Step 4: Description */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
            Detailed Steps to Reproduce or Explain *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please detail: 1) What were you trying to do? 2) What error message did you see? 3) User accounts affected."
            rows={5}
            disabled={isLoading}
            required
            maxLength={4000}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.925rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : '🚀 Submit Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
