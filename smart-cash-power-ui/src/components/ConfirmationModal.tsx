import React from 'react';
import './MeterDetailModal.css'; // Reuse the same CSS for overlay and basic structure

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onCancel} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="purchase-btn" onClick={onCancel} style={{ backgroundColor: 'var(--secondary)'}}>
            {cancelText}
          </button>
          <button className="purchase-btn" onClick={onConfirm} style={{ backgroundColor: 'var(--error)'}}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
