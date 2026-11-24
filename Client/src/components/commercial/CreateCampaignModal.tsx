import React, { useState } from 'react';
import { campaignsApi } from '../../api/commercialApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import type { CampaignType } from '../../types';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CampaignType>('Digital');
  const [budgetETB, setBudgetETB] = useState<number>(50000);
  const [targetRegion, setTargetRegion] = useState('Addis Ababa');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a campaign title.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await campaignsApi.createCampaign({
        title: title.trim(),
        type,
        budgetETB: Number(budgetETB) || 0,
        targetRegion,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        description: description.trim() || undefined,
      });

      setTitle('');
      setDescription('');
      onCampaignCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Launch Marketing Campaign"
      description="Track marketing budget, Ethiopian regional channels, and lead conversion ROI."
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <Alert variant="danger" message={error} />}

        <div>
          <label className="form-label text-xs">Campaign Title *</label>
          <input
            type="text"
            className="form-input w-full"
            placeholder="e.g. Q1 Oromia Financial ERP Drive"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Campaign Channel</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={type}
              onChange={(e) => setType(e.target.value as CampaignType)}
            >
              <option value="Digital">Digital Marketing / Social</option>
              <option value="TradeEvent">Trade Event / ICT Expo</option>
              <option value="DirectFieldVisit">Direct Field Sales Visit</option>
              <option value="EmailBlast">Direct Outreach / Email</option>
              <option value="Referral">Strategic Partner Referral</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Target Region</label>
            <select
              className="form-input w-full"
              style={{ width: '100%', fontSize: '0.85rem' }}
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
            >
              <option value="Addis Ababa">Addis Ababa</option>
              <option value="Oromia">Oromia</option>
              <option value="Amhara">Amhara</option>
              <option value="Sidama">Sidama</option>
              <option value="Tigray">Tigray</option>
              <option value="Dire Dawa">Dire Dawa</option>
              <option value="Nationwide">Nationwide</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label text-xs">Allocated Budget (ETB)</label>
          <input
            type="number"
            className="form-input w-full"
            value={budgetETB}
            onChange={(e) => setBudgetETB(Number(e.target.value))}
            style={{ width: '100%', fontSize: '0.85rem' }}
            min={0}
            step={5000}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label text-xs">Start Date</label>
            <input
              type="date"
              className="form-input w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
              required
            />
          </div>

          <div>
            <label className="form-label text-xs">End Date</label>
            <input
              type="date"
              className="form-input w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label text-xs">Strategy & Goals</label>
          <textarea
            className="form-input w-full"
            rows={3}
            placeholder="Target audience, expected lead volume, regional messaging..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Launch Campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
};
