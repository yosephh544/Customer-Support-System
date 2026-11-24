import React, { useState, useEffect } from 'react';
import { leadsApi, campaignsApi } from '../../api/commercialApi';
import { usersApi } from '../../api/usersApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import type { Campaign, LeadSource, UserProfile } from '../../types';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('Addis Ababa');
  const [source, setSource] = useState<LeadSource>('DirectReferral');
  const [campaignId, setCampaignId] = useState('');
  const [estimatedValueETB, setEstimatedValueETB] = useState<number>(150000);
  const [interestedModules, setInterestedModules] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedSalesUserId, setAssignedSalesUserId] = useState('');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [campRes, userRes] = await Promise.all([
        campaignsApi.getCampaigns(),
        usersApi.getUsers({ pageSize: 100 }),
      ]);
      setCampaigns(campRes || []);
      setSpecialists(userRes.items || []);
    } catch {
      // Non-critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !organizationName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError('Please fill in all required fields (Name, Organization, Email, Phone).');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await leadsApi.createLead({
        fullName: fullName.trim(),
        organizationName: organizationName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        region,
        source,
        campaignId: campaignId || undefined,
        estimatedValueETB: Number(estimatedValueETB) || 0,
        interestedModules: interestedModules.trim() || undefined,
        notes: notes.trim() || undefined,
        assignedSalesUserId: assignedSalesUserId || undefined,
      });

      // Reset
      setFullName('');
      setOrganizationName('');
      setEmail('');
      setPhoneNumber('');
      setInterestedModules('');
      setNotes('');
      onLeadCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create commercial lead.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Commercial Opportunity / Lead"
      description="Record prospective customer accounts and ETB quote values."
      size="lg"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <Alert variant="danger" message={error} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Customer Organization Name *</label>
            <input
              type="text"
              className="form-input w-full"
              placeholder="e.g. Awash Agro Industry SC"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
              required
            />
          </div>

          <div>
            <label className="form-label text-xs">Contact Person / Decision Maker *</label>
            <input
              type="text"
              className="form-input w-full"
              placeholder="e.g. Ato Daniel Bekele"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Email Address *</label>
            <input
              type="email"
              className="form-input w-full"
              placeholder="e.g. contact@awashagro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
              required
            />
          </div>

          <div>
            <label className="form-label text-xs">Phone Number *</label>
            <input
              type="tel"
              className="form-input w-full"
              placeholder="e.g. +251 91 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Target Ethiopian Region</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="Addis Ababa">Addis Ababa</option>
              <option value="Oromia">Oromia</option>
              <option value="Amhara">Amhara</option>
              <option value="Sidama">Sidama</option>
              <option value="Tigray">Tigray</option>
              <option value="Dire Dawa">Dire Dawa</option>
              <option value="Southern Ethiopia">Southern Ethiopia</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Lead Source</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
            >
              <option value="DirectReferral">Direct Referral</option>
              <option value="Website">Website Form</option>
              <option value="Campaign">Marketing Campaign</option>
              <option value="FieldSales">Field Sales Visit</option>
              <option value="InboundInquiry">Inbound Phone/Email</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Attributed Campaign (Optional)</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">-- No Direct Campaign --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Estimated Contract Value (ETB)</label>
            <input
              type="number"
              className="form-input w-full"
              placeholder="e.g. 250000"
              value={estimatedValueETB}
              onChange={(e) => setEstimatedValueETB(Number(e.target.value))}
              style={{ width: '100%', fontSize: '0.85rem' }}
              min={0}
              step={1000}
            />
          </div>

          <div>
            <label className="form-label text-xs">Assigned Account Representative</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={assignedSalesUserId}
              onChange={(e) => setAssignedSalesUserId(e.target.value)}
            >
              <option value="">-- Unassigned --</option>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label text-xs">Requested Scope / Modules (comma separated)</label>
          <input
            type="text"
            className="form-input w-full"
            placeholder="e.g. Financial Accounting, Customer Support Portal, Asset Management"
            value={interestedModules}
            onChange={(e) => setInterestedModules(e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label className="form-label text-xs">Qualification & Meeting Notes</label>
          <textarea
            className="form-input w-full"
            rows={3}
            placeholder="Key customer business requirements, budget constraints, timeline..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Save Opportunity
          </Button>
        </div>
      </form>
    </Modal>
  );
};
