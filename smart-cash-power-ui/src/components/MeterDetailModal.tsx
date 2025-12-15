import React from 'react';
import './MeterDetailModal.css';

interface Meter {
  meterId: number;
  meterNumber: string;
  currentUnits: number;
  usedUnits: number;
  status: string;
}

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Meter Details</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <strong>Meter ID:</strong>
            <span>{meter.meterId}</span>
          </div>
          <div className="detail-row">
            <strong>Meter Number:</strong>
            <span>{meter.meterNumber}</span>
          </div>
          <div className="detail-row">
            <strong>Remaining Units (kWh):</strong>
            <span>{meter.currentUnits.toFixed(4)}</span>
          </div>
          <div className="detail-row">
            <strong>Total Units Used (kWh):</strong>
            <span>{meter.usedUnits.toFixed(4)}</span>
          </div>
          <div className="detail-row">
            <strong>Status:</strong>
            <span className={`status-badge status-${meter.status?.toLowerCase()}`}>{meter.status}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="purchase-btn" onClick={() => onPurchase(meter)}>
            Buy Electricity
          </button>
          <button className="delete-btn" onClick={() => onDelete(meter)}>
            Delete Meter
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeterDetailModal;
