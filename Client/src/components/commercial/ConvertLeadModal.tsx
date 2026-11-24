import React, { useState, useEffect } from 'react';
import { leadsApi } from '../../api/commercialApi';
import { usersApi } from '../../api/usersApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { Badge } from '../common/Badge';
import type { ConvertLeadResult, Lead, UserProfile } from '../../types';

interface ConvertLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadConverted: () => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadConverted,
}) => {
  const [supportWindowMonths, setSupportWindowMonths] = useState(12);
  const [specialistUserId, setSpecialistUserId] = useState('');
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertLeadResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setError(null);
      loadSpecialists();
    }
  }, [isOpen]);

  const loadSpecialists = async () => {
    try {
      const res = await usersApi.getUsers({ pageSize: 100 });
      setSpecialists(res.items || []);
    } catch {
      // Non-critical
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await leadsApi.convertToClient(lead.id, {
        supportWindowMonths,
        primarySupportSpecialistUserId: specialistUserId || undefined,
      });
      setResult(res);
      onLeadConverted();
    } catch (err: any) {
      setError(err.message || 'Failed to convert lead to customer organization.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="1-Click Lead-to-Client Onboarding"
      description="Automates customer organization creation, primary contact provisioning, and project initialization."
      size="md"
    >
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <Alert variant="success" message={result.message} />

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div><strong>Created Organization:</strong> {result.organizationName}</div>
            <div><strong>Provisioned Project:</strong> {result.projectName}</div>
            <div><strong>Primary Contact:</strong> {result.contactPersonName}</div>
            <div><strong>Modules Deployed:</strong> {result.modulesProvisionedCount} active module(s)</div>
            <div><strong>Warranty Coverage:</strong> {supportWindowMonths} Months Active Support Window</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done & View Pipeline
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && <Alert variant="danger" message={error} />}

          {/* Lead Summary Overview */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                {lead.organizationName}
              </span>
              <Badge variant="success">Stage: {lead.stageName}</Badge>
            </div>
            <div><strong>Contact:</strong> {lead.fullName} ({lead.phoneNumber} · {lead.email})</div>
            <div><strong>Region:</strong> {lead.region}</div>
            <div><strong>Contract Value:</strong> {lead.estimatedValueETB.toLocaleString()} ETB</div>
            {lead.interestedModules && (
              <div><strong>Scope Modules:</strong> {lead.interestedModules}</div>
            )}
          </div>

          {/* Support Window Months */}
          <div>
            <label className="form-label text-xs">Included Warranty / Support Window (Months) *</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={supportWindowMonths}
              onChange={(e) => setSupportWindowMonths(Number(e.target.value))}
              required
            >
              <option value={6}>6 Months Complimentary Support</option>
              <option value={12}>12 Months (1 Year Standard Warranty)</option>
              <option value={24}>24 Months (2 Years Enterprise Agreement)</option>
              <option value={36}>36 Months (3 Years Strategic Partner)</option>
            </select>
          </div>

          {/* Primary Support Specialist Allocation */}
          <div>
            <label className="form-label text-xs">Initial Support Specialist Allocation (Optional)</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={specialistUserId}
              onChange={(e) => setSpecialistUserId(e.target.value)}
            >
              <option value="">-- Assign Later in Operations Desk --</option>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              ⚡ Convert & Provision Client
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
