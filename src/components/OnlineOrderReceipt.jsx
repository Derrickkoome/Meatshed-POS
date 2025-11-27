import { formatPrice, formatDate } from '../utils/formatters';
import { Printer, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function OnlineOrderReceipt({ order, onClose, autoPrint = false }) {
  const printedRef = useRef(false);
  const printTimeoutRef = useRef(null);
  const isPrintingRef = useRef(false);

  // Auto-print on mount if requested
  useEffect(() => {
    if (autoPrint && !printedRef.current) {
      // Delay to allow component to fully render
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header - Only show on screen */}
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h2 className="text-2xl font-bold">Online Order Receipt</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          {/* Receipt Content */}
          <div id="online-receipt-content" className="space-y-3 leading-relaxed">
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

            {/* Order Type Badge */}
            <div className="text-center text-sm font-bold py-2">
              === ONLINE DELIVERY ===
            </div>

            {/* Order Details */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-bold">{order.id?.slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-bold">{order.deliveryDate || 'ASAP'}</span>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-2">
              <div className="font-bold text-sm mb-2">CUSTOMER:</div>
              <div className="text-sm space-y-1">
                <div>{order.customerName}</div>
                <div>Ph: {order.customerPhone}</div>
                <div className="font-bold mt-2">Address:</div>
                <div className="break-words">{order.customerAddress}</div>
                {order.notes && (
                  <div className="mt-2">
                    <div className="font-bold">Notes:</div>
                    <div className="italic break-words">{order.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-2">
              <div className="font-bold text-sm mb-2">ITEMS:</div>
              <div className="text-sm">
                {order.items.map((item, index) => (
                  <div key={index} className="border-b border-gray-500 py-2">
                    <div className="font-bold break-words">{item.productName}</div>
                    <div className="flex justify-between">
                      <span>{item.quantity} x {formatPrice(item.price)}</span>
                      <span className="font-bold">{formatPrice(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-900 pt-2 mt-2">
              <div className="flex justify-between text-base font-bold">
                <span>TOTAL:</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-3">
              <div className="font-bold text-sm mb-2">M-PESA PAYMENT</div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Paybill:</span>
                  <span>247247</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Account:</span>
                  <span>0722902045</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Amount:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="mt-3 leading-relaxed space-y-1">
                  <div className="font-bold">How to Pay:</div>
                  <div>1. M-Pesa &gt; Lipa na M-Pesa</div>
                  <div>2. Paybill &gt; 247247</div>
                  <div>3. Account &gt; 0722902045</div>
                  <div>4. Amount &gt; {formatPrice(order.totalAmount)}</div>
                  <div>5. Enter PIN &amp; Confirm</div>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-3">
              <div className="text-sm space-y-1">
                <div><span className="font-bold">Status:</span> <span className="uppercase font-bold">{order.status}</span></div>
                <div>Order processed after payment</div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-gray-900 pt-3 mt-3 text-center text-sm">
              <div className="font-bold mb-1">Thank you for your order!</div>
              <div className="mt-2">Fresh quality meats</div>
              <div>delivered to your doorstep</div>
              <div className="mt-2">Tel: +254 707 899 178</div>
              <div className="mt-2 font-bold">Keep this receipt</div>
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
