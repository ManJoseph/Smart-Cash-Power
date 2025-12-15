import React from 'react';
import { Receipt } from 'lucide-react';
import type { TransactionResponse } from '../services/apiService';

interface TransactionDetailModalProps {
  transaction: TransactionResponse | null;
  onClose: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const getStatusColor = (status: string) => {
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      return { bg: 'var(--green-glow)', color: 'var(--green-primary)' };
    } else if (status === 'FAILED') {
      return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
    } else {
      return { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
    }
  };

  const statusColors = getStatusColor(transaction.status || 'PENDING');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl p-6 rounded-2xl animate-fade-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
              <Receipt className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaction Details</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 rounded-xl space-y-4 mb-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Transaction ID</span>
            <span className="font-semibold col-span-2" style={{ color: 'var(--text-primary)' }}>{transaction.transactionId || 'N/A'}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Date</span>
            <span className="font-semibold col-span-2" style={{ color: 'var(--text-primary)' }}>
              {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 'N/A'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>User</span>
            <span className="font-semibold col-span-2" style={{ color: 'var(--text-primary)' }}>{transaction.userFullName || 'N/A'}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Meter Number</span>
            <span className="font-semibold col-span-2" style={{ color: 'var(--text-primary)' }}>{transaction.meterNumber || 'N/A'}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
            <span className="font-bold text-lg col-span-2" style={{ color: 'var(--green-primary)' }}>
              {transaction.amountPaid != null ? `${transaction.amountPaid} RWF` : 'N/A'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Units Purchased</span>
            <span className="font-semibold col-span-2" style={{ color: 'var(--text-primary)' }}>
              {transaction.unitsPurchased ?? 'N/A'} kWh
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span 
              className="px-3 py-1 rounded-lg text-sm font-semibold inline-block col-span-2"
              style={{ background: statusColors.bg, color: statusColors.color }}
            >
              {transaction.status || 'N/A'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reference</span>
            <span className="font-mono text-sm col-span-2" style={{ color: 'var(--text-muted)' }}>
              {transaction.transactionReference || 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-right">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
