import React, { useState, useEffect } from 'react';
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

  return (
    <div className="space-y-8">
      <header>
        <button onClick={onNavigateBack} className="text-blue-600 hover:underline mb-4">&larr; Back</button>
        <h2 className="text-3xl font-bold text-gray-800">Transaction History</h2>
      </header>

      {isLoading && <p className="text-center">Loading history...</p>}
      {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-lg">{error}</p>}
      
      {!isLoading && !error && (
        <div className="space-y-4">
          {history.length > 0 ? (
            history.map(tx => (
              <div key={tx.transactionId || Math.random()} className="p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-sm text-gray-600">{tx.meterNumber || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">{tx.amountPaid || 0} RWF</p>
                        <p className={`text-sm font-semibold ${tx.currentStatus === 'SUCCESS' || tx.currentStatus === 'COMPLETED' ? 'text-green-600' : tx.currentStatus === 'FAILED' ? 'text-red-600' : 'text-yellow-600'}`}>{tx.currentStatus || 'PENDING'}</p>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No transactions found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
