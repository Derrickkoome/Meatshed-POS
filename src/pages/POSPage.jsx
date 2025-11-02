import { useProducts } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { useCustomers } from '../contexts/CustomerContext';
import { formatPrice } from '../utils/formatters';
import { Search, ShoppingCart, Trash2, Loader, Plus, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Receipt from '../components/Receipt';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'meatshed:inventory';

export default function POSPage() {
  const { products, loading, searchProducts, fetchProducts, updateProduct } = useProducts();
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity,
    getCartTotal,
    clearCart,
    paymentMethod,
    setPaymentMethod
  } = useCart();
  const { createOrder } = useOrders();
  const { currentUser } = useAuth();
  const { findCustomerByPhone } = useCustomers();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [inventory, setInventory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : /* fallback initial state */ [];
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

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
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

    try {
      // Calculate totals with tax-inclusive pricing
      const total = getCartTotal(); // This is the final price customers see
      const subtotal = total / 1.16; // Reverse calculate: base price before 16% tax
      const tax = total - subtotal; // Tax amount

      // Create order with customer info
      const order = {
        items: cartItems,
        subtotal,
        tax,
        total,
        paymentMethod,
        cashier: currentUser?.email || 'Guest',
        timestamp: new Date().toISOString(),
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || null,
      };

      const createdOrder = await createOrder(order);

      // Update stock for each item
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await updateProduct(item.id, {
            stock: product.stock - item.quantity
          });
        }
      }

      // Show receipt
      setCompletedOrder(createdOrder);
      setShowReceipt(true);

      // Clear cart and customer
      clearCart();
      setSelectedCustomer(null);
      setCustomerPhone('');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
    }
  };

  const displayProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // save local copy so dev reloads/HMR or transient network issues don't lose everything
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
      console.warn('Failed to save inventory to localStorage', e);
    }
  }, [inventory]);

  // When you re-sync from Firestore, merge instead of replacing to avoid abrupt loss:
  // setInventory(prev => mergeFromFirestore(prev, firestoreData));

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
          <form onSubmit={handleSearch} className="mb-4">
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
                  onAdd={() => addToCart(product, 1)}
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
                    Customer (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent text-sm"
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
                        {selectedCustomer.name}
                      </p>
                      <p className="text-xs text-green-600">{selectedCustomer.phone}</p>
                    </div>
                  )}
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
                  </select>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal (excl. tax):</span>
                    <span>{formatPrice(getCartTotal() / 1.16)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (16%):</span>
                    <span>{formatPrice(getCartTotal() - (getCartTotal() / 1.16))}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-meat">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="w-full btn-primary mt-4"
                  >
                    Complete Sale
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const { isInCart } = useCart();
  const inCart = isInCart(product.id);

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
          inCart
            ? 'bg-green-100 text-green-700'
            : product.stock === 0
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {product.stock === 0 ? 'Out of Stock' : inCart ? 'In Cart ✓' : 'Add to Cart'}
      </button>
    </div>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove }) {
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
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            <Minus size={14} />
          </button>
          
          <span className="text-sm font-semibold w-8 text-center">
            {item.quantity}
          </span>
          
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            <Plus size={14} />
          </button>
        </div>
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
