import { useState, useEffect } from 'react';
import ProfitLossWidget from '../components/ProfitLossWidget';
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
  Users,
  BarChart3,
  Link as LinkIcon,
  Target,
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
  const [showCombinationsModal, setShowCombinationsModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
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

  const getPeakHoursAnalysis = () => {
    const hourlyData = {};
    
    // Initialize all 24 hours
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = {
        hour: i,
        orders: 0,
        revenue: 0,
        items: 0,
      };
    }

    // Aggregate order data by hour
    orders.forEach(order => {
      const date = new Date(order.timestamp);
      const hour = date.getHours();
      
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += parseFloat(order.total) || 0;
      hourlyData[hour].items += order.items?.length || 0;
    });

    const hourlyArray = Object.values(hourlyData);
    
    // Find peak hour
    const peakHour = hourlyArray.reduce((max, curr) => 
      curr.orders > max.orders ? curr : max
    , hourlyArray[0]);

    // Get time periods
    const morning = hourlyArray.filter(h => h.hour >= 6 && h.hour < 12);
    const afternoon = hourlyArray.filter(h => h.hour >= 12 && h.hour < 18);
    const evening = hourlyArray.filter(h => h.hour >= 18 && h.hour < 24);
    const night = hourlyArray.filter(h => h.hour >= 0 && h.hour < 6);

    const sumPeriod = (period) => ({
      orders: period.reduce((sum, h) => sum + h.orders, 0),
      revenue: period.reduce((sum, h) => sum + h.revenue, 0),
    });

    return {
      hourlyData: hourlyArray,
      peakHour,
      periods: {
        morning: sumPeriod(morning),
        afternoon: sumPeriod(afternoon),
        evening: sumPeriod(evening),
        night: sumPeriod(night),
      },
      busiestPeriod: (() => {
        const periods = {
          'Morning (6am-12pm)': sumPeriod(morning),
          'Afternoon (12pm-6pm)': sumPeriod(afternoon),
          'Evening (6pm-12am)': sumPeriod(evening),
          'Night (12am-6am)': sumPeriod(night),
        };
        return Object.entries(periods).reduce((max, [name, data]) => 
          data.orders > max.orders ? { name, ...data } : max
        , { name: 'Morning (6am-12pm)', orders: 0, revenue: 0 });
      })(),
    };
  };

  const getProductCombinations = () => {
    const combinations = {};
    
    orders.forEach(order => {
      if (!order.items || order.items.length < 2) return;
      
      // Get all product pairs in this order
      for (let i = 0; i < order.items.length; i++) {
        for (let j = i + 1; j < order.items.length; j++) {
          const product1 = order.items[i];
          const product2 = order.items[j];
          
          // Create a consistent key (alphabetically sorted)
          const ids = [product1.id, product2.id].sort();
          const key = `${ids[0]}_${ids[1]}`;
          
          if (!combinations[key]) {
            combinations[key] = {
              product1: { id: product1.id, title: product1.title, image: product1.image },
              product2: { id: product2.id, title: product2.title, image: product2.image },
              count: 0,
              revenue: 0,
            };
          }
          
          combinations[key].count += 1;
          combinations[key].revenue += (parseFloat(product1.price) * product1.quantity) + 
                                       (parseFloat(product2.price) * product2.quantity);
        }
      }
    });
    
    return Object.values(combinations)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getSalesForecast = () => {
    const last30Days = [];
    const today = new Date();
    
    // Get last 30 days of sales
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.toISOString().split('T')[0] === dateKey;
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
      
      last30Days.push({
        date: dateKey,
        revenue,
        orders: dayOrders.length,
      });
    }
    
    // Calculate averages and trends
    const avgDailyRevenue = last30Days.reduce((sum, day) => sum + day.revenue, 0) / 30;
    const avgDailyOrders = last30Days.reduce((sum, day) => sum + day.orders, 0) / 30;
    
    // Calculate trend (simple linear regression)
    const recentWeek = last30Days.slice(-7);
    const previousWeek = last30Days.slice(-14, -7);
    
    const recentAvg = recentWeek.reduce((sum, day) => sum + day.revenue, 0) / 7;
    const previousAvg = previousWeek.reduce((sum, day) => sum + day.revenue, 0) / 7;
    
    const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
    
    // Predict next 7 days
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Simple prediction: average + trend
      const predictedRevenue = avgDailyRevenue * (1 + (trend / 100));
      const predictedOrders = Math.round(avgDailyOrders * (1 + (trend / 100)));
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        predictedRevenue,
        predictedOrders,
      });
    }
    
    return {
      last30Days,
      avgDailyRevenue,
      avgDailyOrders,
      trend,
      predictions,
      totalRevenue30Days: last30Days.reduce((sum, day) => sum + day.revenue, 0),
    };
  };

  const getCashierPerformance = () => {
    const cashierStats = {};
    
    orders.forEach(order => {
      const cashier = order.cashier || 'Unknown';
      
      if (!cashierStats[cashier]) {
        cashierStats[cashier] = {
          name: cashier,
          orders: 0,
          revenue: 0,
          items: 0,
          avgOrderValue: 0,
        };
      }
      
      cashierStats[cashier].orders += 1;
      cashierStats[cashier].revenue += parseFloat(order.total) || 0;
      cashierStats[cashier].items += order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    });
    
    // Calculate averages
    Object.values(cashierStats).forEach(stats => {
      stats.avgOrderValue = stats.orders > 0 ? stats.revenue / stats.orders : 0;
    });
    
    return Object.values(cashierStats).sort((a, b) => b.revenue - a.revenue);
  };

  const topProducts = getTopSellingProducts();
  const topCategories = getTopSellingCategories();
  const lowStockProducts = getLowStockProducts();
  const recentOrders = getRecentOrders();
  const last7DaysSales = getLast7DaysSales();
  const todayOrdersByCategory = getTodayOrdersByCategory();
  const selectedDateOrders = getOrdersByDateAndCategory(selectedDate);
  const peakHoursData = getPeakHoursAnalysis();
  const productCombinations = getProductCombinations();
  const salesForecast = getSalesForecast();
  const cashierPerformance = getCashierPerformance();

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

      {/* P&L Widget */}
      <div className="mb-8">
        <ProfitLossWidget />
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

        {/* Peak Hours Analysis */}
        <div 
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowPeakHoursModal(true)}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="text-blue-600" />
            Peak Hours Analysis
          </h2>
          <div className="space-y-4">
            {/* Peak Hour */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Busiest Hour</p>
              <p className="text-3xl font-bold text-blue-600">
                {peakHoursData.peakHour.hour}:00 - {peakHoursData.peakHour.hour + 1}:00
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">{peakHoursData.peakHour.orders} orders</span>
                <span className="font-semibold text-blue-600">
                  {formatPrice(peakHoursData.peakHour.revenue)}
                </span>
              </div>
            </div>

            {/* Busiest Period */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Busiest Period</p>
              <p className="text-lg font-bold text-orange-600">
                {peakHoursData.busiestPeriod.name}
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">{peakHoursData.busiestPeriod.orders} orders</span>
                <span className="font-semibold text-orange-600">
                  {formatPrice(peakHoursData.busiestPeriod.revenue)}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <Sun className="mx-auto text-yellow-500 mb-1" size={20} />
                <p className="text-xs text-gray-600">Morning</p>
                <p className="text-sm font-bold">{peakHoursData.periods.morning.orders}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <Sunset className="mx-auto text-orange-500 mb-1" size={20} />
                <p className="text-xs text-gray-600">Afternoon</p>
                <p className="text-sm font-bold">{peakHoursData.periods.afternoon.orders}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <Moon className="mx-auto text-indigo-500 mb-1" size={20} />
                <p className="text-xs text-gray-600">Evening</p>
                <p className="text-sm font-bold">{peakHoursData.periods.evening.orders}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <Moon className="mx-auto text-gray-400 mb-1" size={20} />
                <p className="text-xs text-gray-600">Night</p>
                <p className="text-sm font-bold">{peakHoursData.periods.night.orders}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Click to view detailed breakdown</p>
        </div>
      </div>

      {/* New Analytics Cards */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Product Combinations */}
        <div 
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowCombinationsModal(true)}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LinkIcon className="text-purple-600" />
            Frequently Bought Together
          </h2>
          {productCombinations.length > 0 ? (
            <div className="space-y-3">
              {productCombinations.slice(0, 3).map((combo, index) => (
                <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={combo.product1.image} alt={combo.product1.title} className="w-8 h-8 rounded object-cover" />
                    <span className="text-xs text-gray-600">+</span>
                    <img src={combo.product2.image} alt={combo.product2.title} className="w-8 h-8 rounded object-cover" />
                  </div>
                  <p className="text-xs text-gray-700 font-medium">{combo.product1.title} + {combo.product2.title}</p>
                  <p className="text-xs text-purple-600 font-semibold mt-1">{combo.count} times together</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Not enough data yet</p>
          )}
          <p className="text-xs text-gray-500 mt-3 text-center">Click for full analysis</p>
        </div>

        {/* Sales Forecast */}
        <div 
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowForecastModal(true)}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="text-indigo-600" />
            Sales Forecast
          </h2>
          <div className="space-y-3">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <p className="text-sm text-gray-600 mb-1">Trend</p>
              <div className="flex items-center gap-2">
                {salesForecast.trend >= 0 ? (
                  <ArrowUp className="text-green-600" size={24} />
                ) : (
                  <ArrowDown className="text-red-600" size={24} />
                )}
                <span className={`text-2xl font-bold ${salesForecast.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(salesForecast.trend).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">vs previous week</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Next 7 Days Forecast</p>
              <p className="text-lg font-bold text-indigo-600">
                {formatPrice(salesForecast.predictions.reduce((sum, p) => sum + p.predictedRevenue, 0))}
              </p>
              <p className="text-xs text-gray-600">{salesForecast.predictions.reduce((sum, p) => sum + p.predictedOrders, 0)} expected orders</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">Click for detailed forecast</p>
        </div>

        {/* Cashier Performance */}
        <div 
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowCashierModal(true)}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-teal-600" />
            Employee Performance
          </h2>
          {cashierPerformance.length > 0 ? (
            <div className="space-y-2">
              {cashierPerformance.slice(0, 3).map((cashier, index) => (
                <div key={cashier.name} className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-teal-300">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-sm">{cashier.name}</p>
                        <p className="text-xs text-gray-600">{cashier.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-600 text-sm">{formatPrice(cashier.revenue)}</p>
                      <p className="text-xs text-gray-600">{formatPrice(cashier.avgOrderValue)} avg</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No cashier data yet</p>
          )}
          <p className="text-xs text-gray-500 mt-3 text-center">Click for full report</p>
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

      {/* Peak Hours Modal */}
      {showPeakHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="text-blue-500" />
                Peak Hours Analysis
              </h2>
              <button
                onClick={() => setShowPeakHoursModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                  <Clock size={32} className="mb-3" />
                  <p className="text-sm opacity-90 mb-1">Busiest Hour</p>
                  <p className="text-3xl font-bold mb-2">
                    {peakHoursData.peakHour.hour}:00
                  </p>
                  <div className="flex items-center justify-between text-sm border-t border-white/20 pt-3 mt-3">
                    <span>{peakHoursData.peakHour.orders} orders</span>
                    <span className="font-semibold">{formatPrice(peakHoursData.peakHour.revenue)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
                  <Sun size={32} className="mb-3" />
                  <p className="text-sm opacity-90 mb-1">Busiest Period</p>
                  <p className="text-xl font-bold mb-2">
                    {peakHoursData.busiestPeriod.name}
                  </p>
                  <div className="flex items-center justify-between text-sm border-t border-white/20 pt-3 mt-3">
                    <span>{peakHoursData.busiestPeriod.orders} orders</span>
                    <span className="font-semibold">{formatPrice(peakHoursData.busiestPeriod.revenue)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                  <TrendingUp size={32} className="mb-3" />
                  <p className="text-sm opacity-90 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold mb-2">
                    {orders.length}
                  </p>
                  <div className="flex items-center justify-between text-sm border-t border-white/20 pt-3 mt-3">
                    <span>Analyzed</span>
                    <span className="font-semibold">{formatPrice(stats.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Time Period Breakdown */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Performance by Time Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Sun className="text-yellow-600" size={28} />
                      <span className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
                        6am - 12pm
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Morning</h4>
                    <p className="text-2xl font-bold text-yellow-600 mb-2">
                      {peakHoursData.periods.morning.orders}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(peakHoursData.periods.morning.revenue)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Sun className="text-orange-600" size={28} />
                      <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
                        12pm - 6pm
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Afternoon</h4>
                    <p className="text-2xl font-bold text-orange-600 mb-2">
                      {peakHoursData.periods.afternoon.orders}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(peakHoursData.periods.afternoon.revenue)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Sunset className="text-indigo-600" size={28} />
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-200 px-2 py-1 rounded-full">
                        6pm - 12am
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Evening</h4>
                    <p className="text-2xl font-bold text-indigo-600 mb-2">
                      {peakHoursData.periods.evening.orders}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(peakHoursData.periods.evening.revenue)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Moon className="text-gray-600" size={28} />
                      <span className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1 rounded-full">
                        12am - 6am
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Night</h4>
                    <p className="text-2xl font-bold text-gray-600 mb-2">
                      {peakHoursData.periods.night.orders}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(peakHoursData.periods.night.revenue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hourly Breakdown Table */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Hourly Breakdown</h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {peakHoursData.hourlyData
                          .filter(h => h.orders > 0)
                          .sort((a, b) => b.orders - a.orders)
                          .map((hour) => {
                            const avgOrder = hour.orders > 0 ? hour.revenue / hour.orders : 0;
                            const maxOrders = Math.max(...peakHoursData.hourlyData.map(h => h.orders));
                            const activityPercent = maxOrders > 0 ? (hour.orders / maxOrders) * 100 : 0;
                            const isPeak = hour.hour === peakHoursData.peakHour.hour;
                            
                            return (
                              <tr 
                                key={hour.hour} 
                                className={`hover:bg-gray-50 ${isPeak ? 'bg-blue-50' : ''}`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Clock size={16} className={isPeak ? 'text-blue-600' : 'text-gray-400'} />
                                    <span className={`font-medium ${isPeak ? 'text-blue-600' : 'text-gray-900'}`}>
                                      {hour.hour}:00 - {hour.hour + 1}:00
                                    </span>
                                    {isPeak && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                        PEAK
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-lg font-bold text-gray-900">{hour.orders}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-semibold text-green-600">
                                    {formatPrice(hour.revenue)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-gray-600">{formatPrice(avgOrder)}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[150px]">
                                      <div 
                                        className={`h-2 rounded-full ${isPeak ? 'bg-blue-600' : 'bg-green-500'}`}
                                        style={{ width: `${activityPercent}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 w-12">
                                      {activityPercent.toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {peakHoursData.hourlyData.filter(h => h.orders > 0).length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="mx-auto text-gray-300 mb-4" size={64} />
                      <p className="text-gray-500 text-lg">No order data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insights */}
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} />
                  Business Insights
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Your peak hour is <strong>{peakHoursData.peakHour.hour}:00 - {peakHoursData.peakHour.hour + 1}:00</strong> with {peakHoursData.peakHour.orders} orders
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Most orders come during <strong>{peakHoursData.busiestPeriod.name}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Consider scheduling more staff during peak hours to handle demand
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Run promotions during slow hours to boost sales
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Combinations Modal */}
      {showCombinationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <LinkIcon className="text-purple-500" />
                Frequently Bought Together
              </h2>
              <button
                onClick={() => setShowCombinationsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {productCombinations.length > 0 ? (
                <div className="space-y-4">
                  {productCombinations.map((combo, index) => (
                    <div key={index} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-3xl font-bold text-purple-300">#{index + 1}</span>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex flex-col items-center">
                            <img src={combo.product1.image} alt={combo.product1.title} className="w-20 h-20 rounded-lg object-cover border-2 border-white shadow" />
                            <p className="text-sm font-semibold mt-2 text-center">{combo.product1.title}</p>
                          </div>
                          <div className="text-purple-600">
                            <LinkIcon size={32} />
                          </div>
                          <div className="flex flex-col items-center">
                            <img src={combo.product2.image} alt={combo.product2.title} className="w-20 h-20 rounded-lg object-cover border-2 border-white shadow" />
                            <p className="text-sm font-semibold mt-2 text-center">{combo.product2.title}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Times Purchased Together</p>
                          <p className="text-2xl font-bold text-purple-600">{combo.count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Combined Revenue</p>
                          <p className="text-2xl font-bold text-green-600">{formatPrice(combo.revenue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <LinkIcon className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg">Not enough order data yet</p>
                  <p className="text-gray-400 text-sm mt-2">Product combinations will appear after customers make orders with multiple items</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Forecast Modal */}
      {showForecastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="text-indigo-500" />
                Sales Forecast & Trends
              </h2>
              <button
                onClick={() => setShowForecastModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-5">
                  <BarChart3 size={28} className="mb-2" />
                  <p className="text-sm opacity-90 mb-1">30-Day Average</p>
                  <p className="text-2xl font-bold">{formatPrice(salesForecast.avgDailyRevenue)}</p>
                  <p className="text-xs opacity-75 mt-1">{Math.round(salesForecast.avgDailyOrders)} orders/day</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5">
                  <TrendingUp size={28} className="mb-2" />
                  <p className="text-sm opacity-90 mb-1">Trend</p>
                  <p className={`text-2xl font-bold ${salesForecast.trend >= 0 ? '' : 'text-red-200'}`}>
                    {salesForecast.trend >= 0 ? '+' : ''}{salesForecast.trend.toFixed(1)}%
                  </p>
                  <p className="text-xs opacity-75 mt-1">vs previous week</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5">
                  <DollarSign size={28} className="mb-2" />
                  <p className="text-sm opacity-90 mb-1">Last 30 Days</p>
                  <p className="text-2xl font-bold">{formatPrice(salesForecast.totalRevenue30Days)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5">
                  <Target size={28} className="mb-2" />
                  <p className="text-sm opacity-90 mb-1">Next 7 Days</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(salesForecast.predictions.reduce((sum, p) => sum + p.predictedRevenue, 0))}
                  </p>
                </div>
              </div>

              {/* 7-Day Forecast */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {salesForecast.predictions.map((day, index) => (
                    <div key={index} className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 text-center">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{day.dayName}</p>
                      <p className="text-sm text-gray-500 mb-2">{new Date(day.date).getDate()}</p>
                      <p className="text-lg font-bold text-indigo-600">{formatPrice(day.predictedRevenue)}</p>
                      <p className="text-xs text-gray-600 mt-1">{day.predictedOrders} orders</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={20} />
                  Forecast Insights
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      Sales are trending <strong className={salesForecast.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {salesForecast.trend >= 0 ? 'upward' : 'downward'}
                      </strong> by {Math.abs(salesForecast.trend).toFixed(1)}% compared to last week
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      Expected revenue for next week: <strong>{formatPrice(salesForecast.predictions.reduce((sum, p) => sum + p.predictedRevenue, 0))}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      Daily average: <strong>{formatPrice(salesForecast.avgDailyRevenue)}</strong> from {Math.round(salesForecast.avgDailyOrders)} orders
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      Plan inventory and staff based on predicted {salesForecast.predictions.reduce((sum, p) => sum + p.predictedOrders, 0)} orders next week
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Performance Modal */}
      {showCashierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="text-teal-500" />
                Employee Performance
              </h2>
              <button
                onClick={() => setShowCashierModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {cashierPerformance.length > 0 ? (
                <div className="space-y-4">
                  {cashierPerformance.map((cashier, index) => (
                    <div key={cashier.name} className="bg-gradient-to-r from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-bold text-teal-300">#{index + 1}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{cashier.name}</h3>
                            <p className="text-sm text-gray-600">Cashier</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {index === 0 && <Award className="text-yellow-500" size={32} />}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                          <p className="text-2xl font-bold text-teal-600">{cashier.orders}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-600">{formatPrice(cashier.revenue)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(cashier.avgOrderValue)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Items Sold</p>
                          <p className="text-2xl font-bold text-purple-600">{cashier.items}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg">No cashier data available</p>
                </div>
              )}
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