import { useState, useEffect } from 'react';
import { formatPrice } from '../utils/formatters';
import { DollarSign, X, Plus, Trash2, CreditCard } from 'lucide-react';

export default function SplitPaymentModal({ 
  totalAmount, 
  onConfirm, 
  onCancel 
}) {
  const [payments, setPayments] = useState([
    { method: 'Cash', amount: '', id: Date.now() }
  ]);
  const [cashAmountPaid, setCashAmountPaid] = useState('');

  const paymentMethods = ['Cash', 'M-Pesa', 'Card', 'Credit'];

  const addPaymentMethod = () => {
    setPayments([...payments, { 
      method: 'Cash', 
      amount: '', 
      id: Date.now() 
    }]);
  };

  const removePaymentMethod = (id) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const updatePayment = (id, field, value) => {
    setPayments(payments.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, p) => {
      const amount = parseFloat(p.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const getRemainingAmount = () => {
    return totalAmount - getTotalPaid();
  };

  const getChange = () => {
    const cashPayment = payments.find(p => p.method === 'Cash');
    if (!cashPayment) return 0;
    
    const cashAmount = parseFloat(cashAmountPaid) || parseFloat(cashPayment.amount) || 0;
    const cashRequired = parseFloat(cashPayment.amount) || 0;
    return Math.max(0, cashAmount - cashRequired);
  };

  const isValidPayment = () => {
    const totalPaid = getTotalPaid();
    if (totalPaid < totalAmount) return false;

    // Check if cash payment has enough amount paid
    const cashPayment = payments.find(p => p.method === 'Cash');
    if (cashPayment) {
      const cashRequired = parseFloat(cashPayment.amount) || 0;
      const cashPaid = parseFloat(cashAmountPaid) || 0;
      if (cashRequired > 0 && cashPaid < cashRequired) return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (!isValidPayment()) return;

    const splitPayments = payments
      .filter(p => parseFloat(p.amount) > 0)
      .map(p => ({
        method: p.method,
        amount: parseFloat(p.amount)
      }));

    const cashPayment = splitPayments.find(p => p.method === 'Cash');
    const paymentDetails = {
      isSplit: splitPayments.length > 1,
      splitPayments,
      totalPaid: getTotalPaid(),
      ...(cashPayment && {
        cashAmountPaid: parseFloat(cashAmountPaid) || cashPayment.amount,
        changeGiven: getChange()
      })
    };

    onConfirm(paymentDetails);
  };

  const handleQuickFill = (paymentId) => {
    const remaining = getRemainingAmount();
    updatePayment(paymentId, 'amount', remaining.toString());
  };

  const cashPayment = payments.find(p => p.method === 'Cash');
  const cashRequired = cashPayment ? parseFloat(cashPayment.amount) || 0 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={28} className="text-meat" />
            Split Payment
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Total Amount Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-meat bg-opacity-10 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-meat">
              {formatPrice(totalAmount)}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${getRemainingAmount() > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="text-sm text-gray-600 mb-1">
              {getRemainingAmount() > 0 ? 'Remaining' : 'Change Due'}
            </div>
            <div className={`text-2xl font-bold ${getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatPrice(Math.abs(getRemainingAmount()))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Payment Methods</h3>
            <button
              onClick={addPaymentMethod}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              Add Method
            </button>
          </div>

          {payments.map((payment, index) => (
            <div key={payment.id} className="border border-gray-300 rounded-lg p-4">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    Payment Method {index + 1}
                  </label>
                  <select
                    value={payment.method}
                    onChange={(e) => updatePayment(payment.id, 'method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={payment.amount}
                      onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
                    />
                    <button
                      onClick={() => handleQuickFill(payment.id)}
                      className="btn-secondary text-xs whitespace-nowrap"
                      title="Fill remaining amount"
                    >
                      Fill
                    </button>
                  </div>
                </div>

                {payments.length > 1 && (
                  <button
                    onClick={() => removePaymentMethod(payment.id)}
                    className="mt-7 text-red-600 hover:text-red-700"
                    title="Remove payment method"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {/* Cash Amount Paid */}
              {payment.method === 'Cash' && parseFloat(payment.amount) > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium mb-2">
                    Cash Amount Received
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashAmountPaid}
                    onChange={(e) => setCashAmountPaid(e.target.value)}
                    placeholder={`Minimum: ${formatPrice(cashRequired)}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
                  />
                  {parseFloat(cashAmountPaid) > cashRequired && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                      <span className="text-gray-600">Change to give: </span>
                      <span className="font-bold text-green-600">
                        {formatPrice(getChange())}
                      </span>
                    </div>
                  )}
                  {parseFloat(cashAmountPaid) > 0 && parseFloat(cashAmountPaid) < cashRequired && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                      Insufficient cash amount
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-semibold">{formatPrice(getTotalPaid())}</span>
            </div>
            {getChange() > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Cash Change:</span>
                <span className="font-bold">{formatPrice(getChange())}</span>
              </div>
            )}
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
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Payment
          </button>
        </div>

        {!isValidPayment() && getTotalPaid() > 0 && (
          <p className="text-red-600 text-sm text-center mt-3">
            {getRemainingAmount() > 0 
              ? `Still need ${formatPrice(getRemainingAmount())} to complete payment`
              : 'Please provide sufficient cash amount'}
          </p>
        )}
      </div>
    </div>
  );
}
