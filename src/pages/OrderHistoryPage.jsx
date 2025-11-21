import { useOrders } from '../contexts/OrderContext';
import { formatPrice, formatDate } from '../utils/formatters';
import { Package, Calendar, DollarSign, FileText, Download, Truck } from 'lucide-react';
import { useState } from 'react';
import Receipt from '../components/Receipt';
import { 
  exportOrdersToPDF, 
  exportOrdersToExcel,
  exportReceiptToPDF,
  exportOrderDetailsToExcel 
} from '../utils/exportUtils';

export default function OrderHistoryPage() {
  const { orders, getTotalSales, getTodaysSales } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'walk-in', 'online'

  const todaysSales = getTodaysSales();
  const totalSales = getTotalSales();
  const todaysTotal = todaysSales.reduce((sum, order) => sum + order.total, 0);

  // Filter orders based on type
  const filteredOrders = orders.filter(order => {
    if (filterType === 'all') return true;
    if (filterType === 'online') return order.isOnlineOrder === true;
    if (filterType === 'walk-in') return !order.isOnlineOrder;
    return true;
  });

  // Calculate online vs walk-in stats
  const onlineOrders = orders.filter(o => o.isOnlineOrder);
  const walkInOrders = orders.filter(o => !o.isOnlineOrder);
  const onlineTotal = onlineOrders.reduce((sum, o) => sum + o.total, 0);
  const walkInTotal = walkInOrders.reduce((sum, o) => sum + o.total, 0);

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard
          icon={<Package size={28} />}
          title="Total Orders"
          value={orders.length}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          icon={<Calendar size={28} />}
          title="Today's Orders"
          value={todaysSales.length}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          icon={<DollarSign size={28} />}
          title="Today's Sales"
          value={formatPrice(todaysTotal)}
          color="bg-meat-light text-meat"
        />
        <StatsCard
          icon={<Truck size={28} />}
          title="Online Deliveries"
          value={`${onlineOrders.length} (${formatPrice(onlineTotal)})`}
          color="bg-purple-100 text-purple-600"
          subtitle="Online orders"
        />
        <StatsCard
          icon={<Package size={28} />}
          title="Walk-in Sales"
          value={`${walkInOrders.length} (${formatPrice(walkInTotal)})`}
          color="bg-orange-100 text-orange-600"
          subtitle="POS sales"
        />
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg">No orders yet</p>
          <p className="text-gray-500 mt-2">Complete your first sale to see it here</p>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filterType === 'all'
                      ? 'bg-meat text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => setFilterType('walk-in')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filterType === 'walk-in'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Walk-in ({walkInOrders.length})
                </button>
                <button
                  onClick={() => setFilterType('online')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
                    filterType === 'online'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Truck size={14} />
                  Online ({onlineOrders.length})
                </button>
              </div>
            </div>
            
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => exportOrdersToPDF(filteredOrders)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Download size={16} />
                Export PDF
              </button>
              <button
                onClick={() => exportOrdersToExcel(filteredOrders)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Download size={16} />
                Export Excel
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Date & Time</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Payment Method</th>
                  <th className="text-left py-3 px-4">Discount</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{order.id}</td>
                    <td className="py-3 px-4">
                      {order.isOnlineOrder ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1 w-fit">
                          <Truck size={12} />
                          Online
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold w-fit">
                          Walk-in
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium">{order.customerName || 'Walk-in Customer'}</div>
                      {order.customerPhone && (
                        <div className="text-xs text-gray-500">{order.customerPhone}</div>
                      )}
                      {order.isOnlineOrder && order.deliveryAddress && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {order.deliveryAddress}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium">{formatDate(order.timestamp)}</div>
                      {order.isOnlineOrder && (
                        <div className="text-xs text-gray-500 mt-1">
                          💳 Paid: {formatDate(order.timestamp)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.paymentMethod === 'Online Delivery'
                          ? 'bg-purple-100 text-purple-700 font-semibold'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {order.discount ? (
                        <div className="text-sm">
                          <span className="font-semibold text-green-600">
                            -{formatPrice(order.discount.amount)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {order.discount.type === 'percentage' 
                              ? `${order.discount.value}% off` 
                              : 'Fixed discount'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-meat">
                      {formatPrice(order.total)}
                      {order.discount && (
                        <div className="text-xs text-gray-500 font-normal line-through">
                          {formatPrice(order.total + order.discount.amount)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewReceipt(order)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          title="View Receipt"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => exportReceiptToPDF(order)}
                          className="text-green-600 hover:text-green-700"
                          title="Export PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => exportOrderDetailsToExcel(order)}
                          className="text-purple-600 hover:text-purple-700"
                          title="Export Excel"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No {filterType === 'online' ? 'online delivery' : filterType === 'walk-in' ? 'walk-in' : ''} orders found
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedOrder && (
        <Receipt 
          order={selectedOrder} 
          onClose={() => {
            setShowReceipt(false);
            setSelectedOrder(null);
          }} 
        />
      )}
    </div>
  );
}

function StatsCard({ icon, title, value, color, subtitle }) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}