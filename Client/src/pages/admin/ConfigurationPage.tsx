import React, { useEffect, useState } from 'react';
import { configurationApi } from '../../api/configurationApi';
import { Alert } from '../../components/common/Alert';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SettingsIcon } from '../../components/icons/Icons';
import type { SystemConfiguration } from '../../types';

const MIN_TARGET = 1;
const MAX_TARGET = 10;

export const ConfigurationPage: React.FC = () => {
  const [configuration, setConfiguration] = useState<SystemConfiguration | null>(null);
  const [defaultTarget, setDefaultTarget] = useState('1');
  const [maxTarget, setMaxTarget] = useState('10');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<{ message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const applyConfiguration = (config: SystemConfiguration) => {
    setConfiguration(config);
    setDefaultTarget(String(config.defaultDailyTouchpointTarget));
    setMaxTarget(String(config.maxDailyTouchpointTarget));
  };

  const loadConfiguration = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const config = await configurationApi.getConfiguration();
      applyConfiguration(config);
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to load system configuration.',
        details: err.errors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageError(null);
    setSuccessMessage(null);

    const defaultCount = parseInt(defaultTarget, 10);
    const maxCount = parseInt(maxTarget, 10);

    if (isNaN(defaultCount) || defaultCount < MIN_TARGET || defaultCount > MAX_TARGET) {
      setPageError({ message: `Default touchpoints per agent must be between ${MIN_TARGET} and ${MAX_TARGET}.` });
      return;
    }

    if (isNaN(maxCount) || maxCount < MIN_TARGET || maxCount > MAX_TARGET) {
      setPageError({ message: `Maximum touchpoints per agent must be between ${MIN_TARGET} and ${MAX_TARGET}.` });
      return;
    }

    if (defaultCount > maxCount) {
      setPageError({ message: 'The default target cannot be greater than the maximum target.' });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await configurationApi.updateConfiguration({
        defaultDailyTouchpointTarget: defaultCount,
        maxDailyTouchpointTarget: maxCount,
      });
      applyConfiguration(updated);
      setSuccessMessage('Configuration saved. The schedule auto-generator will use these values on its next run.');
    } catch (err: any) {
      setPageError({
        message: err.message || 'Failed to save system configuration.',
        details: err.errors,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const lastUpdatedLabel = configuration?.updatedAt
    ? `Last updated ${new Date(configuration.updatedAt).toLocaleString()}${
        configuration.updatedByName ? ` by ${configuration.updatedByName}` : ''
      }`
    : 'Using system defaults';

  return (
    <div className="configuration-page">
      <div className="page-header-row mb-3">
        <div>
          <h2 className="main-page-title">System Configuration</h2>
          <p className="main-page-subtitle">
            Platform-wide settings that drive scheduling automation and other operations.
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
            <Button size="sm" variant="outline" onClick={loadConfiguration}>
              Retry Connection
            </Button>
          }
        />
      )}

      <form onSubmit={handleSave}>
        <div className="content-card config-section">
          <div className="config-section-heading">
            <div className="config-section-icon">
              <SettingsIcon size={16} />
            </div>
            <div>
              <h3 className="config-section-title">Touchpoint Scheduling</h3>
              <p className="config-section-description">
                Controls how many customer touchpoints the auto-generator creates for each agent every
                day. Team leads can tune the target per agent, within the maximum allowance set here.
              </p>
            </div>
          </div>

          <div className="config-grid">
            <Input
              label="Default touchpoints per agent / day"
              type="number"
              min={MIN_TARGET}
              max={MAX_TARGET}
              required
              value={defaultTarget}
              onChange={(e) => setDefaultTarget(e.target.value)}
              helperText="Applied when a team lead assigns an agent without choosing a number."
              disabled={isLoading || isSaving}
            />
            <Input
              label="Maximum touchpoints per agent / day"
              type="number"
              min={MIN_TARGET}
              max={MAX_TARGET}
              required
              value={maxTarget}
              onChange={(e) => setMaxTarget(e.target.value)}
              helperText="Upper limit enforced for every agent assignment and by the auto-generator."
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="config-note">
            <strong>How generation works:</strong> every day of a schedule cycle creates at least one
            touchpoint for each active agent, up to their configured daily target, capped by the number
            of active customer contacts. Slots start at 09:00. Per-agent targets are maintained by team
            leads on Team assignments.
          </div>

          <div className="config-actions">
            <span className="config-last-updated">{isLoading ? 'Loading configuration…' : lastUpdatedLabel}</span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              disabled={isLoading}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
