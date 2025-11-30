import { useState, useEffect } from 'react';
import { useStockAdjustments } from '../contexts/StockAdjustmentContext';
import { useProducts } from '../contexts/ProductContext';
import { formatDate } from '../utils/formatters';
import { History, Filter, Search, ArrowUp, ArrowDown, Calendar, User, FileText } from 'lucide-react';

export default function StockAdjustmentPage() {
  const { adjustments, loading } = useStockAdjustments();
  const { products } = useProducts();
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const adjustmentTypes = [
    { value: 'stock_in', label: 'Stock In', color: 'green' },
    { value: 'stock_out', label: 'Stock Out', color: 'red' },
    { value: 'adjustment', label: 'Adjustment', color: 'blue' },
    { value: 'return', label: 'Return', color: 'purple' },
    { value: 'damage', label: 'Damage', color: 'orange' },
    { value: 'correction', label: 'Correction', color: 'yellow' }
  ];

  // Filter adjustments
  const filteredAdjustments = adjustments.filter(adj => {
    const matchesProduct = filterProduct === 'all' || adj.productId === filterProduct;
    const matchesType = filterType === 'all' || adj.type === filterType;
    const matchesSearch = !searchTerm || 
      adj.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.performedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!startDate && !endDate) {
      return matchesProduct && matchesType && matchesSearch;
    }
    
    const adjDate = new Date(adj.timestamp);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const matchesDate = (!start || adjDate >= start) && (!end || adjDate <= end);
    
    return matchesProduct && matchesType && matchesSearch && matchesDate;
  });

  // Calculate statistics
  const stats = {
    totalAdjustments: filteredAdjustments.length,
    byType: adjustmentTypes.reduce((acc, type) => {
      acc[type.value] = filteredAdjustments.filter(a => a.type === type.value).length;
      return acc;
    }, {}),
    recentActivity: filteredAdjustments
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
  };

  const getTypeColor = (type) => {
    const typeConfig = adjustmentTypes.find(t => t.value === type);
    return typeConfig?.color || 'gray';
  };

  const getTypeLabel = (type) => {
    const typeConfig = adjustmentTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <History className="text-blue-600" size={36} />
          Stock Adjustment History
        </h1>
        <p className="text-gray-600 mt-2">Complete audit trail of all inventory changes</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg">
          <History size={28} className="mb-2 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Records</p>
          <p className="text-2xl font-bold">{stats.totalAdjustments}</p>
        </div>
        {adjustmentTypes.slice(0, 5).map(type => (
          <div key={type.value} className={`bg-gradient-to-br from-${type.color}-500 to-${type.color}-600 text-white rounded-xl p-5 shadow-lg`}>
            {type.value === 'stock_in' && <ArrowUp size={28} className="mb-2 opacity-90" />}
            {type.value === 'stock_out' && <ArrowDown size={28} className="mb-2 opacity-90" />}
            {!['stock_in', 'stock_out'].includes(type.value) && <FileText size={28} className="mb-2 opacity-90" />}
            <p className="text-sm opacity-90 mb-1">{type.label}</p>
            <p className="text-2xl font-bold">{stats.byType[type.value] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Filters & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Product, reason, user..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {adjustmentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Adjustment Records</h3>
          <p className="text-sm text-gray-600 mt-1">Showing {filteredAdjustments.length} records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    Date & Time
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    Performed By
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <History className="mx-auto text-gray-300 mb-2" size={48} />
                    <p>No adjustment records found</p>
                  </td>
                </tr>
              ) : (
                filteredAdjustments
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((adjustment) => {
                    const change = adjustment.newQuantity - adjustment.previousQuantity;
                    const isIncrease = change > 0;
                    
                    return (
                      <tr key={adjustment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(adjustment.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{adjustment.productName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getTypeColor(adjustment.type)}-100 text-${getTypeColor(adjustment.type)}-800`}>
                            {getTypeLabel(adjustment.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {adjustment.previousQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {adjustment.newQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                          <div className={`flex items-center gap-1 ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncrease ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                            {isIncrease ? '+' : ''}{change}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {adjustment.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {adjustment.performedBy}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Summary */}
      {stats.recentActivity.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="text-blue-600" size={20} />
            Recent Activity Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentActivity.slice(0, 3).map((adj, index) => {
              const change = adj.newQuantity - adj.previousQuantity;
              const isIncrease = change > 0;
              
              return (
                <div key={adj.id} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${getTypeColor(adj.type)}-100 text-${getTypeColor(adj.type)}-800`}>
                      {getTypeLabel(adj.type)}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(adj.timestamp)}</span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">{adj.productName}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">{adj.previousQuantity}</span>
                    <span className={isIncrease ? 'text-green-600' : 'text-red-600'}>→</span>
                    <span className="font-bold text-gray-900">{adj.newQuantity}</span>
                    <span className={`font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                      ({isIncrease ? '+' : ''}{change})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
