import { useOrders } from '../contexts/OrderContext';
import { useProducts } from '../contexts/ProductContext';
import { formatPrice } from '../utils/formatters';
import {
  calculateTotalRevenue,
  calculateAverageOrderValue,
  filterOrdersByDateRange,
  calculatePercentageChange,
  getTopSellingProducts,
  getSalesByCategory,
  getSalesByPaymentMethod,
  getLowStockProducts,
  getOutOfStockProducts,
  getDailySales
} from '../utils/analytics';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { orders } = useOrders();
  const { products } = useProducts();

  // Calculate metrics
  const todayOrders = filterOrdersByDateRange(orders, 'today');
  const yesterdayOrders = filterOrdersByDateRange(orders, 'yesterday');
  const weekOrders = filterOrdersByDateRange(orders, 'week');
  const monthOrders = filterOrdersByDateRange(orders, 'month');

  const todayRevenue = calculateTotalRevenue(todayOrders);
  const yesterdayRevenue = calculateTotalRevenue(yesterdayOrders);
  const totalRevenue = calculateTotalRevenue(orders);
  const avgOrderValue = calculateAverageOrderValue(orders);

  const revenueChange = calculatePercentageChange(todayRevenue, yesterdayRevenue);
  const ordersChange = calculatePercentageChange(todayOrders.length, yesterdayOrders.length);

  // Get insights
  const topProducts = getTopSellingProducts(orders, 5);
  const salesByCategory = getSalesByCategory(orders, products);
  const salesByPayment = getSalesByPaymentMethod(orders);
  const lowStockProducts = getLowStockProducts(products, 10);
  const outOfStockProducts = getOutOfStockProducts(products);
  const dailySales = getDailySales(orders, 7);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
        </div>
        <Link to="/pos" className="btn-primary">
          Open POS
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={<DollarSign size={28} />}
          title="Today's Revenue"
          value={formatPrice(todayRevenue)}
          change={revenueChange}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          icon={<ShoppingCart size={28} />}
          title="Today's Orders"
          value={todayOrders.length}
          change={ordersChange}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          icon={<TrendingUp size={28} />}
          title="Avg Order Value"
          value={formatPrice(avgOrderValue)}
          color="bg-purple-100 text-purple-600"
        />
        <StatsCard
          icon={<Package size={28} />}
          title="Total Revenue"
          value={formatPrice(totalRevenue)}
          subtitle={`${orders.length} orders`}
          color="bg-meat-light text-meat"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={24} />
            Sales Trend (Last 7 Days)
          </h2>
          <SalesChart data={dailySales} />
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <QuickStat
              label="This Week"
              value={formatPrice(calculateTotalRevenue(weekOrders))}
              orders={weekOrders.length}
            />
            <QuickStat
              label="This Month"
              value={formatPrice(calculateTotalRevenue(monthOrders))}
              orders={monthOrders.length}
            />
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard size={18} />
                Payment Methods
              </h3>
              {Object.entries(salesByPayment).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{method}</span>
                  <span className="font-semibold">{formatPrice(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Products */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{product.title}</h4>
                    <p className="text-xs text-gray-600">{product.quantity} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-meat">{formatPrice(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
          {Object.keys(salesByCategory).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(salesByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {category === 'beef' && '🐄'}
                        {category === 'chicken' && '🐔'}
                        {category === 'goat' && '🐐'}
                        {category === 'lamb' && '🐑'}
                        {category === 'pork' && '🐷'}
                        {category === 'processed' && '🌭'}
                      </span>
                      <span className="font-semibold capitalize">{category}</span>
                    </div>
                    <span className="font-bold text-meat">{formatPrice(amount)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-600">
            <AlertTriangle size={24} />
            Inventory Alerts
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Low Stock */}
            {lowStockProducts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-yellow-700">Low Stock ({lowStockProducts.length})</h3>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm">{product.title}</span>
                      <span className="text-sm font-semibold text-yellow-700">
                        {product.stock} left
                      </span>
                    </div>
                  ))}
                </div>
                {lowStockProducts.length > 5 && (
                  <Link to="/inventory" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                    View all {lowStockProducts.length} products
                  </Link>
                )}
              </div>
            )}

            {/* Out of Stock */}
            {outOfStockProducts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-red-700">Out of Stock ({outOfStockProducts.length})</h3>
                <div className="space-y-2">
                  {outOfStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{product.title}</span>
                      <span className="text-xs font-semibold text-red-700">OUT OF STOCK</span>
                    </div>
                  ))}
                </div>
                {outOfStockProducts.length > 5 && (
                  <Link to="/inventory" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                    View all {outOfStockProducts.length} products
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ icon, title, value, change, subtitle, color }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function QuickStat({ label, value, orders }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-500">{orders} orders</p>
      </div>
      <p className="text-lg font-bold text-meat">{value}</p>
    </div>
  );
}

function SalesChart({ data }) {
  const values = Object.values(data);
  const maxValue = Math.max(...values, 1);
  const dates = Object.keys(data);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 h-48">
        {dates.map((date, index) => {
          const value = data[date];
          const height = (value / maxValue) * 100;
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full flex items-end justify-center" style={{ height: '150px' }}>
                <div
                  className="w-full bg-meat rounded-t transition-all hover:bg-meat-dark cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${dayName}: ${formatPrice(value)}`}
                />
              </div>
              <p className="text-xs text-gray-600 font-medium">{dayName}</p>
              <p className="text-xs text-gray-500">{formatPrice(value)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}