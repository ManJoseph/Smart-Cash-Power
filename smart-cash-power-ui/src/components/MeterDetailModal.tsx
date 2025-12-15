import React from 'react';
import { Power } from 'lucide-react';
import type { Meter } from '../App';

interface MeterDetailModalProps {
  meter: Meter | null;
  onClose: () => void;
  onPurchase: (meter: Meter) => void;
  onDelete: (meter: Meter) => void;
}

const MeterDetailModal: React.FC<MeterDetailModalProps> = ({ meter, onClose, onPurchase, onDelete }) => {
  if (!meter) {
    return null;
  }

  const status = meter.active ? 'Active' : 'Inactive';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg p-6 rounded-2xl animate-fade-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-glow)' }}>
              <Power className="w-6 h-6" style={{ color: 'var(--green-primary)' }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Meter Details</h2>
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
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Meter ID</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{meter.id}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Meter Number</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{meter.meterNumber}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Remaining Units</span>
              <span className="font-bold text-lg" style={{ color: 'var(--green-primary)' }}>
                {(meter.currentUnits ?? 0).toFixed(2)} kWh
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Units Used</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {(meter.usedUnits ?? 0).toFixed(2)} kWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status</span>
              <span 
                className="px-3 py-1 rounded-lg text-sm font-semibold"
                style={{ 
                  background: status === 'Active' ? 'var(--green-glow)' : 'rgba(239, 68, 68, 0.1)',
                  color: status === 'Active' ? 'var(--green-primary)' : '#ef4444'
                }}
              >
                {status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3">
          <button 
            onClick={() => onDelete(meter)}
            className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              color: 'white',
            }}
          >
            Delete Meter
          </button>
          <button 
            onClick={() => onPurchase(meter)}
            className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: 'var(--gradient-green)',
              color: 'white',
            }}
          >
            ⚡ Buy Electricity
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeterDetailModal;
