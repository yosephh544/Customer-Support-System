import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangleIcon, TrashIcon, AlertCircleIcon, ShieldIcon } from '../icons/Icons';

export type ConfirmVariant = 'danger' | 'warning' | 'primary' | 'info';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  icon,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      const res = onConfirm();
      if (res instanceof Promise) {
        setInternalLoading(true);
        await res;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'danger':
        return <TrashIcon size={22} />;
      case 'warning':
        return <AlertTriangleIcon size={22} />;
      case 'info':
        return <AlertCircleIcon size={22} />;
      case 'primary':
      default:
        return <ShieldIcon size={22} />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'primary';
      case 'primary':
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} maxWidth="sm">
      <div className="confirm-dialog-content">
        <div className={`confirm-dialog-icon-badge variant-${variant}`}>
          {icon || getDefaultIcon()}
        </div>

        <h3 className="confirm-dialog-title">{title}</h3>

        <div className="confirm-dialog-description">{description}</div>

        <div className="confirm-dialog-actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="confirm-btn-cancel"
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            isLoading={loading}
            className={`confirm-btn-action confirm-variant-${variant}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

