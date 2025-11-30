import { useState } from 'react';
import { useDebts } from '../contexts/DebtContext';
import { formatPrice, formatDate } from '../utils/formatters';
import { Search, DollarSign, AlertCircle, CheckCircle, Clock, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DebtsPage() {
  const { debts, loading, addPayment, deleteDebt, getTotalOutstanding } = useDebts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, outstanding, partial, paid
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = 
      debt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.customerPhone?.includes(searchTerm) ||
      debt.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || debt.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > selectedDebt.remainingBalance) {
      toast.error('Payment amount cannot exceed remaining balance');
      return;
    }

    try {
      await addPayment(selectedDebt.id, {
        amount,
        date: new Date(paymentDate).toISOString(),
        notes: paymentNotes,
        recordedAt: new Date().toISOString()
      });
      
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNotes('');
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (!confirm('Are you sure you want to delete this debt record? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDebt(debtId);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'outstanding':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1 w-fit">
            <AlertCircle size={12} />
            Outstanding
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold flex items-center gap-1 w-fit">
            <Clock size={12} />
            Partial
          </span>
        );
      case 'paid':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1 w-fit">
            <CheckCircle size={12} />
            Paid
          </span>
        );
      default:
        return null;
    }
  };

  const outstandingDebts = debts.filter(d => d.status === 'outstanding');
  const partialDebts = debts.filter(d => d.status === 'partial');
  const paidDebts = debts.filter(d => d.status === 'paid');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading debts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Credit Sales & Debts</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{formatPrice(getTotalOutstanding())}</p>
              <p className="text-xs text-gray-500">{outstandingDebts.length + partialDebts.length} customers</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100">
              <DollarSign className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fully Outstanding</p>
              <p className="text-xl font-bold">{outstandingDebts.length}</p>
              <p className="text-xs text-gray-500">
                {formatPrice(outstandingDebts.reduce((sum, d) => sum + d.remainingBalance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Partial Payments</p>
              <p className="text-xl font-bold">{partialDebts.length}</p>
              <p className="text-xs text-gray-500">
                {formatPrice(partialDebts.reduce((sum, d) => sum + d.remainingBalance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Off</p>
              <p className="text-xl font-bold">{paidDebts.length}</p>
              <p className="text-xs text-gray-500">This period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer name, phone, or debt ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded ${filterStatus === 'all' ? 'bg-meat text-white' : 'bg-gray-200'}`}
            >
              All ({debts.length})
            </button>
            <button
              onClick={() => setFilterStatus('outstanding')}
              className={`px-4 py-2 rounded ${filterStatus === 'outstanding' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              Outstanding ({outstandingDebts.length})
            </button>
            <button
              onClick={() => setFilterStatus('partial')}
              className={`px-4 py-2 rounded ${filterStatus === 'partial' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
            >
              Partial ({partialDebts.length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2 rounded ${filterStatus === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              Paid ({paidDebts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Debts Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2">
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Customer</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Total Amount</th>
              <th className="text-right py-3 px-4">Paid</th>
              <th className="text-right py-3 px-4">Remaining</th>
              <th className="text-left py-3 px-4">Order Details</th>
              <th className="text-center py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDebts.map((debt) => {
              const totalPaid = debt.totalAmount - debt.remainingBalance;
              return (
                <tr key={debt.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm">
                    {formatDate(debt.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{debt.customerName}</div>
                    <div className="text-xs text-gray-500">{debt.customerPhone}</div>
                    {debt.lastPaymentDate && (
                      <div className="text-xs text-green-600 mt-1">
                        Last payment: {formatDate(debt.lastPaymentDate)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(debt.status)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {formatPrice(debt.totalAmount)}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600">
                    {formatPrice(totalPaid)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-red-600">
                    {formatPrice(debt.remainingBalance)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div>{debt.items?.length || 0} items</div>
                    {debt.orderId && (
                      <div className="text-xs text-gray-500 font-mono">#{debt.orderId}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {debt.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedDebt(debt);
                            setShowPaymentModal(true);
                            setPaymentAmount(debt.remainingBalance.toString());
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredDebts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {filterStatus !== 'all' ? filterStatus : ''} debts found
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="font-semibold">{selectedDebt.customerName}</div>
                  <div className="text-sm text-gray-600">{selectedDebt.customerPhone}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                <div>
                  <div className="text-xs text-gray-600">Total Amount</div>
                  <div className="font-bold">{formatPrice(selectedDebt.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Remaining Balance</div>
                  <div className="font-bold text-red-600">{formatPrice(selectedDebt.remainingBalance)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Amount *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field"
                  min="0"
                  max={selectedDebt.remainingBalance}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any notes about this payment..."
                  className="input-field"
                  rows="2"
                />
              </div>

              {selectedDebt.payments && selectedDebt.payments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Payment History</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDebt.payments.map((payment, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold">{formatPrice(payment.amount)}</span>
                          <span className="text-gray-600">{formatDate(payment.date)}</span>
                        </div>
                        {payment.notes && (
                          <div className="text-xs text-gray-500 mt-1">{payment.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  className="btn-primary flex-1"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
