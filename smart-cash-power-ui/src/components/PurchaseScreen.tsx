import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { initiatePurchase, type TransactionInitiationRequest, type TransactionResponse } from '../services/apiService';

interface PurchaseScreenProps {
  meters: any[];
  onNavigateBack: () => void;
}

const PurchaseScreen: React.FC<PurchaseScreenProps> = ({ meters, onNavigateBack }) => {
  const location = useLocation();
  const preselectedMeter = location.state?.meter;

  const [step, setStep] = useState(preselectedMeter ? 2 : 1);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(preselectedMeter?.id || null);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('MTN MoMo');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<TransactionResponse | null>(null);

  useEffect(() => {
    if (preselectedMeter) {
      setSelectedMeterId(preselectedMeter.id);
      setStep(2);
    }
  }, [preselectedMeter]);

  const handleNextStep = () => {
    if (step === 1 && selectedMeterId) {
      setStep(2);
    } else if (step === 2 && Number(amount) >= 100) {
      setStep(3);
    }
  };

  const handlePurchase = async () => {
    if (!pin || pin.length < 4) {
      toast.error('Please enter a valid PIN (at least 4 digits).');
      return;
    }
    if (!selectedMeterId) {
        toast.error('No meter selected');
        return;
    }
    if (!amount || Number(amount) < 100) {
        toast.error('Minimum purchase amount is 100 RWF');
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const request: TransactionInitiationRequest = {
      meterId: selectedMeterId,
      amount: Number(amount),
      mobileMoneyProvider: provider,
    };

    try {
      const response = await initiatePurchase(request);
      setSuccess(response);
      toast.success(`Successfully purchased ${response.unitsPurchased} kWh!`);
    } catch (err: any) {
      const errorMsg = err.message || 'Purchase failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-darkest)' }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'var(--green-glow)' }}>
            <Zap className="w-8 h-8" style={{ color: 'var(--green-primary)' }} />
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Processing your purchase...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-darkest)' }}>
        <div className="w-full max-w-lg p-8 rounded-2xl text-center space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--green-glow)' }}>
            <CheckCircle className="w-12 h-12" style={{ color: 'var(--green-primary)' }} />
          </div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--green-primary)' }}>Purchase Successful!</h2>
          
          <div className="p-6 rounded-xl space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Meter</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{success.meterNumber}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Units Purchased</span>
              <span className="font-bold text-lg" style={{ color: 'var(--green-primary)' }}>{success.unitsPurchased} kWh</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{success.amountPaid} RWF</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Status</span>
              <span className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ background: 'var(--green-glow)', color: 'var(--green-primary)' }}>
                {success.currentStatus}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onNavigateBack} 
            className="w-full px-6 py-3 rounded-lg font-semibold transition-all"
            style={{ background: 'var(--gradient-green)', color: 'white' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-darkest)' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
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
            <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Buy Electricity</h2>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                  style={{ 
                    background: step >= s ? 'var(--gradient-green)' : 'var(--bg-elevated)',
                    color: step >= s ? 'white' : 'var(--text-muted)',
                    border: step >= s ? 'none' : '1px solid var(--border-default)'
                  }}
                >
                  {s}
                </div>
                {s < 3 && <div className="flex-1 h-1 mx-2" style={{ background: step > s ? 'var(--green-primary)' : 'var(--border-default)' }} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
              <p style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          {/* Step 1: Select Meter */}
          {step === 1 && !preselectedMeter && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Step 1: Select a Meter</h3>
              <select
                onChange={(e) => setSelectedMeterId(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                defaultValue=""
              >
                <option value="" disabled>Select a meter</option>
                {meters.map(meter => (
                  <option key={meter.id} value={meter.id}>{meter.meterNumber}</option>
                ))}
              </select>
              <button 
                onClick={handleNextStep} 
                disabled={!selectedMeterId} 
                className="w-full px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{ background: 'var(--gradient-green)', color: 'white' }}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 2: Enter Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Step 2: Enter Details</h3>
              {preselectedMeter && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Buying for Meter:</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{preselectedMeter.meterNumber}</p>
                </div>
              )}
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (RWF)"
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              {Number(amount) < 100 && amount !== '' && <p style={{ color: '#ef4444' }}>Minimum amount is 100 RWF.</p>}
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <option>MTN MoMo</option>
                <option>Airtel Money</option>
              </select>
              <button 
                onClick={handleNextStep} 
                disabled={Number(amount) < 100} 
                className="w-full px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{ background: 'var(--gradient-green)', color: 'white' }}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 3: Confirm PIN */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Step 3: Confirm PIN</h3>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your Mobile Money PIN"
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              <button 
                onClick={handlePurchase} 
                className="w-full px-6 py-3 rounded-lg font-semibold transition-all"
                style={{ background: 'var(--gradient-green)', color: 'white' }}
              >
                ⚡ Confirm Purchase
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseScreen;
