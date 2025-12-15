import React from 'react';

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-md p-6 rounded-2xl animate-fade-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        </div>
        
        <div className="mb-6">
          <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: confirmText === 'Delete' ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : 'var(--gradient-green)',
              color: 'white',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
