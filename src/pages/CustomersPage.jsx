import { useCustomers } from '../contexts/CustomerContext';
import { useOrders } from '../contexts/OrderContext';
import { formatDate, formatPrice } from '../utils/formatters';
import { Users, Search, Plus, Edit, Phone, Mail, MapPin, Loader, Trash2, Award, TrendingUp, ShoppingBag, Star, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer, getLoyaltyTier, redeemLoyaltyPoints } = useCustomers();
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!window.confirm(`Are you sure you want to delete ${customerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCustomer(customerId);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const filteredCustomers = searchQuery
    ? customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.includes(searchQuery) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  // Get top clients sorted by total spent
  const topClients = [...customers]
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 5);

  // Calculate total loyalty points
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-meat" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Star size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Loyalty Points</p>
              <p className="text-2xl font-bold">{totalLoyaltyPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent (All)</p>
              <p className="text-2xl font-bold">{formatPrice(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0))}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Award size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Platinum Members</p>
              <p className="text-2xl font-bold">{customers.filter(c => getLoyaltyTier(c.totalSpent || 0).name === 'Platinum').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients Section */}
      {topClients.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-yellow-500">⭐</span>
            Top Clients
          </h2>
          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div 
                key={client.id} 
                className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-meat text-white flex items-center justify-center text-xl font-bold">
                      {client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{client.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-meat">
                    {client.totalPurchases || 0}
                  </div>
                  <div className="text-xs text-gray-600">Orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg">No customers found</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary mt-4"
          >
            Add Your First Customer
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={setEditingCustomer}
              onDelete={handleDeleteCustomer}
              onView={setViewingCustomer}
              getLoyaltyTier={getLoyaltyTier}
            />
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <CustomerModal
          onClose={() => setShowAddModal(false)}
          onSave={addCustomer}
          title="Add New Customer"
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={(data) => updateCustomer(editingCustomer.id, data)}
          title="Edit Customer"
        />
      )}

      {/* Customer Details Modal */}
      {viewingCustomer && (
        <CustomerDetailsModal
          customer={viewingCustomer}
          orders={orders}
          onClose={() => setViewingCustomer(null)}
          getLoyaltyTier={getLoyaltyTier}
          redeemPoints={redeemLoyaltyPoints}
        />
      )}
    </div>
  );
}

function CustomerCard({ customer, onEdit, onDelete, onView, getLoyaltyTier }) {
  const tier = getLoyaltyTier(customer.totalSpent || 0);
  
  return (
    <div className="card hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onView(customer)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-meat text-white flex items-center justify-center text-xl font-bold">
            {customer.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg">{customer.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${tier.color}-100 text-${tier.color}-800`}>
                {tier.name} {tier.discount}% Off
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(customer)}
            className="text-blue-600 hover:text-blue-700 p-1"
            title="Edit customer"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(customer.id, customer.name)}
            className="text-red-600 hover:text-red-700 p-1"
            title="Delete customer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Phone size={16} className="text-gray-400" />
          <span>{customer.phone}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail size={16} className="text-gray-400" />
            <span>{customer.email}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-gray-400" />
            <span className="line-clamp-1">{customer.address}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-600">Points</p>
          <p className="text-lg font-bold text-purple-600">{customer.loyaltyPoints || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Purchases</p>
          <p className="text-lg font-bold text-blue-600">{customer.purchaseCount || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Total Spent</p>
          <p className="text-lg font-bold text-green-600">{formatPrice(customer.totalSpent || 0)}</p>
        </div>
      </div>
    </div>
  );
}

function CustomerModal({ customer, onClose, onSave, title }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    // Validate Kenyan phone number
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              placeholder="+254712345678 or 0712345678"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: +254712345678 or 0712345678
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Address (Optional)
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              rows="2"
              placeholder="Customer address..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : customer ? 'Update' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerDetailsModal({ customer, orders, onClose, getLoyaltyTier, redeemPoints }) {
  const [redeeming, setRedeeming] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  
  const tier = getLoyaltyTier(customer.totalSpent || 0);
  
  // Get customer orders
  const customerOrders = orders.filter(order => order.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Get favorite products
  const productCounts = {};
  customerOrders.forEach(order => {
    order.items?.forEach(item => {
      if (!productCounts[item.title]) {
        productCounts[item.title] = { count: 0, revenue: 0, image: item.image };
      }
      productCounts[item.title].count += item.quantity;
      productCounts[item.title].revenue += item.price * item.quantity;
    });
  });
  
  const favoriteProducts = Object.entries(productCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleRedeem = async () => {
    const points = parseInt(pointsToRedeem);
    if (!points || points <= 0) {
      toast.error('Enter a valid number of points');
      return;
    }
    
    if (points > (customer.loyaltyPoints || 0)) {
      toast.error('Insufficient loyalty points');
      return;
    }
    
    try {
      setRedeeming(true);
      await redeemPoints(customer.id, points);
      setPointsToRedeem('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-meat text-white flex items-center justify-center text-2xl font-bold">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-${tier.color}-100 text-${tier.color}-800 flex items-center gap-1`}>
                  <Award size={14} />
                  {tier.name} Member - {tier.discount}% Discount
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span>{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-gray-400" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-gray-400" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <Star className="text-purple-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Loyalty Points</p>
              <p className="text-2xl font-bold text-purple-600">{customer.loyaltyPoints || 0}</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <ShoppingBag className="text-blue-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{customer.purchaseCount || 0}</p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <TrendingUp className="text-green-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(customer.totalSpent || 0)}</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <Award className="text-orange-600 mb-2" size={24} />
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatPrice((customer.totalSpent || 0) / (customer.purchaseCount || 1))}
              </p>
            </div>
          </div>

          {/* Redeem Points */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Star className="text-purple-600" />
              Redeem Loyalty Points
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Each 100 points = KES 100 discount. Current points: {customer.loyaltyPoints || 0}
            </p>
            <div className="flex gap-3">
              <input
                type="number"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(e.target.value)}
                placeholder="Points to redeem"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                max={customer.loyaltyPoints || 0}
                min="0"
              />
              <button
                onClick={handleRedeem}
                disabled={redeeming || !pointsToRedeem}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                {redeeming ? 'Processing...' : 'Redeem'}
              </button>
            </div>
          </div>

          {/* Favorite Products */}
          {favoriteProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Favorite Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoriteProducts.map((product, index) => (
                  <div key={index} className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
                    <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">Purchased {product.count} times</p>
                      <p className="text-sm font-bold text-green-600">{formatPrice(product.revenue)} total</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase History */}
          <div>
            <h3 className="text-lg font-bold mb-4">Recent Purchase History</h3>
            {customerOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {customerOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Order #{order.orderNumber || order.id.slice(0, 8)}</span>
                      <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {order.items?.length || 0} items • {order.paymentMethod || 'Cash'}
                      </div>
                      <div className="text-lg font-bold text-green-600">{formatPrice(order.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}