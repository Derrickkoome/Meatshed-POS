import { useProducts } from '../contexts/ProductContext';
import { useOnlineOrders } from '../contexts/OnlineOrderContext';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { useCustomers } from '../contexts/CustomerContext';
import { formatPrice, calculateWeightPrice } from '../utils/formatters';
import { Plus, Search, DollarSign, Package, XCircle, Edit2, Trash2, Loader, FileText } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import OnlineOrderReceipt from '../components/OnlineOrderReceipt';
import PaymentMethodModal from '../components/PaymentMethodModal';

export default function OnlineOrdersPage() {
  const { products, loading: productsLoading, updateProduct } = useProducts();
  const { 
    orders, 
    loading: ordersLoading, 
    createOrder, 
    updateOrder, 
    deleteOrder 
  } = useOnlineOrders();
  const { createOrder: createMainOrder } = useOrders();
  const { currentUser } = useAuth();
  const { customers, findCustomerByPhone, addCustomer, updateCustomer: updateCustomerInDB, addLoyaltyPoints } = useCustomers();
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderToPay, setOrderToPay] = useState(null);
  
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ productId: '', productName: '', quantity: '', price: '', total: 0 }],
    deliveryDate: '',
    deliveryCost: 0,
    notes: ''
  });

  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addItemRow = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { productId: '', productName: '', quantity: '', price: '', total: 0 }]
    });
  };

  const removeItemRow = (index) => {
    const newItems = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;

    if (field === 'productId') {
      const product = products.find(p => p.id.toString() === value);
      if (product) {
        newItems[index].productName = product.title;
        newItems[index].price = product.price;
        newItems[index].total = calculateWeightPrice(newItems[index].quantity, product.price);
      }
    }

    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      newItems[index].total = calculateWeightPrice(qty, price);
    }

    setOrderForm({ ...orderForm, items: newItems });
  };

  const calculateTotal = () => {
    const itemsTotal = orderForm.items.reduce((sum, item) => sum + (item.total || 0), 0);
    return itemsTotal + parseFloat(orderForm.deliveryCost || 0);
  };

  // Handle customer phone input and search
  const handlePhoneChange = (phone) => {
    setOrderForm({...orderForm, customerPhone: phone});
    
    if (phone.length >= 10) {
      const filtered = customers.filter(c => 
        c.phone.includes(phone) || c.name?.toLowerCase().includes(phone.toLowerCase())
      );
      setCustomerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select customer from suggestions
  const selectCustomer = (customer) => {
    setOrderForm({
      ...orderForm,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address || ''
    });
    setShowSuggestions(false);
  };

  // Create or update customer record
  const saveCustomerInfo = async (customerData, orderTotal = 0) => {
    try {
      // Check if customer exists
      const existingCustomer = await findCustomerByPhone(customerData.phone);
      
      if (existingCustomer) {
        // Update total purchases and add loyalty points
        const newTotal = (existingCustomer.totalPurchases || 0) + 1;
        await updateCustomerInDB(existingCustomer.id, {
          name: customerData.name,
          address: customerData.address || existingCustomer.address,
          totalPurchases: newTotal,
          lastOrderDate: new Date()
        });

        // Add loyalty points (1 point per KES 100)
        const pointsEarned = Math.floor(orderTotal / 100);
        if (pointsEarned > 0) {
          try {
            await addLoyaltyPoints(existingCustomer.id, pointsEarned, orderTotal);
          } catch (loyaltyError) {
            console.error('Error adding loyalty points:', loyaltyError);
            // Don't fail if loyalty points fail
          }
        }
      } else {
        // Create new customer
        const newCustomer = await addCustomer({
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address || '',
          email: '',
          totalPurchases: 1,
          createdAt: new Date(),
          lastOrderDate: new Date()
        });

        // Add loyalty points for new customer (1 point per KES 100)
        const pointsEarned = Math.floor(orderTotal / 100);
        if (pointsEarned > 0 && newCustomer) {
          try {
            await addLoyaltyPoints(newCustomer.id, pointsEarned, orderTotal);
          } catch (loyaltyError) {
            console.error('Error adding loyalty points for new customer:', loyaltyError);
            // Don't fail if loyalty points fail
          }
        }
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      // Don't fail the order if customer save fails
    }
  };

  const saveOrder = async () => {
    const totalAmount = calculateTotal();
    
    if (!orderForm.customerName || !orderForm.customerPhone || orderForm.items.some(item => !item.productId)) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check inventory availability
    for (let item of orderForm.items) {
      const product = products.find(p => p.id.toString() === item.productId);
      if (product && product.stock < item.quantity) {
        toast.error(`Insufficient stock for ${item.productName}. Available: ${product.stock}`);
        return;
      }
    }

    try {
      if (editingOrder) {
        // Update existing order
        await updateOrder(editingOrder.id, {
          ...orderForm,
          totalAmount
        });
        toast.success('Order updated successfully');
      } else {
        // Save customer info first
        await saveCustomerInfo({
          name: orderForm.customerName,
          phone: orderForm.customerPhone,
          address: orderForm.customerAddress
        }, totalAmount);

        // Create new order and deduct from inventory
        await createOrder({
          ...orderForm,
          totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

        // Deduct from inventory
        for (let item of orderForm.items) {
          const product = products.find(p => p.id.toString() === item.productId);
          if (product) {
            await updateProduct(product.id, {
              stock: product.stock - parseFloat(item.quantity)
            });
          }
        }
        
        // Get the created order and show receipt with auto-print
        const createdOrderData = {
          id: Date.now().toString(), // Temporary ID, will be replaced by actual order ID
          ...orderForm,
          totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        setSelectedOrder(createdOrderData);
        setAutoPrintReceipt(true);
        setShowReceipt(true);
        
        toast.success('Order created successfully - Receipt will print automatically');
      }

      resetForm();
    } catch (error) {
      console.error('Save order error:', error);
      toast.error('Failed to save order');
    }
  };

  const resetForm = () => {
    setOrderForm({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      items: [{ productId: '', productName: '', quantity: '', price: '', total: 0 }],
      deliveryDate: '',
      deliveryCost: 0,
      notes: ''
    });
    setShowOrderForm(false);
    setEditingOrder(null);
  };

  const markAsPaid = (order) => {
    setOrderToPay(order);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentDetails, paymentDate) => {
    const order = orderToPay;
    setShowPaymentModal(false);
    setOrderToPay(null);

    let paymentTimestamp;
    if (paymentDate) {
      const selectedDate = new Date(paymentDate);
      if (isNaN(selectedDate.getTime())) {
        toast.error('Invalid date format');
        return;
      }
      paymentTimestamp = selectedDate.toISOString();
    } else {
      paymentTimestamp = new Date().toISOString();
    }

    try {
      // Update online order status
      await updateOrder(order.id, {
        status: 'paid',
        paidAt: paymentTimestamp
      });

      // Create a record in the main orders collection for accountability and receipts
      const subtotal = order.totalAmount;
      const tax = 0; // Tax included in pricing
      const total = subtotal + tax;

      // Transform items to match POS order format
      const orderItems = order.items.map(item => ({
        id: item.productId,
        title: item.productName,
        price: item.price,
        quantity: item.quantity,
        image: products.find(p => p.id.toString() === item.productId)?.thumbnail || '',
        stock: products.find(p => p.id.toString() === item.productId)?.stock || 0
      }));

      // Determine payment method for display
      const paymentMethodDisplay = paymentDetails.isSplit 
        ? 'Split Payment' 
        : paymentDetails.method || 'Online Delivery';

      await createMainOrder({
        items: orderItems,
        subtotal,
        tax,
        total,
        paymentMethod: paymentMethodDisplay,
        ...(paymentDetails && { paymentDetails }), // Add payment details
        cashier: currentUser?.email || 'System',
        timestamp: paymentTimestamp, // Use the selected payment date
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryCost: parseFloat(order.deliveryCost) || 0, // Add delivery cost
        // Add online order specific fields
        isOnlineOrder: true,
        onlineOrderId: order.id,
        ...(order.customerAddress && { deliveryAddress: order.customerAddress }),
        ...(order.deliveryDate && { deliveryDate: order.deliveryDate }),
        ...(order.notes && { orderNotes: order.notes })
      });

      toast.success(`Order marked as paid on ${new Date(paymentTimestamp).toLocaleDateString()}`);
    } catch (error) {
      console.error('Mark paid error:', error);
      toast.error('Failed to update order');
    }
  };

  const markAsReturned = async (order) => {
    try {
      // Re-add items to inventory
      for (let item of order.items) {
        const product = products.find(p => p.id.toString() === item.productId);
        if (product) {
          await updateProduct(product.id, {
            stock: product.stock + parseFloat(item.quantity)
          });
        }
      }

      await updateOrder(order.id, {
        status: 'returned',
        returnedAt: new Date().toISOString()
      });
      toast.success('Order marked as returned and inventory updated');
    } catch (error) {
      console.error('Mark returned error:', error);
      toast.error('Failed to update order');
    }
  };

  const editOrder = (order) => {
    setEditingOrder(order);
    setOrderForm(order);
    setShowOrderForm(true);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      const order = orders.find(o => o.id === orderId);
      if (order && order.status === 'pending') {
        // Re-add items to inventory
        for (let item of order.items) {
          const product = products.find(p => p.id.toString() === item.productId);
          if (product) {
            await updateProduct(product.id, {
              stock: product.stock + parseFloat(item.quantity)
            });
          }
        }
      }
      await deleteOrder(orderId);
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete order');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerPhone?.includes(searchTerm) ||
                         order.id?.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    returned: orders.filter(o => o.status === 'returned').length,
    pendingAmount: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  };

  if (productsLoading || ordersLoading) {
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Online Orders Management</h1>
        <p className="text-gray-600">Manage delivery orders and track payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-gray-500 text-sm">Total Orders</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="card p-4 bg-yellow-50">
          <div className="text-yellow-700 text-sm">Pending Payment</div>
          <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
        </div>
        <div className="card p-4 bg-green-50">
          <div className="text-green-700 text-sm">Paid</div>
          <div className="text-2xl font-bold text-green-800">{stats.paid}</div>
        </div>
        <div className="card p-4 bg-red-50">
          <div className="text-red-700 text-sm">Returned</div>
          <div className="text-2xl font-bold text-red-800">{stats.returned}</div>
        </div>
        <div className="card p-4 bg-blue-50">
          <div className="text-blue-700 text-sm">Pending Amount</div>
          <div className="text-2xl font-bold text-blue-800">{formatPrice(stats.pendingAmount)}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center">
        <button
          onClick={() => setShowOrderForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Order
        </button>

        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending Payment</option>
          <option value="paid">Paid</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingOrder ? 'Edit Order' : 'New Delivery Order'}
              </h2>

              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={orderForm.customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onFocus={() => orderForm.customerPhone.length >= 10 && setShowSuggestions(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                      placeholder="0712345678"
                    />
                    {showSuggestions && customerSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {customerSuggestions.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                          >
                            <div className="font-semibold text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                            {customer.address && (
                              <div className="text-xs text-gray-500">{customer.address}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={orderForm.customerAddress}
                      onChange={(e) => setOrderForm({...orderForm, customerAddress: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                      placeholder="Enter delivery address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={orderForm.deliveryDate}
                      onChange={(e) => setOrderForm({...orderForm, deliveryDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Cost (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderForm.deliveryCost}
                      onChange={(e) => setOrderForm({...orderForm, deliveryCost: parseFloat(e.target.value) || 0})}
                      placeholder="Enter delivery cost"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                    />
                    {orderForm.deliveryCost > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        +{formatPrice(orderForm.deliveryCost)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.title} (Stock: {product.stock})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                      />
                      <div className="w-32 px-3 py-2 bg-gray-100 rounded-lg text-right font-semibold">
                        {formatPrice(item.total)}
                      </div>
                      {orderForm.items.length > 1 && (
                        <button
                          onClick={() => removeItemRow(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItemRow}
                  className="mt-3 text-meat hover:text-red-700 flex items-center gap-1 font-semibold"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meat focus:border-transparent"
                  rows="3"
                  placeholder="Any special instructions..."
                />
              </div>

              {/* Total */}
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-meat">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={saveOrder}
                  className="btn-primary"
                >
                  {editingOrder ? 'Update Order' : 'Save Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="card">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id?.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.items?.map((item, i) => (
                        <div key={i}>{item.productName} x{item.quantity}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.deliveryDate || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowReceipt(true);
                          }}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="View Receipt"
                        >
                          <FileText size={18} />
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => markAsPaid(order)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Mark as Paid"
                            >
                              <DollarSign size={18} />
                            </button>
                            <button
                              onClick={() => markAsReturned(order)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Mark as Returned"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() => editOrder(order)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit Order"
                            >
                              <Edit2 size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-gray-600 hover:text-gray-800 p-1"
                          title="Delete Order"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && orderToPay && (
        <PaymentMethodModal
          totalAmount={orderToPay.totalAmount}
          onConfirm={handlePaymentConfirm}
          onCancel={() => {
            setShowPaymentModal(false);
            setOrderToPay(null);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedOrder && (
        <OnlineOrderReceipt 
          order={selectedOrder} 
          autoPrint={autoPrintReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedOrder(null);
            setAutoPrintReceipt(false);
          }} 
        />
      )}
    </div>
  );
}
