import { useState, useEffect } from 'react';
import { useReconciliation } from '../contexts/ReconciliationContext';
import { useOrders } from '../contexts/OrderContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, formatDate } from '../utils/formatters';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Lock,
  Wallet,
  CreditCard,
  Smartphone,
  Calendar,
  User,
  FileText,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReconciliationPage() {
  const { reconciliations, loading, createReconciliation, getTodayReconciliation } = useReconciliation();
  const { orders } = useOrders();
  const { expenses } = useExpenses();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [counting, setCounting] = useState(false);
  
  // Cash counting state
  const [denominations, setDenominations] = useState({
    bills: {
      1000: 0,
      500: 0,
      200: 0,
      100: 0,
      50: 0
    },
    coins: {
      40: 0,
      20: 0,
      10: 0,
      5: 0,
      1: 0
    }
  });
  const [notes, setNotes] = useState('');

  // Get today's data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const todayExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.createdAt);
    expenseDate.setHours(0, 0, 0, 0);
    return expenseDate.getTime() === today.getTime();
  });

  // Calculate expected cash
  const cashOrders = todayOrders.filter(order => 
    order.paymentMethod === 'cash' || 
    (Array.isArray(order.paymentMethods) && order.paymentMethods.some(pm => pm.method === 'cash'))
  );

  const expectedCash = cashOrders.reduce((sum, order) => {
    if (Array.isArray(order.paymentMethods)) {
      const cashPayment = order.paymentMethods.find(pm => pm.method === 'cash');
      return sum + (cashPayment?.amount || 0);
    }
    return sum + order.total;
  }, 0);

  const totalExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netExpectedCash = expectedCash - totalExpenses;

  // Calculate payment method breakdown
  const paymentBreakdown = {
    cash: 0,
    mpesa: 0,
    card: 0,
    credit: 0
  };

  todayOrders.forEach(order => {
    if (Array.isArray(order.paymentMethods)) {
      order.paymentMethods.forEach(pm => {
        if (paymentBreakdown.hasOwnProperty(pm.method)) {
          paymentBreakdown[pm.method] += pm.amount;
        }
      });
    } else {
      const method = order.paymentMethod || 'cash';
      if (paymentBreakdown.hasOwnProperty(method)) {
        paymentBreakdown[method] += order.total;
      }
    }
  });

  // Calculate actual cash counted
  const actualCash = Object.entries(denominations.bills).reduce((sum, [denom, count]) => {
    return sum + (parseInt(denom) * count);
  }, 0) + Object.entries(denominations.coins).reduce((sum, [denom, count]) => {
    return sum + (parseInt(denom) * count);
  }, 0);

  const variance = actualCash - netExpectedCash;
  const variancePercent = netExpectedCash > 0 ? (variance / netExpectedCash) * 100 : 0;

  const todayReconciliation = getTodayReconciliation();
  const isDayClosed = !!todayReconciliation;

  const handleDenominationChange = (type, denom, value) => {
    setDenominations(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [denom]: parseInt(value) || 0
      }
    }));
  };

  const handleCloseDay = async () => {
    if (isDayClosed) {
      toast.error('Day already closed');
      return;
    }

    if (actualCash === 0) {
      toast.error('Please count cash before closing day');
      return;
    }

    try {
      setCounting(true);

      const reconciliationData = {
        date: new Date().toISOString(),
        closedBy: currentUser?.email || 'Unknown',
        orders: {
          count: todayOrders.length,
          total: todayOrders.reduce((sum, o) => sum + o.total, 0)
        },
        paymentBreakdown,
        expenses: {
          count: todayExpenses.length,
          total: totalExpenses
        },
        cash: {
          expected: netExpectedCash,
          actual: actualCash,
          variance,
          variancePercent,
          denominations
        },
        notes
      };

      await createReconciliation(reconciliationData);
      setShowModal(false);
      
      // Reset form
      setDenominations({
        bills: { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0 },
        coins: { 40: 0, 20: 0, 10: 0, 5: 0, 1: 0 }
      });
      setNotes('');
    } catch (error) {
      console.error(error);
    } finally {
      setCounting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calculator className="text-blue-600" size={36} />
            End-of-Day Reconciliation
          </h1>
          <p className="text-gray-600 mt-2">Close the day and verify cash drawer</p>
        </div>
        {!isDayClosed && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
          >
            <Lock size={20} />
            Close Day
          </button>
        )}
      </div>

      {/* Today's Status */}
      {isDayClosed ? (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-600" size={32} />
            <h2 className="text-xl font-bold text-gray-900">Day Already Closed</h2>
          </div>
          <p className="text-gray-700">
            Today's reconciliation was completed at {formatDate(todayReconciliation.closedAt)} by {todayReconciliation.closedBy}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">Variance</p>
              <p className={`text-2xl font-bold ${todayReconciliation.cash.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {todayReconciliation.cash.variance >= 0 ? '+' : ''}{formatPrice(todayReconciliation.cash.variance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Actual Cash</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(todayReconciliation.cash.actual)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-blue-600" size={32} />
            <h2 className="text-xl font-bold text-gray-900">Day Not Closed Yet</h2>
          </div>
          <p className="text-gray-700">
            Complete the cash count and close the day when you're ready to reconcile.
          </p>
        </div>
      )}

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <FileText size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Today's Orders</p>
          <p className="text-3xl font-bold">{todayOrders.length}</p>
          <p className="text-sm opacity-75 mt-1">{formatPrice(todayOrders.reduce((sum, o) => sum + o.total, 0))}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <Wallet size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Expected Cash</p>
          <p className="text-3xl font-bold">{formatPrice(netExpectedCash)}</p>
          <p className="text-sm opacity-75 mt-1">After expenses</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
          <TrendingDown size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold">{formatPrice(totalExpenses)}</p>
          <p className="text-sm opacity-75 mt-1">{todayExpenses.length} transactions</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <DollarSign size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{formatPrice(todayOrders.reduce((sum, o) => sum + o.total, 0))}</p>
          <p className="text-sm opacity-75 mt-1">All payment methods</p>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Payment Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <Wallet className="text-green-600 mb-2" size={24} />
            <p className="text-sm text-gray-600">Cash</p>
            <p className="text-2xl font-bold text-green-600">{formatPrice(paymentBreakdown.cash)}</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <Smartphone className="text-blue-600 mb-2" size={24} />
            <p className="text-sm text-gray-600">M-Pesa</p>
            <p className="text-2xl font-bold text-blue-600">{formatPrice(paymentBreakdown.mpesa)}</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <CreditCard className="text-purple-600 mb-2" size={24} />
            <p className="text-sm text-gray-600">Card</p>
            <p className="text-2xl font-bold text-purple-600">{formatPrice(paymentBreakdown.card)}</p>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <Calendar className="text-orange-600 mb-2" size={24} />
            <p className="text-sm text-gray-600">Credit</p>
            <p className="text-2xl font-bold text-orange-600">{formatPrice(paymentBreakdown.credit)}</p>
          </div>
        </div>
      </div>

      {/* Reconciliation History */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Reconciliation History</h3>
          <p className="text-sm text-gray-600 mt-1">Past {reconciliations.length} days</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Cash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reconciliations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <Calculator className="mx-auto text-gray-300 mb-2" size={48} />
                    <p>No reconciliation records yet</p>
                  </td>
                </tr>
              ) : (
                reconciliations.map((rec) => {
                  const isPositive = rec.cash.variance >= 0;
                  const isSignificant = Math.abs(rec.cash.variancePercent) > 5;
                  
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(rec.closedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rec.orders.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatPrice(rec.orders.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(rec.cash.expected)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatPrice(rec.cash.actual)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formatPrice(rec.cash.variance)}
                          </span>
                          {isSignificant && (
                            <AlertCircle className="text-orange-500" size={16} title="Significant variance" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({rec.cash.variancePercent >= 0 ? '+' : ''}{rec.cash.variancePercent.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {rec.closedBy}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Day Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calculator className="text-blue-600" />
                Close Day - Cash Count
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Expected vs Actual */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                  <p className="text-sm text-gray-600 mb-1">Expected Cash</p>
                  <p className="text-3xl font-bold text-blue-600">{formatPrice(netExpectedCash)}</p>
                  <p className="text-xs text-gray-500 mt-1">Cash sales - expenses</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <p className="text-sm text-gray-600 mb-1">Actual Cash Counted</p>
                  <p className="text-3xl font-bold text-green-600">{formatPrice(actualCash)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total from denominations</p>
                </div>
              </div>

              {/* Variance */}
              <div className={`rounded-xl p-5 border-2 ${
                Math.abs(variance) < 10 ? 'bg-green-50 border-green-300' : 
                Math.abs(variance) < 100 ? 'bg-yellow-50 border-yellow-300' : 
                'bg-red-50 border-red-300'
              }`}>
                <p className="text-sm text-gray-600 mb-1">Variance</p>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {variance >= 0 ? '+' : ''}{formatPrice(variance)}
                  </p>
                  <span className={`text-lg font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Bills */}
              <div>
                <h3 className="text-lg font-bold mb-3">Bills Count</h3>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(denominations.bills).map(([denom, count]) => (
                    <div key={denom} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        KES {denom}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => handleDenominationChange('bills', denom, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-bold"
                      />
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        = {formatPrice(parseInt(denom) * count)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coins */}
              <div>
                <h3 className="text-lg font-bold mb-3">Coins Count</h3>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(denominations.coins).map(([denom, count]) => (
                    <div key={denom} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        KES {denom}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => handleDenominationChange('coins', denom, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-bold"
                      />
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        = {formatPrice(parseInt(denom) * count)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any discrepancies or notes about today's reconciliation..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseDay}
                  disabled={counting || actualCash === 0}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  {counting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Lock size={20} />
                      Close Day
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
