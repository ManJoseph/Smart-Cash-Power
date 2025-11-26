import React, { useState } from 'react';
import { initiatePurchase, type TransactionInitiationRequest, type TransactionResponse } from '../services/apiService';

interface PurchaseScreenProps {
  meters: any[];
  onNavigateBack: () => void;
}

const PurchaseScreen: React.FC<PurchaseScreenProps> = ({ meters, onNavigateBack }) => {
  const [step, setStep] = useState(1);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('MTN MoMo');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<TransactionResponse | null>(null);

  const handleNextStep = () => {
    if (step === 1 && selectedMeterId) {
      setStep(2);
    } else if (step === 2 && Number(amount) >= 100) {
      setStep(3);
    }
  };

  const handlePurchase = async () => {
    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN (at least 4 digits).');
      return;
    }
    if (!selectedMeterId) {
        setError('No meter selected');
        return;
    }
    if (!amount || Number(amount) < 100) {
        setError('Minimum purchase amount is 100 RWF');
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
    } catch (err: any) {
      setError(err.message || 'Purchase failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">
        <p className="text-lg font-semibold">Processing your purchase...</p>
        </div>;
  }

  if (success) {
    return (
      <div className="space-y-6 text-center p-8">
        <h2 className="text-2xl font-bold text-green-600">Purchase Successful!</h2>
        <p><strong>Meter:</strong> {success.meterNumber}</p>
        <p><strong>Units:</strong> {success.unitsPurchased} kWh</p>
        <p><strong>Amount:</strong> {success.amountPaid} RWF</p>
        <p><strong>Status:</strong> {success.currentStatus}</p>
        <button onClick={onNavigateBack} className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <button onClick={onNavigateBack} className="text-blue-600 hover:underline mb-4">&larr; Back</button>
        <h2 className="text-3xl font-bold text-gray-800">Buy Electricity</h2>
      </header>

      {error && <p className="text-red-500 text-center bg-red-100 p-3 rounded-lg">{error}</p>}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 1: Select a Meter</h3>
          <select
            onChange={(e) => setSelectedMeterId(Number(e.target.value))}
            className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-200 rounded-lg"
            defaultValue=""
          >
            <option value="" disabled>Select a meter</option>
            {meters.map(meter => (
              <option key={meter.id} value={meter.id}>{meter.meterNumber}</option>
            ))}
          </select>
          <button onClick={handleNextStep} disabled={!selectedMeterId} className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg disabled:bg-gray-400">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 2: Enter Details</h3>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (RWF)"
            className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-200 rounded-lg"
          />
          {Number(amount) < 100 && amount !== '' && <p className="text-red-500">Minimum amount is 100 RWF.</p>}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-200 rounded-lg"
          >
            <option>MTN MoMo</option>
            <option>Airtel Money</option>
          </select>
          <button onClick={handleNextStep} disabled={Number(amount) < 100} className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg disabled:bg-gray-400">Next</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 3: Confirm PIN</h3>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter your Mobile Money PIN"
            className="w-full px-4 py-3 text-lg text-gray-700 bg-gray-200 rounded-lg"
          />
          <button onClick={handlePurchase} className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-lg">Confirm Purchase</button>
        </div>
      )}
    </div>
  );
};

export default PurchaseScreen;
