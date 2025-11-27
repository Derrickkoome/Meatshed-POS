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
  Truck,
  Smartphone,
  Wallet,
  CreditCard,
  Clock,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';

export default function DashboardPage() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [isFixing, setIsFixing] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showPaymentBreakdownModal, setShowPaymentBreakdownModal] = useState(false);
  const [showPeakHoursModal, setShowPeakHoursModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueDate, setRevenueDate] = useState(new Date().toISOString().split('T')[0]);
  const [ordersDate, setOrdersDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentBreakdownDate, setPaymentBreakdownDate] = useState(new Date().toISOString().split('T')[0]);
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

    const lowStockProducts = products.filter((p) => p.stock < 5);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    // Calculate total stock value
    const totalStockValue = products.reduce((sum, product) => {
      return sum + (parseFloat(product.price) || 0) * (parseFloat(product.stock) || 0);
    }, 0);

    // Calculate today's delivery revenue
    const todayDeliveryRevenue = todayOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.deliveryCost) || 0);
    }, 0);

    // Calculate total delivery revenue
    const totalDeliveryRevenue = orders.reduce((sum, order) => {
      return sum + (parseFloat(order.deliveryCost) || 0);
    }, 0);

    // Calculate payment method breakdown for today
    const calculatePaymentBreakdown = (ordersList) => {
      const breakdown = {
        cash: 0,
        mpesa: 0,
        card: 0,
        credit: 0,
        split: 0,
      };

      ordersList.forEach(order => {
        const total = parseFloat(order.total) || 0;
        const method = order.paymentMethod?.toLowerCase() || 'cash';

        // Handle split payments
        if (order.paymentDetails?.isSplit && order.paymentDetails?.splitPayments) {
          order.paymentDetails.splitPayments.forEach(payment => {
            const paymentMethod = payment.method.toLowerCase();
            const amount = parseFloat(payment.amount) || 0;

            if (paymentMethod.includes('mpesa') || paymentMethod.includes('m-pesa')) {
              breakdown.mpesa += amount;
            } else if (paymentMethod.includes('cash')) {
              breakdown.cash += amount;
            } else if (paymentMethod.includes('card')) {
              breakdown.card += amount;
            } else if (paymentMethod.includes('credit')) {
              breakdown.credit += amount;
            }
          });
          breakdown.split += total;
        } else {
          // Regular single payment
          if (method.includes('mpesa') || method.includes('m-pesa')) {
            breakdown.mpesa += total;
          } else if (method.includes('cash')) {
            breakdown.cash += total;
          } else if (method.includes('card')) {
            breakdown.card += total;
          } else if (method.includes('credit')) {
            breakdown.credit += total;
          } else {
            breakdown.cash += total; // Default to cash
          }
        }
      });

      return breakdown;
    };

    const todayPaymentBreakdown = calculatePaymentBreakdown(todayOrders);
    const allTimePaymentBreakdown = calculatePaymentBreakdown(orders);

    setStats({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      todayOrders: todayOrders.length,
      totalStockValue,
      todayDeliveryRevenue,
      totalDeliveryRevenue,
      todayPaymentBreakdown,
      allTimePaymentBreakdown,
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
        // Skip delivery cost items
        const title = (item.title || '').toLowerCase();
        if (title.includes('delivery') || title.includes('shipping')) {
          return;
        }

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
        // Skip delivery cost items
        const title = (item.title || '').toLowerCase();
        if (title.includes('delivery') || title.includes('shipping')) {
          return;
        }

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
      .filter(p => p.stock < 5)
      .sort((a, b) => a.stock - b.stock);
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

  const getPaymentBreakdownByDate = (dateString) => {
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === targetDate.getTime();
    });

    const breakdown = {
      cash: 0,
      mpesa: 0,
      card: 0,
      credit: 0,
      total: 0,
      orderCount: filteredOrders.length,
    };

    filteredOrders.forEach(order => {
      const total = parseFloat(order.total) || 0;
      breakdown.total += total;
      const method = order.paymentMethod?.toLowerCase() || 'cash';

      // Handle split payments
      if (order.paymentDetails?.isSplit && order.paymentDetails?.splitPayments) {
        order.paymentDetails.splitPayments.forEach(payment => {
          const paymentMethod = payment.method.toLowerCase();
          const amount = parseFloat(payment.amount) || 0;

          if (paymentMethod.includes('mpesa') || paymentMethod.includes('m-pesa')) {
            breakdown.mpesa += amount;
          } else if (paymentMethod.includes('cash')) {
            breakdown.cash += amount;
          } else if (paymentMethod.includes('card')) {
            breakdown.card += amount;
          } else if (paymentMethod.includes('credit')) {
            breakdown.credit += amount;
          }
        });
      } else {
        // Regular single payment
        if (method.includes('mpesa') || method.includes('m-pesa')) {
          breakdown.mpesa += total;
        } else if (method.includes('cash')) {
          breakdown.cash += total;
        } else if (method.includes('card')) {
          breakdown.card += total;
        } else if (method.includes('credit')) {
          breakdown.credit += total;
        } else {
          breakdown.cash += total; // Default to cash
        }
      }
    });

    return breakdown;
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
        // Skip delivery cost items
        const title = (item.title || '').toLowerCase();
        if (title.includes('delivery') || title.includes('shipping')) {
          return;
        }

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

  const getRevenuByDate = (dateString) => {
    const dateOrders = getOrdersByDate(dateString);
    return dateOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.total) || 0);
    }, 0);
  };

  const getDeliveryRevenueByDate = (dateString) => {
    const dateOrders = getOrdersByDate(dateString);
    return dateOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.deliveryCost) || 0);
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={<AlertTriangle />}
          color="bg-red-500"
          onClick={() => setShowLowStockModal(true)}
          clickable
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package />}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Stock Value"
          value={formatPrice(stats.totalStockValue)}
          icon={<TrendingUp />}
          color="bg-indigo-500"
        />
      </div>

      {/* Payment Method Breakdown - Today */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div 
          className="card bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => {
            setPaymentBreakdownDate(new Date().toISOString().split('T')[0]);
            setShowPaymentBreakdownModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Today's Cash Sales</p>
              <p className="text-2xl font-bold">
                {formatPrice(stats.todayPaymentBreakdown?.cash || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        <div 
          className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => {
            setPaymentBreakdownDate(new Date().toISOString().split('T')[0]);
            setShowPaymentBreakdownModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Today's M-Pesa Sales</p>
              <p className="text-2xl font-bold">
                {formatPrice(stats.todayPaymentBreakdown?.mpesa || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <Smartphone size={24} />
            </div>
          </div>
        </div>

        <div 
          className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => {
            setPaymentBreakdownDate(new Date().toISOString().split('T')[0]);
            setShowPaymentBreakdownModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Today's Card Sales</p>
              <p className="text-2xl font-bold">
                {formatPrice(stats.todayPaymentBreakdown?.card || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        <div 
          className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => {
            setPaymentBreakdownDate(new Date().toISOString().split('T')[0]);
            setShowPaymentBreakdownModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Today's Credit Sales</p>
              <p className="text-2xl font-bold">
                {formatPrice(stats.todayPaymentBreakdown?.credit || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div 
          className="card bg-gradient-to-r from-cyan-500 to-cyan-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => {
            setRevenueDate(new Date().toISOString().split('T')[0]);
            setShowRevenueModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Today's Delivery Revenue</p>
              <p className="text-3xl font-bold" key={stats.todayDeliveryRevenue}>
                {formatPrice(stats.todayDeliveryRevenue || 0)}
              </p>
              <p className="text-xs opacity-75 mt-2">
                {getOrdersByDate(new Date().toISOString().split('T')[0]).filter(o => (o.deliveryCost || 0) > 0).length} deliveries today
              </p>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <Truck size={32} />
            </div>
          </div>
          <p className="text-xs opacity-75 mt-2">Click to view details</p>
        </div>
        <div 
          className="card bg-gradient-to-r from-teal-500 to-teal-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setShowRevenueModal(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Delivery Revenue</p>
              <p className="text-3xl font-bold" key={stats.totalDeliveryRevenue}>
                {formatPrice(stats.totalDeliveryRevenue || 0)}
              </p>
              <p className="text-xs opacity-75 mt-2">
                {orders.filter(o => (o.deliveryCost || 0) > 0).length} total deliveries
              </p>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <TrendingUp size={32} />
            </div>
          </div>
          <p className="text-xs opacity-75 mt-2">Click to view details</p>
        </div>
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

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                Low Stock Items ({lowStockProducts.length})
              </h2>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {lowStockProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border-2 border-red-200 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={product.image || product.thumbnail}
                        alt={product.title}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{product.title}</h3>
                        <p className="text-sm text-gray-600 capitalize">{product.category || 'Uncategorized'}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Price: <span className="font-semibold">{formatPrice(product.price)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1 bg-red-600 text-white rounded-lg mb-1">
                          <span className="font-bold text-2xl">{product.stock}</span>
                        </div>
                        <p className="text-xs text-red-600 font-semibold">Restock needed</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto text-green-500 mb-4" size={64} />
                  <p className="text-green-600 text-lg font-semibold">All products well stocked!</p>
                  <p className="text-gray-500 mt-2">No items below the low stock threshold (5 units)</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <strong>Low Stock Threshold:</strong> Items with less than 5 units
                </p>
                <button
                  onClick={() => setShowLowStockModal(false)}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white text-center">
                  <p className="text-sm opacity-90 mb-1">Total Revenue</p>
                  <p className="text-4xl font-bold mb-1">
                    {formatPrice(getOrdersByDate(revenueDate).reduce((sum, order) => sum + order.total, 0))}
                  </p>
                  <p className="text-xs opacity-75">
                    {getOrdersByDate(revenueDate).length} order{getOrdersByDate(revenueDate).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 text-white text-center">
                  <p className="text-sm opacity-90 mb-1">Delivery Fees</p>
                  <p className="text-4xl font-bold mb-1">{formatPrice(getDeliveryRevenueByDate(revenueDate))}</p>
                  <p className="text-xs opacity-75">
                    {getOrdersByDate(revenueDate).filter(o => (o.deliveryCost || 0) > 0).length} deliveries
                  </p>
                </div>
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
                        {order.deliveryCost > 0 && (
                          <p className="text-xs text-teal-600 font-semibold mt-1">
                            🚚 Delivery: {formatPrice(order.deliveryCost)}
                          </p>
                        )}
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

      {/* Payment Breakdown Modal */}
      {showPaymentBreakdownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col gap-4 p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="text-green-500" />
                  Payment Methods Breakdown
                </h2>
                <button
                  onClick={() => setShowPaymentBreakdownModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Date Picker */}
              <div className="flex items-center gap-3">
                <label htmlFor="payment-date-picker" className="font-semibold text-gray-700">
                  Select Date:
                </label>
                <input
                  id="payment-date-picker"
                  type="date"
                  value={paymentBreakdownDate}
                  onChange={(e) => setPaymentBreakdownDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-gray-600">
                  {new Date(paymentBreakdownDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const breakdown = getPaymentBreakdownByDate(paymentBreakdownDate);
                return (
                  <>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-8 text-white text-center mb-6">
                      <p className="text-lg opacity-90 mb-2">Total Revenue</p>
                      <p className="text-5xl font-bold mb-2">{formatPrice(breakdown.total)}</p>
                      <p className="text-sm opacity-75">
                        From {breakdown.orderCount} order{breakdown.orderCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Cash Payments</h3>
                          <Wallet className="text-green-600" size={32} />
                        </div>
                        <p className="text-4xl font-bold text-green-600 mb-2">
                          {formatPrice(breakdown.cash)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {((breakdown.cash / breakdown.total) * 100 || 0).toFixed(1)}% of total
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">M-Pesa Payments</h3>
                          <Smartphone className="text-blue-600" size={32} />
                        </div>
                        <p className="text-4xl font-bold text-blue-600 mb-2">
                          {formatPrice(breakdown.mpesa)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {((breakdown.mpesa / breakdown.total) * 100 || 0).toFixed(1)}% of total
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Card Payments</h3>
                          <CreditCard className="text-purple-600" size={32} />
                        </div>
                        <p className="text-4xl font-bold text-purple-600 mb-2">
                          {formatPrice(breakdown.card)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {((breakdown.card / breakdown.total) * 100 || 0).toFixed(1)}% of total
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Credit Sales</h3>
                          <TrendingDown className="text-orange-600" size={32} />
                        </div>
                        <p className="text-4xl font-bold text-orange-600 mb-2">
                          {formatPrice(breakdown.credit)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {((breakdown.credit / breakdown.total) * 100 || 0).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>

                    {/* Orders by Payment Method */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900">Orders Breakdown</h3>
                      {getOrdersByDate(paymentBreakdownDate).length > 0 ? (
                        getOrdersByDate(paymentBreakdownDate)
                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                          .map((order) => {
                            const isSplit = order.paymentDetails?.isSplit;
                            return (
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
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      isSplit 
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : order.paymentMethod?.toLowerCase().includes('mpesa')
                                          ? 'bg-blue-100 text-blue-700'
                                          : order.paymentMethod?.toLowerCase().includes('cash')
                                            ? 'bg-green-100 text-green-700'
                                            : order.paymentMethod?.toLowerCase().includes('card')
                                              ? 'bg-purple-100 text-purple-700'
                                              : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      {isSplit ? 'Split Payment' : order.paymentMethod}
                                    </span>
                                  </div>
                                  {isSplit && order.paymentDetails?.splitPayments && (
                                    <div className="mt-2 text-xs text-gray-600">
                                      {order.paymentDetails.splitPayments.map((payment, idx) => (
                                        <div key={idx}>
                                          • {payment.method}: {formatPrice(payment.amount)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
                            );
                          })
                      ) : (
                        <div className="text-center py-12">
                          <DollarSign className="mx-auto text-gray-300 mb-4" size={64} />
                          <p className="text-gray-500 text-lg">No orders on this date</p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
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