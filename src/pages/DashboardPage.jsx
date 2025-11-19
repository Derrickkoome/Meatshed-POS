import { useState, useEffect } from 'react';
import { useOrders } from '../contexts/OrderContext';
import { useProducts } from '../contexts/ProductContext';
import { formatPrice } from '../utils/formatters';
import { fixOrderQuantities } from '../utils/fixOrders';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertCircle,
  Wrench,
  AlertTriangle,
  TrendingDown,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  X,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [isFixing, setIsFixing] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueDate, setRevenueDate] = useState(new Date().toISOString().split('T')[0]);
  const [ordersDate, setOrdersDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    todayOrders: 0,
  });

  useEffect(() => {
    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (parseFloat(order.total) || 0);
    }, 0);

    const lowStockProducts = products.filter((p) => p.stock < 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    setStats({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      todayOrders: todayOrders.length,
    });
  }, [orders, products]);

  const handleFixOrders = async () => {
    if (!confirm('This will fix all order quantities in the database. Continue?')) {
      return;
    }
    
    setIsFixing(true);
    await fixOrderQuantities();
    setIsFixing(false);
    window.location.reload(); // Refresh to see updated data
  };

  const getTopSellingProducts = () => {
    const productSales = {};

    orders.forEach((order) => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach((item) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            id: item.id,
            title: item.title,
            quantity: 0,
            revenue: 0,
            image: item.image,
          };
        }
        
        // ✅ Parse as integer to ensure proper addition
        const quantity = parseInt(item.quantity, 10) || 0;
        const price = parseFloat(item.price) || 0;
        
        productSales[item.id].quantity += quantity;
        productSales[item.id].revenue += price * quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const getTopSellingCategories = () => {
    const categorySales = {};

    orders.forEach((order) => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach((item) => {
        const product = products.find(p => p.id === item.id);
        const category = product?.category || 'Uncategorized';
        
        if (!categorySales[category]) {
          categorySales[category] = {
            category,
            quantity: 0,
            revenue: 0,
          };
        }
        
        const quantity = parseInt(item.quantity, 10) || 0;
        const price = parseFloat(item.price) || 0;
        
        categorySales[category].quantity += quantity;
        categorySales[category].revenue += price * quantity;
      });
    });

    return Object.values(categorySales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  };

  const getLowStockProducts = () => {
    return products
      .filter(p => p.stock < 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  };

  const getRecentOrders = () => {
    return orders
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  const getLast7DaysSales = () => {
    const salesByDay = {};
    const today = new Date();
    
    // Initialize last 7 days with 0 sales
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      salesByDay[dateKey] = {
        date: dateKey,
        sales: 0,
        orders: 0,
      };
    }

    // Calculate sales for each day
    orders.forEach((order) => {
      const orderDate = new Date(order.timestamp);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      if (salesByDay[dateKey]) {
        salesByDay[dateKey].sales += parseFloat(order.total) || 0;
        salesByDay[dateKey].orders += 1;
      }
    });

    const salesArray = Object.values(salesByDay);
    
    // Calculate percentage changes
    salesArray.forEach((day, index) => {
      if (index > 0) {
        const previousDay = salesArray[index - 1];
        if (previousDay.sales > 0) {
          const change = ((day.sales - previousDay.sales) / previousDay.sales) * 100;
          day.percentChange = change;
        } else if (day.sales > 0) {
          day.percentChange = 100;
        } else {
          day.percentChange = 0;
        }
      } else {
        day.percentChange = 0;
      }
    });

    return salesArray;
  };

  const getOrdersByDateAndCategory = (dateString) => {
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === targetDate.getTime();
    });

    const categoryData = {};

    filteredOrders.forEach((order) => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach((item) => {
        const product = products.find(p => p.id === item.id);
        const category = product?.category || 'Uncategorized';
        
        if (!categoryData[category]) {
          categoryData[category] = {
            category,
            products: {},
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        
        if (!categoryData[category].products[item.id]) {
          categoryData[category].products[item.id] = {
            id: item.id,
            title: item.title,
            image: item.image,
            quantity: 0,
            revenue: 0,
            price: parseFloat(item.price) || 0,
          };
        }
        
        const quantity = parseInt(item.quantity, 10) || 0;
        const price = parseFloat(item.price) || 0;
        
        categoryData[category].products[item.id].quantity += quantity;
        categoryData[category].products[item.id].revenue += price * quantity;
        categoryData[category].totalQuantity += quantity;
        categoryData[category].totalRevenue += price * quantity;
      });
    });

    return Object.values(categoryData)
      .map(cat => ({
        ...cat,
        products: Object.values(cat.products),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const getTodayOrdersByCategory = () => {
    return getOrdersByDateAndCategory(new Date().toISOString().split('T')[0]);
  };

  const getOrdersByDate = (dateString) => {
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === targetDate.getTime();
    });
  };

  const getRevenueByDate = (dateString) => {
    const dateOrders = getOrdersByDate(dateString);
    return dateOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.total) || 0);
    }, 0);
  };

  const topProducts = getTopSellingProducts();
  const topCategories = getTopSellingCategories();
  const lowStockProducts = getLowStockProducts();
  const recentOrders = getRecentOrders();
  const last7DaysSales = getLast7DaysSales();
  const todayOrdersByCategory = getTodayOrdersByCategory();
  const selectedDateOrders = getOrdersByDateAndCategory(selectedDate);

  // Calculate max sales for chart scaling
  const maxSales = Math.max(...last7DaysSales.map(d => d.sales), 1);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Fix Orders Button */}
        <button
          onClick={handleFixOrders}
          disabled={isFixing}
          className="btn-secondary flex items-center gap-2"
        >
          <Wrench size={18} />
          {isFixing ? 'Fixing Orders...' : 'Fix Order Quantities'}
        </button>
      </div>

      {/* Alert Notifications */}
      {(lowStockProducts.length > 0 || topCategories.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 mb-1">
                    Low Stock Alert!
                  </h3>
                  <p className="text-red-700 text-sm mb-2">
                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
                  </p>
                  <button className="text-red-800 text-sm font-semibold hover:underline">
                    View All →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Categories Notification */}
          {topCategories.length > 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Award className="text-green-500 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-green-800 mb-1">
                    Top Performing Categories
                  </h3>
                  <p className="text-green-700 text-sm mb-2">
                    {topCategories[0].category} leading with {formatPrice(topCategories[0].revenue)} in sales
                  </p>
                  <button className="text-green-800 text-sm font-semibold hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={<DollarSign />}
          color="bg-green-500"
          onClick={() => setShowRevenueModal(true)}
          clickable
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag />}
          color="bg-blue-500"
          onClick={() => setShowOrdersModal(true)}
          clickable
        />
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          icon={<Calendar />}
          color="bg-orange-500"
          onClick={() => setShowTodayModal(true)}
          clickable
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package />}
          color="bg-purple-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={<AlertCircle />}
          color="bg-red-500"
        />
      </div>

      {/* Sales Chart - Last 7 Days */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="text-meat" />
          Daily Sales (Last 7 Days)
        </h2>
        <div className="space-y-4">
          {last7DaysSales.map((day, index) => {
            const barHeight = (day.sales / maxSales) * 100;
            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            const dayDate = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            return (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600 text-right">
                  <div className="font-semibold">{dayName}</div>
                  <div className="text-xs">{dayDate}</div>
                </div>
                
                <div className="flex-1 relative">
                  <div className="bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${barHeight}%` }}
                    >
                      {day.sales > 0 && (
                        <span className="text-white text-xs font-bold">
                          {formatPrice(day.sales)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="w-24 text-right">
                  {index > 0 && day.percentChange !== 0 ? (
                    <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${
                      day.percentChange > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {day.percentChange > 0 ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      <span>{Math.abs(day.percentChange).toFixed(1)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 text-sm text-gray-400">
                      <Minus size={16} />
                      <span>0%</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">{day.orders} orders</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Selling Products */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-meat" />
            Top Selling Products
          </h2>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-2xl font-bold text-gray-300">
                    #{index + 1}
                  </span>
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="text-sm text-gray-600">
                      {product.quantity} sold
                    </p>
                  </div>
                  <span className="font-bold text-meat">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-meat">
                      {formatPrice(order.total)}
                    </p>
                    <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Selling Categories */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="text-green-600" />
            Top Selling Categories
          </h2>
          <div className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map((category, index) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-green-300">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{category.category}</h3>
                      <p className="text-sm text-gray-600">
                        {category.quantity} items sold
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatPrice(category.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No category data yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingDown className="text-red-600" />
            Low Stock Alert
          </h2>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">
                      {product.stock} left
                    </span>
                    <p className="text-xs text-red-500">Restock needed</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-green-600 text-center py-4 flex items-center justify-center gap-2">
                <Package size={20} />
                All products well stocked!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Today's Orders Modal */}
      {showTodayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col gap-4 p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="text-orange-500" />
                  Daily Orders
                </h2>
                <button
                  onClick={() => setShowTodayModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Date Picker */}
              <div className="flex items-center gap-3">
                <label htmlFor="date-picker" className="font-semibold text-gray-700">
                  Select Date:
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {selectedDateOrders.length > 0 ? (
                <div className="space-y-6">
                  {selectedDateOrders.map((category) => (
                    <div key={category.category} className="border rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">{category.category}</h3>
                          <div className="text-right">
                            <p className="text-sm opacity-90">Total Sold</p>
                            <p className="text-2xl font-bold">{category.totalQuantity} items</p>
                          </div>
                        </div>
                        <p className="mt-2 text-orange-100">
                          Revenue: {formatPrice(category.totalRevenue)}
                        </p>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {category.products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold">{product.title}</h4>
                              <p className="text-sm text-gray-600">
                                {formatPrice(product.price)} per unit
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-600">
                                {product.quantity} sold
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatPrice(product.revenue)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg">No orders placed on this date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col gap-4 p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="text-green-500" />
                  Daily Revenue
                </h2>
                <button
                  onClick={() => setShowRevenueModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Date Picker */}
              <div className="flex items-center gap-3">
                <label htmlFor="revenue-date-picker" className="font-semibold text-gray-700">
                  Select Date:
                </label>
                <input
                  id="revenue-date-picker"
                  type="date"
                  value={revenueDate}
                  onChange={(e) => setRevenueDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-gray-600">
                  {new Date(revenueDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-8 text-white text-center mb-6">
                <p className="text-lg opacity-90 mb-2">Total Revenue</p>
                <p className="text-5xl font-bold mb-2">{formatPrice(getRevenueByDate(revenueDate))}</p>
                <p className="text-sm opacity-75">
                  {getOrdersByDate(revenueDate).length} order{getOrdersByDate(revenueDate).length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-3">Orders on this date:</h3>
                {getOrdersByDate(revenueDate).length > 0 ? (
                  getOrdersByDate(revenueDate).map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">
                          {formatPrice(order.total)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500 text-lg">No revenue on this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col gap-4 p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="text-blue-500" />
                  Daily Orders
                </h2>
                <button
                  onClick={() => setShowOrdersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Date Picker */}
              <div className="flex items-center gap-3">
                <label htmlFor="orders-date-picker" className="font-semibold text-gray-700">
                  Select Date:
                </label>
                <input
                  id="orders-date-picker"
                  type="date"
                  value={ordersDate}
                  onChange={(e) => setOrdersDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-600">
                  {new Date(ordersDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white text-center mb-6">
                <p className="text-lg opacity-90 mb-2">Total Orders</p>
                <p className="text-5xl font-bold mb-2">{getOrdersByDate(ordersDate).length}</p>
                <p className="text-sm opacity-75">
                  Revenue: {formatPrice(getRevenueByDate(ordersDate))}
                </p>
              </div>

              <div className="space-y-3">
                {getOrdersByDate(ordersDate).length > 0 ? (
                  getOrdersByDate(ordersDate)
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((order) => (
                      <div
                        key={order.id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-600 text-xl">
                                {formatPrice(order.total)}
                              </p>
                              <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <p className="font-semibold mb-2 text-sm text-gray-700">Order Items:</p>
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <span className="font-medium">{item.title}</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{item.quantity}x {formatPrice(item.price)}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatPrice(item.quantity * item.price)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500 text-lg">No orders on this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, onClick, clickable }) {
  return (
    <div 
      className={`card ${clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
      {clickable && (
        <p className="text-xs text-gray-500 mt-2">Click to view details</p>
      )}
    </div>
  );
}