import React from 'react';
import type { TransactionResponse } from '../services/apiService';
import './TransactionDetailModal.css';

interface TransactionDetailModalProps {
  transaction: TransactionResponse | null;
  onClose: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Transaction Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">Transaction ID</span>
            <span className="font-semibold col-span-2">{transaction.transactionId || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">Date</span>
            <span className="font-semibold col-span-2">{transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">User</span>
            <span className="font-semibold col-span-2">{transaction.userFullName || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">Meter Number</span>
            <span className="font-semibold col-span-2">{transaction.meterNumber || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">Amount Paid</span>
            <span className="font-semibold col-span-2">{transaction.amountPaid != null ? `${transaction.amountPaid} RWF` : 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">Units Purchased</span>
            <span className="font-semibold col-span-2">{transaction.unitsPurchased ?? 'N/A'}</span>
          </div>
           <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`font-semibold col-span-2 ${transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED' ? 'text-green-600' : 'text-red-600'}`}>{transaction.status || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-sm text-gray-500">Reference</span>
            <span className="font-semibold col-span-2">{transaction.transactionReference || 'N/A'}</span>
          </div>
        </div>
        <div className="text-right mt-8">
          <button onClick={onClose} className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
