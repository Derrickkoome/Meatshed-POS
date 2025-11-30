import { formatPrice, formatDate, calculateWeightPrice } from '../utils/formatters';
import { Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Receipt({ order, onClose }) {
  const printedRef = useRef(false);
  const printTimeoutRef = useRef(null);
  const isPrintingRef = useRef(false);

  const handlePrint = () => {
    // Prevent multiple print requests
    if (isPrintingRef.current || printedRef.current) {
      console.log('Print already in progress or blocked, ignoring request');
      return;
    }

    // Clear any pending timeout
    if (printTimeoutRef.current) {
      clearTimeout(printTimeoutRef.current);
    }

    // Block further print requests
    isPrintingRef.current = true;
    printedRef.current = true;
    
    // Trigger print
    window.print();
    
    // Reset after delay - longer timeout to prevent rapid clicking
    printTimeoutRef.current = setTimeout(() => {
      isPrintingRef.current = false;
      printedRef.current = false;
      printTimeoutRef.current = null;
    }, 3000); // 3 seconds cooldown
  };

  // Cleanup and event listeners
  useEffect(() => {
    const handleBeforePrint = () => {
      console.log('Print dialog opened');
      isPrintingRef.current = true;
    };

    const handleAfterPrint = () => {
      console.log('Print dialog closed');
      // Reset flags when print dialog is closed
      isPrintingRef.current = false;
      printedRef.current = false;
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
        printTimeoutRef.current = null;
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
      }
    };
  }, []);

  // Receipt content component (reused for both screen and print)
  const receiptContent = (
    <div className="space-y-3 leading-relaxed">
            {/* Shop Header */}
            <div className="text-center border-b-2 border-dashed border-gray-900 pb-3 mb-2">
              <div className="flex justify-center mb-2">
                <img src="/logo.png" alt="MeatShed Logo" className="h-12 w-12 object-contain" />
              </div>
              <h1 className="text-base font-bold">The MeatShed</h1>
              <p className="text-sm font-semibold">Where Meat Meets Mastery</p>
              <p className="text-sm">Nairobi, Kenya</p>
              <p className="text-sm">Tel: +254 707 899 178</p>
            </div>

            {/* Order Details */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-bold">{order.id?.slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(order.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{order.cashier || 'Admin'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>
              
              {/* Split Payment Details */}
              {order.paymentDetails?.isSplit && order.paymentDetails.splitPayments && (
                <div className="mt-2 pt-2 border-t border-gray-400">
                  <div className="font-bold text-sm mb-1">Payment Breakdown:</div>
                  {order.paymentDetails.splitPayments.map((payment, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{payment.method}:</span>
                      <span className="font-semibold">{formatPrice(payment.amount)}</span>
                    </div>
                  ))}
                  {order.paymentDetails.changeGiven > 0 && (
                    <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-300">
                      <span>Cash Change:</span>
                      <span className="font-bold">{formatPrice(order.paymentDetails.changeGiven)}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Single Payment Details (Cash) */}
              {!order.paymentDetails?.isSplit && order.paymentMethod === 'Cash' && order.paymentDetails && (
                <>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="font-bold">{formatPrice(order.paymentDetails.amountPaid)}</span>
                  </div>
                  {order.paymentDetails.changeGiven > 0 && (
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span className="font-bold">{formatPrice(order.paymentDetails.changeGiven)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Items */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-2">
              <div className="font-bold text-sm mb-2">ITEMS:</div>
              <div className="text-sm">
                {order.items.map((item, index) => (
                  <div key={index} className="border-b border-gray-500 py-2">
                    <div className="font-bold break-words">{item.title}</div>
                    <div className="flex justify-between">
                      <span>{item.quantity} x {formatPrice(item.price)}</span>
                      <span className="font-bold">{formatPrice(calculateWeightPrice(item.quantity, item.price))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax (16%):</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.discount && (
                <div className="flex justify-between">
                  <span>Discount ({order.discount.type === 'percentage' ? `${order.discount.value}%` : 'Fixed'}):</span>
                  <span>-{formatPrice(order.discount.amount)}</span>
                </div>
              )}
              {order.deliveryCost > 0 && (
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>+{formatPrice(order.deliveryCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t-2 border-gray-900 pt-2 mt-2">
                <span>TOTAL:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-3 text-center text-sm">
              <div className="font-bold mb-1">Thank you for your purchase!</div>
              <div>Fresh quality meats delivered daily</div>
            </div>
          </div>
  );

  return (
    <>
      {/* Screen-only modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-lg w-[80mm] max-h-[90vh] overflow-y-auto">
          <div className="p-4">
            {/* Header - Only show on screen */}
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h2 className="text-lg font-bold">Receipt Preview</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            {/* Show receipt content on screen - scaled to thermal printer size */}
            <div className="text-xs">
              {receiptContent}
            </div>

            {/* Action Buttons - Only show on screen */}
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2">
                Close
              </button>
              <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2">
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only section */}
      <div className="hidden print:block">
        <div id="receipt-content">
          {receiptContent}
        </div>
      </div>
    </>
  );
}