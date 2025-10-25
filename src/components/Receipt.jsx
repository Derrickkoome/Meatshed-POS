import { formatPrice, formatDate } from '../utils/formatters';
import { Printer } from 'lucide-react';

export default function Receipt({ order, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header - Only show on screen */}
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h2 className="text-2xl font-bold">Receipt</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Receipt Content */}
          <div id="receipt-content" className="space-y-4">
            {/* Shop Header */}
            <div className="text-center border-b-2 border-dashed pb-4">
              <h1 className="text-2xl font-bold text-meat">MeatShed POS</h1>
              <p className="text-sm text-gray-600">Premium Quality Meats</p>
              <p className="text-xs text-gray-500">Nairobi, Kenya</p>
              <p className="text-xs text-gray-500">Tel: +254 700 000 000</p>
            </div>

            {/* Order Details */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{formatDate(order.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cashier:</span>
                <span>{order.cashier || 'Admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="font-semibold">{order.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t-2 border-dashed pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.title}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatPrice(item.price)}</td>
                      <td className="text-right font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (16%):</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span className="text-meat">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed pt-4 text-center text-xs text-gray-600">
              <p className="mb-2">Thank you for your purchase!</p>
              <p>Fresh quality meats delivered daily</p>
              <p className="mt-2">Visit us again soon!</p>
            </div>
          </div>

          {/* Action Buttons - Only show on screen */}
          <div className="flex gap-3 mt-6 print:hidden">
            <button onClick={onClose} className="btn-secondary flex-1">
              Close
            </button>
            <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Printer size={20} />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}