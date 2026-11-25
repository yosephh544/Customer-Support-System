import React, { useState } from 'react';
import { publicApi } from '../../api/commercialApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import type { PublicLeadSubmissionRequest } from '../../types';

interface PublicQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Oromia',
  'Amhara',
  'Tigray',
  'Sidama',
  'Dire Dawa',
  'Somali',
  'Benishangul-Gumuz',
  'Harari',
  'South Ethiopia',
  'Central Ethiopia',
  'Afar',
  'Gambella',
];

const MODULE_OPTIONS = [
  'ERP Finance & Accounting',
  'Inventory & Warehouse Barcoding',
  'Payroll & HR Management',
  'Sales & Customer Support Suite',
  'Fixed Assets & Depreciation',
  'Point of Sale (POS)',
  'Custom Workflow Automation',
];

export const PublicQuoteModal: React.FC<PublicQuoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('Addis Ababa');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !organizationName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError('Please provide all required contact details.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const req: PublicLeadSubmissionRequest = {
        fullName: fullName.trim(),
        organizationName: organizationName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        region,
        interestedModules: selectedModules.join(', '),
        notes: notes.trim(),
      };

      await publicApi.submitLeadInquiry(req);
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to submit your inquiry. Please verify your connection and try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    setFullName('');
    setOrganizationName('');
    setEmail('');
    setPhoneNumber('');
    setSelectedModules([]);
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuccess ? 'Inquiry Submitted!' : 'Request a Product Demo & Price Quote'}
      description={
        isSuccess
          ? 'Our enterprise solutions team has received your inquiry.'
          : 'Tell us about your organization and requirements. Our engineering and commercial team will contact you within 24 hours.'
      }
      size="lg"
    >
      {isSuccess ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Thank You, {fullName}!
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
            Your request for <strong>{organizationName}</strong> has been logged in our Commercial Pipeline. A DAFTECH enterprise consultant will reach out via <strong>{email}</strong> or <strong>{phoneNumber}</strong> shortly.
          </p>
          <Button variant="primary" onClick={handleClose}>
            Close & Return to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

          {/* Contact Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                Your Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Abebe Bikila"
                disabled={isLoading}
                required
                maxLength={120}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                Company / Organization Name *
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g., Ethio Telecom Logistics"
                disabled={isLoading}
                required
                maxLength={150}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                Corporate Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abebe@organization.com"
                disabled={isLoading}
                required
                maxLength={100}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                Phone Number (ET) *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251 91 123 4567"
                disabled={isLoading}
                required
                maxLength={30}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Region */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#1e293b' }}>
              Ethiopian Operating Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            >
              {ETHIOPIAN_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Modules of Interest */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#1e293b' }}>
              Software Solutions of Interest
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.5rem' }}>
              {MODULE_OPTIONS.map((mod) => (
                <label
                  key={mod}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.825rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '0.375rem',
                    background: selectedModules.includes(mod) ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${selectedModules.includes(mod) ? '#3b82f6' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(mod)}
                    onChange={() => toggleModule(mod)}
                    disabled={isLoading}
                  />
                  <span>{mod}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#1e293b' }}>
              Specific Business Needs or System Scale
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., We have 4 branches with 45 concurrent users looking to deploy inventory and payroll by Q2..."
              rows={3}
              disabled={isLoading}
              maxLength={2000}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : '🚀 Submit Enterprise Inquiry'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
