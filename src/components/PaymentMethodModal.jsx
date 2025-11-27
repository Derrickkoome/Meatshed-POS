import { useState } from 'react';
import { formatPrice } from '../utils/formatters';
import { DollarSign, X } from 'lucide-react';

export default function PaymentMethodModal({ 
  totalAmount, 
  onConfirm, 
  onCancel 
}) {
  const [useMultipleMethods, setUseMultipleMethods] = useState(false);
  const [singleMethod, setSingleMethod] = useState('M-Pesa');
  const [payments, setPayments] = useState([
    { method: 'M-Pesa', amount: '' },
    { method: 'Cash', amount: '' }
  ]);
  const [paymentDate, setPaymentDate] = useState('');

  const paymentMethods = ['M-Pesa', 'Cash', 'Card', 'Bank Transfer'];

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const getRemainingAmount = () => {
    return totalAmount - getTotalPaid();
  };

  const isValidPayment = () => {
    if (useMultipleMethods) {
      return getTotalPaid() >= totalAmount;
    }
    return true; // Single method doesn't need validation
  };

  const handleConfirm = () => {
    if (!isValidPayment()) return;

    let paymentDetails;
    
    if (useMultipleMethods) {
      const splitPayments = payments
        .filter(p => parseFloat(p.amount) > 0)
        .map(p => ({
          method: p.method,
          amount: parseFloat(p.amount)
        }));

      paymentDetails = {
        isSplit: true,
        splitPayments,
        totalPaid: getTotalPaid()
      };
    } else {
      paymentDetails = {
        isSplit: false,
        method: singleMethod
      };
    }

    onConfirm(paymentDetails, paymentDate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign size={28} className="text-meat" />
            Payment Details
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Total Amount */}
        <div className="bg-meat bg-opacity-10 p-4 rounded-lg mb-4">
          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
          <div className="text-3xl font-bold text-meat">
            {formatPrice(totalAmount)}
          </div>
        </div>

        {/* Payment Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Payment Date (optional)
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for today's date</p>
        </div>

        {/* Multiple Payment Methods Toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useMultipleMethods}
              onChange={(e) => setUseMultipleMethods(e.target.checked)}
              className="w-4 h-4 text-meat focus:ring-meat"
            />
            <span className="text-sm font-medium">Use multiple payment methods</span>
          </label>
        </div>

        {/* Single Payment Method */}
        {!useMultipleMethods && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Payment Method
            </label>
            <select
              value={singleMethod}
              onChange={(e) => setSingleMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        )}

        {/* Multiple Payment Methods */}
        {useMultipleMethods && (
          <div className="mb-6 space-y-4">
            {payments.map((payment, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-3">
                <div className="space-y-2">
                  <select
                    value={payment.method}
                    onChange={(e) => updatePayment(index, 'method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent text-sm"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent text-sm"
                  />
                </div>
              </div>
            ))}

            {/* Payment Summary */}
            <div className="bg-gray-100 p-3 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Total Required:</span>
                <span className="font-semibold">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid:</span>
                <span className={`font-semibold ${getTotalPaid() >= totalAmount ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(getTotalPaid())}
                </span>
              </div>
              {getRemainingAmount() > 0 && (
                <div className="flex justify-between mt-1 pt-1 border-t border-gray-300">
                  <span className="text-red-600">Remaining:</span>
                  <span className="font-bold text-red-600">{formatPrice(getRemainingAmount())}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!isValidPayment()}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Paid
          </button>
        </div>

        {!isValidPayment() && (
          <p className="text-red-600 text-sm text-center mt-3">
            Payment amount must equal or exceed {formatPrice(totalAmount)}
          </p>
        )}
      </div>
    </div>
  );
}
