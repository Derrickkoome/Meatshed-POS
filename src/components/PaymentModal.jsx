import { useState, useEffect } from 'react';
import { formatPrice } from '../utils/formatters';
import { DollarSign, X, Calculator } from 'lucide-react';

export default function PaymentModal({ 
  totalAmount, 
  paymentMethod, 
  onConfirm, 
  onCancel 
}) {
  const [amountPaid, setAmountPaid] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [quickAmounts] = useState([500, 1000, 2000, 5000]);

  // Calculate change whenever amount paid changes
  useEffect(() => {
    const paid = parseFloat(amountPaid) || 0;
    const change = paid - totalAmount;
    setChangeAmount(change);
  }, [amountPaid, totalAmount]);

  const handleQuickAmount = (amount) => {
    setAmountPaid(amount.toString());
  };

  const handleExactAmount = () => {
    setAmountPaid(totalAmount.toString());
  };

  const handleConfirm = () => {
    const paid = parseFloat(amountPaid) || 0;
    
    if (paymentMethod === 'Cash' && paid < totalAmount) {
      return; // Don't confirm if insufficient cash
    }

    onConfirm({
      amountPaid: paid,
      changeGiven: Math.max(0, changeAmount)
    });
  };

  const isValidPayment = () => {
    if (paymentMethod === 'Cash') {
      const paid = parseFloat(amountPaid) || 0;
      return paid >= totalAmount;
    }
    return true; // For non-cash payments, no validation needed
  };

  // For non-cash payments, show simplified modal
  if (paymentMethod !== 'Cash') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Confirm Payment</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="text-sm text-gray-600 mb-1">Payment Method</div>
              <div className="text-xl font-bold text-meat">{paymentMethod}</div>
            </div>

            <div className="bg-meat bg-opacity-10 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Amount</div>
              <div className="text-3xl font-bold text-meat">
                {formatPrice(totalAmount)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleConfirm} className="btn-primary flex-1">
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cash payment modal with change calculation
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign size={28} className="text-meat" />
            Cash Payment
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Total Amount */}
        <div className="bg-meat bg-opacity-10 p-4 rounded-lg mb-4">
          <div className="text-sm text-gray-600 mb-1">Total Amount Due</div>
          <div className="text-3xl font-bold text-meat">
            {formatPrice(totalAmount)}
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Amounts
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition"
              >
                {formatPrice(amount)}
              </button>
            ))}
          </div>
          <button
            onClick={handleExactAmount}
            className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <Calculator size={18} />
            Exact Amount
          </button>
        </div>

        {/* Amount Paid Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Paid
          </label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="Enter amount paid"
            min={totalAmount}
            step="0.01"
            className={`w-full px-4 py-3 text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent ${
              amountPaid && parseFloat(amountPaid) < totalAmount
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            autoFocus
          />
          {amountPaid && parseFloat(amountPaid) < totalAmount && (
            <p className="text-sm text-red-600 mt-1">
              Insufficient amount. Need {formatPrice(totalAmount - parseFloat(amountPaid))} more.
            </p>
          )}
        </div>

        {/* Change Amount */}
        <div className={`p-4 rounded-lg mb-6 ${
          changeAmount >= 0 && amountPaid
            ? 'bg-green-50 border-2 border-green-300'
            : 'bg-gray-100 border-2 border-gray-300'
        }`}>
          <div className="text-sm text-gray-600 mb-1">Change to Give</div>
          <div className={`text-3xl font-bold ${
            changeAmount > 0 ? 'text-green-600' : 'text-gray-800'
          }`}>
            {formatPrice(Math.max(0, changeAmount))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!isValidPayment()}
            className={`btn-primary flex-1 ${
              !isValidPayment() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Confirm & Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
