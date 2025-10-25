import { useProducts } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/formatters';
import { Search, ShoppingCart, Trash2, Loader, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

export default function POSPage() {
  const { products, loading, searchProducts, fetchProducts } = useProducts();
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
  
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    } else {
      fetchProducts();
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    // TODO: Handle checkout in later phase
    alert(`Checkout with ${paymentMethod}\nTotal: ${formatPrice(getCartTotal())}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
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
              {products.map((product) => (
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

            {/* Payment Method */}
            {cartItems.length > 0 && (
              <>
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

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-meat">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="w-full btn-primary"
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
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
          src={product.thumbnail || product.images?.[0]}
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