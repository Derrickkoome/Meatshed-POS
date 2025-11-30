import { useProducts } from '../contexts/ProductContext';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { useCustomers } from '../contexts/CustomerContext';
import { useDebts } from '../contexts/DebtContext';
import { formatPrice } from '../utils/formatters';
import { Search, ShoppingCart, Trash2, Loader, Plus, Minus, Barcode, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import Receipt from '../components/Receipt';
import PaymentModal from '../components/PaymentModal';
import SplitPaymentModal from '../components/SplitPaymentModal';
import toast from 'react-hot-toast';
import { BrowserMultiFormatReader } from '@zxing/browser';

const STORAGE_KEY = 'meatshed:inventory';

export default function POSPage() {
  const { products, loading, searchProducts, fetchProducts, updateProduct, searchProductByBarcode } = useProducts();
  const { createOrder } = useOrders();
  const { currentUser } = useAuth();
  const { findCustomerByPhone, addLoyaltyPoints } = useCustomers();
  const { createDebt } = useDebts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cartItems, setCartItems] = useState([]);
  const [discountType, setDiscountType] = useState('none'); // 'none', 'percentage', 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeReader, setBarcodeReader] = useState(null);
  const [inventory, setInventory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const categories = {
    all: { name: 'All', icon: '🥩' },
    beef: { name: 'Beef', icon: '🐄' },
    chicken: { name: 'Chicken', icon: '🐔' },
    goat: { name: 'Goat', icon: '🐐' },
    lamb: { name: 'Lamb', icon: '🐑' },
    pork: { name: 'Pork', icon: '🐷' },
    processed: { name: 'Processed', icon: '🌭' },
  };

  // ✅ Add to cart with NUMBER quantity
  const addToCart = (product) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        id: product.id,
        title: product.title,
        price: Number(product.price), // ✅ Ensure price is number
        quantity: 1, // ✅ Start with number
        image: product.thumbnail || product.images?.[0],
        stock: product.stock,
      };
      setCartItems((prev) => [...prev, newItem]);
      toast.success(`${product.title} added to cart`);
    }
  };

  // ✅ Update quantity as NUMBER (supports decimals)
  const updateQuantity = (productId, newQuantity) => {
    const qty = parseFloat(newQuantity); // ✅ Use parseFloat instead of Number for decimals
    
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cartItems.find(i => i.id === productId);
    if (item && qty > item.stock) {
      toast.error('Cannot exceed available stock');
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: qty } // ✅ Store decimal number
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // ✅ Calculate total with numbers
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (Number(item.price) * Number(item.quantity));
    }, 0);
  };

  // Calculate discount amount
  const getDiscountAmount = () => {
    const subtotal = getCartTotal();
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      return Math.min(discountValue, subtotal); // Can't discount more than subtotal
    }
    return 0;
  };

  // Get final total after discount and delivery
  const getFinalTotal = () => {
    const afterDiscount = Math.max(0, getCartTotal() - getDiscountAmount());
    return afterDiscount + parseFloat(deliveryCost || 0);
  };

  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    } else {
      fetchProducts();
    }
  };

  const handleCustomerSearch = async () => {
    if (!customerPhone.trim()) {
      setSelectedCustomer(null);
      return;
    }

    const customer = await findCustomerByPhone(customerPhone);
    if (customer) {
      setSelectedCustomer(customer);
      toast.success(`Customer found: ${customer.name}`);
    } else {
      setSelectedCustomer(null);
      toast.error('Customer not found');
    }
  };

  // Barcode scanning functions
  const startBarcodeScan = async () => {
    try {
      const codeReader = new BrowserMultiFormatReader();
      setBarcodeReader(codeReader);
      setShowBarcodeScanner(true);

      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        toast.error('No camera found');
        return;
      }

      const selectedDeviceId = videoInputDevices[0].deviceId;

      codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
        if (result) {
          handleBarcodeScanned(result.getText());
        }
        if (err && !(err instanceof Error)) {
          console.error(err);
        }
      });
    } catch (error) {
      console.error('Error starting barcode scan:', error);
      toast.error('Failed to start barcode scanner');
    }
  };

  const stopBarcodeScan = () => {
    if (barcodeReader) {
      barcodeReader.reset();
      setBarcodeReader(null);
    }
    setShowBarcodeScanner(false);
  };

  const handleBarcodeScanned = async (barcode) => {
    try {
      stopBarcodeScan();
      
      const product = await searchProductByBarcode(barcode);
      if (product) {
        addToCart(product);
        toast.success(`Scanned: ${product.title}`);
      } else {
        toast.error('Product not found with this barcode');
      }
    } catch (error) {
      console.error('Error searching product by barcode:', error);
      toast.error('Failed to search product');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }

    // Prevent double-clicking
    if (isProcessingCheckout) {
      return;
    }

    // For credit sales, customer info is required
    if (paymentMethod === 'Credit' && !selectedCustomer) {
      toast.error('Please select a customer for credit sales');
      return;
    }

    // Check stock availability
    for (const item of cartItems) {
      const product = products.find(p => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        toast.error(`Insufficient stock for ${item.title}`);
        return;
      }
    }

    // Show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentDetails) => {
    setShowPaymentModal(false);

    setIsProcessingCheckout(true);
    try {
      // Calculate totals with discount
      const cartTotal = getCartTotal();
      const discountAmount = getDiscountAmount();
      const finalTotal = getFinalTotal();
      const subtotal = finalTotal / 1.16;
      const tax = finalTotal - subtotal;

      // ✅ Ensure all quantities are NUMBERS (including decimals) in the order
      const order = {
        items: cartItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity), // ✅ Support decimal quantities
          price: parseFloat(item.price),
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(finalTotal.toFixed(2)),
        ...(discountAmount > 0 && {
          discount: {
            type: discountType,
            value: discountValue,
            amount: parseFloat(discountAmount.toFixed(2))
          }
        }),
        ...(deliveryCost > 0 && {
          deliveryCost: parseFloat(deliveryCost)
        }),
        paymentMethod,
        ...(paymentDetails && { paymentDetails }), // Add payment details (cash amount, change)
        cashier: currentUser?.email || 'Guest',
        timestamp: new Date().toISOString(),
        ...(selectedCustomer?.id && { customerId: selectedCustomer.id }),
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        ...(selectedCustomer?.phone && { customerPhone: selectedCustomer.phone }),
      };

      const createdOrder = await createOrder(order);

      // Add loyalty points if customer is selected (1 point per KES 100)
      if (selectedCustomer?.id) {
        const pointsEarned = Math.floor(finalTotal / 100); // 1 point per KES 100
        if (pointsEarned > 0) {
          try {
            await addLoyaltyPoints(selectedCustomer.id, pointsEarned, finalTotal);
            toast.success(`Customer earned ${pointsEarned} loyalty point${pointsEarned !== 1 ? 's' : ''}!`);
          } catch (error) {
            console.error('Error adding loyalty points:', error);
            // Don't fail the order if loyalty points fail
          }
        }
      }

      // If payment method is Credit, create a debt record
      if (paymentMethod === 'Credit') {
        await createDebt({
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone,
          totalAmount: parseFloat(finalTotal.toFixed(2)),
          items: cartItems.map(item => ({
            productId: item.id,
            productName: item.title,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
            total: parseFloat((item.price * item.quantity).toFixed(2))
          })),
          orderId: createdOrder.id,
          cashier: currentUser?.email || 'Guest'
        });
        toast.success('Credit sale recorded');
      }

      // Update stock for each item
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await updateProduct(item.id, {
            stock: parseFloat((product.stock - item.quantity).toFixed(2)) // ✅ Use parseFloat for decimal quantities
          });
        }
      }

      // Show receipt
      setCompletedOrder(createdOrder);
      setShowReceipt(true);

      // Clear cart, customer, and discount
      clearCart();
      setSelectedCustomer(null);
      setCustomerPhone('');
      setDiscountType('none');
      setDiscountValue(0);
      setDeliveryCost(0);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const displayProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
      console.warn('Failed to save inventory to localStorage', e);
    }
  }, [inventory]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          {/* Category Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedCategory === key
                    ? 'bg-meat text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4 flex gap-2">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
                />
              </div>
            </form>
            <button
              type="button"
              onClick={startBarcodeScan}
              className="btn-secondary flex items-center gap-2 px-4 py-2"
              title="Scan barcode"
            >
              <Camera size={20} />
              <Barcode size={16} />
            </button>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="animate-spin text-meat" size={48} />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {displayProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onAdd={() => addToCart(product)}
                  isInCart={isInCart(product.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={24} />
                Cart ({cartItems.length})
              </h2>
              {cartItems.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                cartItems.map((item) => (
                  <CartItem 
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))
              )}
            </div>

            {/* Customer Selection */}
            {cartItems.length > 0 && (
              <>
                <div className="border-t pt-4 mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Customer {paymentMethod === 'Credit' && <span className="text-red-600">*</span>}
                    {paymentMethod === 'Credit' && (
                      <span className="text-xs text-red-600 ml-1">(Required for credit)</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                      placeholder="Enter phone number"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent text-sm ${
                        paymentMethod === 'Credit' && !selectedCustomer 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCustomerSearch}
                      className="btn-secondary text-sm px-3"
                    >
                      Search
                    </button>
                  </div>
                  {selectedCustomer && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-800">
                        ✓ {selectedCustomer.name}
                      </p>
                      <p className="text-xs text-green-600">{selectedCustomer.phone}</p>
                    </div>
                  )}
                  {paymentMethod === 'Credit' && !selectedCustomer && customerPhone && (
                    <p className="text-xs text-orange-600 mt-1">
                      💡 Customer not found. You may need to add them first.
                    </p>
                  )}
                </div>

                {/* Discount Section */}
                <div className="border-t pt-4 mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Discount
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value);
                        setDiscountValue(0);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent text-sm"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (KSH)</option>
                    </select>
                  </div>
                  {discountType !== 'none' && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percentage' ? 100 : getCartTotal()}
                        step={discountType === 'percentage' ? 1 : 0.01}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent text-sm"
                      />
                      <span className="text-sm font-semibold text-green-600">
                        -{formatPrice(getDiscountAmount())}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery Cost Section */}
                <div className="border-t pt-4 mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Delivery Cost (Optional)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryCost}
                      onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
                      placeholder="Enter delivery cost"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent text-sm"
                    />
                    {deliveryCost > 0 && (
                      <span className="text-sm font-semibold text-blue-600">
                        +{formatPrice(deliveryCost)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border-t pt-4 mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Split Payment">Split Payment (Multiple Methods)</option>
                    <option value="Credit">Credit (Pay Later)</option>
                  </select>
                  {paymentMethod === 'Credit' && !selectedCustomer && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ Customer information required for credit sales
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  {getDiscountAmount() > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-semibold">
                      <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}):</span>
                      <span>-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  {deliveryCost > 0 && (
                    <div className="flex justify-between text-sm text-blue-600 font-semibold">
                      <span>Delivery Cost:</span>
                      <span>+{formatPrice(deliveryCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal (after discount):</span>
                    <span>{formatPrice(getFinalTotal() / 1.16)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (16%):</span>
                    <span>{formatPrice(getFinalTotal() - (getFinalTotal() / 1.16))}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-meat">
                      {formatPrice(getFinalTotal())}
                    </span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessingCheckout}
                    className={`w-full btn-primary mt-4 flex items-center justify-center gap-2 ${
                      isProcessingCheckout ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isProcessingCheckout ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Processing...
                      </>
                    ) : (
                      'Complete Sale'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        paymentMethod === 'Split Payment' ? (
          <SplitPaymentModal
            totalAmount={getFinalTotal()}
            onConfirm={handlePaymentConfirm}
            onCancel={() => setShowPaymentModal(false)}
          />
        ) : (
          <PaymentModal
            totalAmount={getFinalTotal()}
            paymentMethod={paymentMethod}
            onConfirm={handlePaymentConfirm}
            onCancel={() => setShowPaymentModal(false)}
          />
        )
      )}

      {/* Receipt Modal */}
      {showReceipt && completedOrder && (
        <Receipt 
          order={completedOrder} 
          onClose={() => {
            setShowReceipt(false);
            setCompletedOrder(null);
          }} 
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Scan Barcode</h2>
              <button
                onClick={stopBarcodeScan}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <video 
                id="video" 
                width="100%" 
                height="300" 
                className="border rounded-lg"
                autoPlay
                muted
                playsInline
              ></video>
            </div>
            
            <p className="text-sm text-gray-600 text-center mb-4">
              Position barcode in front of camera
            </p>
            
            <button
              onClick={stopBarcodeScan}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd, isInCart }) {
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden">
        <img
          src={product.thumbnail || 'https://picsum.photos/300?random'}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.title}</h3>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-meat">
          {formatPrice(product.price)}
        </span>
        <span className="text-xs text-gray-500">
          Stock: {product.stock}
        </span>
      </div>

      <button 
        onClick={onAdd}
        disabled={product.stock === 0}
        className={`w-full py-2 rounded-lg font-semibold transition ${
          isInCart
            ? 'bg-green-100 text-green-700'
            : product.stock === 0
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {product.stock === 0 ? 'Out of Stock' : isInCart ? 'In Cart ✓' : 'Add to Cart'}
      </button>
    </div>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove }) {
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState(item.quantity.toString());

  const handleDirectInput = () => {
    const qty = parseFloat(inputValue);
    if (!isNaN(qty) && qty > 0) {
      onUpdateQuantity(item.id, qty);
    } else {
      setInputValue(item.quantity.toString());
    }
    setEditMode(false);
  };

  return (
    <div className="flex items-start gap-3 p-2 border rounded-lg">
      <img
        src={item.image}
        alt={item.title}
        className="w-16 h-16 object-cover rounded"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
        <p className="text-sm text-meat font-bold">{formatPrice(item.price)}</p>
        
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQuantity(item.id, Math.max(0.1, item.quantity - 0.5))}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300"
            title="Decrease by 0.5"
          >
            <Minus size={14} />
          </button>
          
          {editMode ? (
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleDirectInput}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleDirectInput();
              }}
              className="w-16 text-sm font-semibold text-center border border-meat rounded px-1 py-0.5"
              autoFocus
            />
          ) : (
            <span 
              className="text-sm font-semibold w-16 text-center cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
              onClick={() => {
                setEditMode(true);
                setInputValue(item.quantity.toString());
              }}
              title="Click to edit quantity"
            >
              {item.quantity}
            </span>
          )}
          
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 0.5)}
            disabled={item.quantity >= item.stock}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            title="Increase by 0.5"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Click quantity to edit • Subtotal: {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
