import { useState, useEffect } from 'react';
import { useOrders } from '../contexts/OrderContext';
import { useProducts } from '../contexts/ProductContext';
import { formatPrice } from '../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (parseFloat(order.total) || 0);
    }, 0);

    const lowStockProducts = products.filter((p) => p.stock < 10);

    setStats({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
    });
  }, [orders, products]);

  const getTopSellingProducts = () => {
    const productSales = {};

    orders.forEach((order) => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach((item) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            id: item.id,
            title: item.title,
            quantity: 0, // ✅ Initialize as number
            revenue: 0,
            image: item.image,
          };
        }
        
        // ✅ CRITICAL FIX: Parse quantity as integer
        const quantity = parseInt(item.quantity, 10) || 0;
        const price = parseFloat(item.price) || 0;
        
        productSales[item.id].quantity += quantity; // ✅ Now adds numbers, not strings
        productSales[item.id].revenue += price * quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const getRecentOrders = () => {
    return orders
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  const topProducts = getTopSellingProducts();
  const recentOrders = getRecentOrders();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={<DollarSign />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag />}
          color="bg-blue-500"
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

      {/* Charts and Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-meat" />
            Top Selling Products
          </h2>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
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
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.map((order) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}