import { useOrders } from '../contexts/OrderContext';
import { formatPrice, formatDate } from '../utils/formatters';
import { Package, Calendar, DollarSign, FileText, Download } from 'lucide-react';
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

  const todaysSales = getTodaysSales();
  const totalSales = getTotalSales();
  const todaysTotal = todaysSales.reduce((sum, order) => sum + order.total, 0);

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          icon={<Package size={32} />}
          title="Total Orders"
          value={orders.length}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          icon={<Calendar size={32} />}
          title="Today's Orders"
          value={todaysSales.length}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          icon={<DollarSign size={32} />}
          title="Today's Sales"
          value={formatPrice(todaysTotal)}
          color="bg-meat-light text-meat"
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => exportOrdersToPDF(orders)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Download size={16} />
                Export PDF
              </button>
              <button
                onClick={() => exportOrdersToExcel(orders)}
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
                  <th className="text-left py-3 px-4">Date & Time</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{order.id}</td>
                    <td className="py-3 px-4 text-sm">{formatDate(order.timestamp)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-meat">
                      {formatPrice(order.total)}
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

function StatsCard({ icon, title, value, color }) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}