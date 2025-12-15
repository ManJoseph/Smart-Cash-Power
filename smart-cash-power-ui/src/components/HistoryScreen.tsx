import React, { useState, useEffect } from 'react';
import { ArrowLeft, Receipt } from 'lucide-react';
import { getTransactionHistory, type TransactionResponse } from '../services/apiService';

interface HistoryScreenProps {
  onNavigateBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigateBack }) => {
  const [history, setHistory] = useState<TransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getTransactionHistory();
        setHistory(response);
      } catch (err) {
        setError('Failed to fetch transaction history.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      return { bg: 'var(--green-glow)', color: 'var(--green-primary)' };
    } else if (status === 'FAILED') {
      return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
    } else {
      return { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-darkest)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="p-8 rounded-2xl space-y-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          {/* Header */}
          <div>
            <button 
              onClick={onNavigateBack} 
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaction History</h2>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <p style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}
          
          {/* Transaction List */}
          {!isLoading && !error && (
            <div className="space-y-4">
              {history.length > 0 ? (
                history.map(tx => {
                  const statusColors = getStatusColor(tx.currentStatus || 'PENDING');
                  return (
                    <div 
                      key={tx.transactionId || Math.random()} 
                      className="p-5 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                            <Receipt className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                          </div>
                          <div>
                            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                              {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {tx.meterNumber || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                            {tx.amountPaid || 0} RWF
                          </p>
                          <span 
                            className="px-3 py-1 rounded-lg text-sm font-semibold inline-block"
                            style={{ background: statusColors.bg, color: statusColors.color }}
                          >
                            {tx.currentStatus || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No transactions found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
