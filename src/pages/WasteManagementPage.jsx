import { useState, useEffect } from 'react';
import { useWaste } from '../contexts/WasteContext';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, formatDate } from '../utils/formatters';
import { Trash2, Plus, X, AlertTriangle, TrendingDown, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WasteManagementPage() {
  const { wasteRecords, loading, createWasteRecord, deleteWasteRecord } = useWaste();
  const { products } = useProducts();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('spoiled');
  const [notes, setNotes] = useState('');
  const [filterReason, setFilterReason] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const wasteReasons = [
    { value: 'spoiled', label: 'Spoiled/Expired' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'contaminated', label: 'Contaminated' },
    { value: 'overstock', label: 'Overstock' },
    { value: 'quality', label: 'Quality Issue' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Product not found');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (quantityNum <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (quantityNum > product.stock) {
      toast.error(`Only ${product.stock} ${product.unit} available in stock`);
      return;
    }

    try {
      await createWasteRecord({
        productId: selectedProduct,
        productName: product.title,
        quantity: quantityNum,
        unit: product.unit,
        costPerUnit: product.price,
        totalCost: quantityNum * product.price,
        reason,
        notes,
        recordedBy: currentUser?.email || 'Unknown'
      });

      toast.success('Waste record created successfully');
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create waste record');
      console.error(error);
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setQuantity('');
    setReason('spoiled');
    setNotes('');
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this waste record?')) {
      try {
        await deleteWasteRecord(recordId);
        toast.success('Waste record deleted');
      } catch (error) {
        toast.error('Failed to delete waste record');
      }
    }
  };

  // Filter records
  const filteredRecords = wasteRecords.filter(record => {
    const matchesReason = filterReason === 'all' || record.reason === filterReason;
    
    if (!startDate && !endDate) return matchesReason;
    
    const recordDate = new Date(record.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const matchesDate = (!start || recordDate >= start) && (!end || recordDate <= end);
    
    return matchesReason && matchesDate;
  });

  // Calculate statistics
  const stats = {
    totalRecords: filteredRecords.length,
    totalCost: filteredRecords.reduce((sum, r) => sum + r.totalCost, 0),
    byReason: wasteReasons.reduce((acc, wr) => {
      const reasonRecords = filteredRecords.filter(r => r.reason === wr.value);
      acc[wr.value] = {
        count: reasonRecords.length,
        cost: reasonRecords.reduce((sum, r) => sum + r.totalCost, 0)
      };
      return acc;
    }, {}),
    topProducts: Object.values(
      filteredRecords.reduce((acc, record) => {
        if (!acc[record.productId]) {
          acc[record.productId] = {
            name: record.productName,
            quantity: 0,
            cost: 0,
            count: 0
          };
        }
        acc[record.productId].quantity += record.quantity;
        acc[record.productId].cost += record.totalCost;
        acc[record.productId].count += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.cost - a.cost).slice(0, 5)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trash2 className="text-red-600" size={36} />
            Waste Management
          </h1>
          <p className="text-gray-600 mt-2">Track spoiled, damaged, and discarded inventory</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Record Waste
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg">
          <Trash2 size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Records</p>
          <p className="text-3xl font-bold">{stats.totalRecords}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
          <TrendingDown size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Waste Cost</p>
          <p className="text-3xl font-bold">{formatPrice(stats.totalCost)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg">
          <AlertTriangle size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Most Common</p>
          <p className="text-lg font-bold">
            {Object.entries(stats.byReason)
              .sort((a, b) => b[1].count - a[1].count)[0]?.[0] 
              ? wasteReasons.find(r => r.value === Object.entries(stats.byReason).sort((a, b) => b[1].count - a[1].count)[0][0])?.label
              : 'N/A'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <Package size={32} className="mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Products Affected</p>
          <p className="text-3xl font-bold">{stats.topProducts.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Reasons</option>
              {wasteReasons.map(wr => (
                <option key={wr.value} value={wr.value}>{wr.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Top Wasted Products */}
      {stats.topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Wasted Products</h3>
          <div className="space-y-3">
            {stats.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-red-300">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.count} records • {product.quantity.toFixed(2)} units wasted</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-red-600">{formatPrice(product.cost)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waste Records Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Waste Records</h3>
          <p className="text-sm text-gray-600 mt-1">Showing {filteredRecords.length} records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No waste records found</td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{record.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.quantity} {record.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatPrice(record.totalCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {wasteReasons.find(wr => wr.value === record.reason)?.label || record.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.recordedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Waste Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trash2 className="text-red-600" />
                Record Waste
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.title} (Stock: {product.stock} {product.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  {wasteReasons.map(wr => (
                    <option key={wr.value} value={wr.value}>{wr.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Record Waste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
