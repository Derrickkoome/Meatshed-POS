import { useState } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, calculateWeightPrice } from '../utils/formatters';
import { Calendar, Plus, Minus, Trash2, Save, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManualOrderPage() {
  const { products } = useProducts();
  const { createOrder } = useOrders();
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5));
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.title} added to order`);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success('Item removed from order');
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Order cleared');
  };

  const calculateTotal = () => {
    const cartTotal = cart.reduce((sum, item) => sum + calculateWeightPrice(item.quantity, item.price), 0);
    return cartTotal + parseFloat(deliveryCost || 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to the order');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      // Combine date and time to create a timestamp
      const orderDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const total = calculateTotal();
      const subtotal = total / 1.16;
      const tax = total - subtotal;
      
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image || '',
          stock: item.stock || 0
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        ...(deliveryCost > 0 && {
          deliveryCost: parseFloat(deliveryCost)
        }),
        paymentMethod,
        cashier: currentUser?.email || 'Admin',
        timestamp: orderDateTime.toISOString(),
        customerName: 'Walk-in Customer',
        isManualEntry: true,
      };

      await createOrder(orderData);
      
      toast.success(`Order added successfully for ${new Date(orderDateTime).toLocaleString()}`);
      setCart([]);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedTime(new Date().toTimeString().slice(0, 5));
      setPaymentMethod('Cash');
      setDeliveryCost(0);
    } catch (error) {
      console.error('Error adding manual order:', error);
      toast.error('Failed to add order. Please check your internet connection.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Manual Order Entry</h1>
        <p className="text-gray-600">Add orders for past dates or when the system was offline</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Select Products</h2>
            
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-meat focus:border-transparent"
            />

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <h3 className="font-semibold text-sm mb-1">{product.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-meat">{formatPrice(product.price)}</span>
                    <button className="p-1 bg-meat text-white rounded-full hover:bg-meat-dark transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="text-meat" />
              Order Details
            </h2>

            {/* Date and Time Selection */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} />
                Order Date & Time
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-meat focus:border-transparent"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-2">
                {new Date(`${selectedDate}T${selectedTime}`).toLocaleString()}
              </p>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              >
                <option value="Cash">Cash</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Delivery Cost */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Cost (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
                placeholder="Enter delivery cost"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              />
              {deliveryCost > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  +{formatPrice(deliveryCost)}
                </p>
              )}
            </div>

            {/* Cart Items */}
            <div className="mb-4 max-h-[300px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <p className="text-xs text-gray-600">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t pt-4 mb-4">
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-meat">{formatPrice(calculateTotal())}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleSubmitOrder}
                disabled={cart.length === 0}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                Save Order
              </button>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={20} />
                Clear Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
