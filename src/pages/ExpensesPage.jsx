import { useState, useMemo } from 'react';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, formatDate } from '../utils/formatters';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit,
  X,
  TrendingDown,
  ShoppingCart,
  Coffee,
  Calendar,
  Filter,
  Receipt,
} from 'lucide-react';

export default function ExpensesPage() {
  const { expenses, loading, createExpense, deleteExpense } = useExpenses();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all'); // all, petty_cash, supplier
  const [formData, setFormData] = useState({
    type: 'petty_cash', // petty_cash or supplier
    category: '',
    description: '',
    amount: '',
    recipient: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash', // cash, mpesa, split
    cashAmount: '',
    mpesaAmount: '',
  });

  const expenseCategories = {
    petty_cash: [
      'Transport',
      'Meals',
      'Utilities',
      'Repairs & Maintenance',
      'Office Supplies',
      'Cleaning',
      'Miscellaneous',
    ],
    supplier: [
      'Meat Purchase',
      'Packaging Materials',
      'Seasonings & Spices',
      'Equipment',
      'Other Supplies',
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim() || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    const totalAmount = parseFloat(formData.amount);

    let paymentDetails = {};
    if (formData.paymentMethod === 'cash') {
      paymentDetails = { cash: totalAmount };
    } else if (formData.paymentMethod === 'mpesa') {
      paymentDetails = { mpesa: totalAmount };
    } else if (formData.paymentMethod === 'split') {
      const cash = parseFloat(formData.cashAmount) || 0;
      const mpesa = parseFloat(formData.mpesaAmount) || 0;
      if (cash + mpesa !== totalAmount) {
        alert('Cash and Mpesa amounts must add up to the total amount');
        return;
      }
      paymentDetails = { cash, mpesa };
    }

    try {
      await createExpense({
        ...formData,
        amount: totalAmount,
        paymentDetails,
        recordedBy: currentUser?.email || 'Unknown',
        timestamp: new Date(formData.date).toISOString(),
      });

      // Reset form
      setFormData({
        type: 'petty_cash',
        category: '',
        description: '',
        amount: '',
        recipient: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        cashAmount: '',
        mpesaAmount: '',
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(expenseId);
    }
  };

  // Filter expenses by date and type
  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(expense => expense.type === filterType);
    }

    // Filter by date
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(expense => {
      const expenseDate = new Date(expense.timestamp);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === targetDate.getTime();
    });

    return filtered;
  }, [expenses, selectedDate, filterType]);

  // Calculate totals
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.timestamp);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    });

    const todayTotal = todayExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const todayPettyCash = todayExpenses
      .filter(exp => exp.type === 'petty_cash')
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const todaySupplier = todayExpenses
      .filter(exp => exp.type === 'supplier')
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    const allTimeTotal = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const allTimePettyCash = expenses
      .filter(exp => exp.type === 'petty_cash')
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const allTimeSupplier = expenses
      .filter(exp => exp.type === 'supplier')
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    const selectedTotal = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    return {
      todayTotal,
      todayPettyCash,
      todaySupplier,
      allTimeTotal,
      allTimePettyCash,
      allTimeSupplier,
      selectedTotal,
    };
  }, [expenses, filteredExpenses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses & Payments</h1>
          <p className="text-gray-600 mt-1">Track petty cash and supplier payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
        >
          <Plus size={20} />
          Record Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown size={24} />
            <span className="text-red-200 text-sm">Today</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{formatPrice(stats.todayTotal)}</h3>
          <p className="text-red-100 text-sm">Total Expenses</p>
          <div className="mt-3 pt-3 border-t border-red-400 text-sm">
            <div className="flex justify-between">
              <span>Petty Cash:</span>
              <span className="font-semibold">{formatPrice(stats.todayPettyCash)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Suppliers:</span>
              <span className="font-semibold">{formatPrice(stats.todaySupplier)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Coffee size={24} className="text-orange-600" />
            <span className="text-gray-500 text-sm">All Time</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatPrice(stats.allTimePettyCash)}</h3>
          <p className="text-gray-600 text-sm">Petty Cash</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart size={24} className="text-blue-600" />
            <span className="text-gray-500 text-sm">All Time</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatPrice(stats.allTimeSupplier)}</h3>
          <p className="text-gray-600 text-sm">Supplier Payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Expenses</option>
              <option value="petty_cash">Petty Cash Only</option>
              <option value="supplier">Supplier Payments Only</option>
            </select>
          </div>

          <div className="ml-auto">
            <div className="text-sm text-gray-600">
              Selected Date Total: <span className="font-bold text-gray-900">{formatPrice(stats.selectedTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Expenses for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No expenses recorded for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        expense.type === 'petty_cash' 
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {expense.type === 'petty_cash' ? 'Petty Cash' : 'Supplier'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {expense.recipient || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatPrice(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.paymentDetails ? (
                        expense.paymentDetails.cash && expense.paymentDetails.mpesa ? (
                          <div>
                            <div className="text-green-600">Cash: {formatPrice(expense.paymentDetails.cash)}</div>
                            <div className="text-blue-600">M-Pesa: {formatPrice(expense.paymentDetails.mpesa)}</div>
                          </div>
                        ) : expense.paymentDetails.cash ? (
                          <span className="text-green-600">Cash</span>
                        ) : (
                          <span className="text-blue-600">M-Pesa</span>
                        )
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {expense.recordedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(expense.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Record Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Expense Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Type <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'petty_cash', category: '' })}
                    className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                      formData.type === 'petty_cash'
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Coffee size={20} />
                    Petty Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'supplier', category: '' })}
                    className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                      formData.type === 'supplier'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ShoppingCart size={20} />
                    Supplier Payment
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {expenseCategories[formData.type].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter details about this expense"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (KES) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Recipient (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient/Paid To (Optional)
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Person or company name"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cash', cashAmount: '', mpesaAmount: '' })}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.paymentMethod === 'cash'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'mpesa', cashAmount: '', mpesaAmount: '' })}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.paymentMethod === 'mpesa'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'split' })}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.paymentMethod === 'split'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Split
                  </button>
                </div>
              </div>

              {/* Split Payment Details */}
              {formData.paymentMethod === 'split' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cash Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cashAmount}
                      onChange={(e) => setFormData({ ...formData, cashAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      M-Pesa Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.mpesaAmount}
                      onChange={(e) => setFormData({ ...formData, mpesaAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
