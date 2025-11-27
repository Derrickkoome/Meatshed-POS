import { useEffect, useState } from 'react';
import { getOrders, getProducts } from '../services/firestoreService';
import { useExpenses } from '../contexts/ExpenseContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

function calculatePnL({ orders, expenses, products, startDate, endDate }) {
  const filteredOrders = orders.filter(order => {
    const t = new Date(order.timestamp);
    return t >= startDate && t <= endDate;
  });
  const filteredExpenses = expenses.filter(exp => {
    const t = new Date(exp.timestamp);
    return t >= startDate && t <= endDate;
  });
  const costMap = {};
  products.forEach(p => { costMap[p.id] = p.costPrice || 0; });
  let totalSales = 0;
  let totalCOGS = 0;
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      totalSales += item.price * item.quantity;
      totalCOGS += (costMap[item.productId] || 0) * item.quantity;
    });
  });
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const grossProfit = totalSales - totalCOGS;
  const netProfit = grossProfit - totalExpenses;
  return { totalSales, totalCOGS, grossProfit, totalExpenses, netProfit };
}

export default function ProfitLossWidget() {
  const { expenses, loading: loadingExpenses } = useExpenses();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [ordersData, productsData] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setLoading(false);
    }
    fetchData();
  }, []);
  const startDate = new Date(today + 'T00:00:00');
  const endDate = new Date(today + 'T23:59:59');
  const pnl = calculatePnL({ orders, expenses, products, startDate, endDate });
  return (
    <div className="card bg-gradient-to-r from-gray-800 to-gray-900 text-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm opacity-80">Today's Net Profit</div>
          <div className="text-2xl font-bold">{loading || loadingExpenses ? '...' : pnl.netProfit.toLocaleString()}</div>
        </div>
        <Link to="/profit-loss" className="btn-secondary bg-white/20 text-white border border-white hover:bg-white/30 ml-2">Full P&L</Link>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
        <div>Sales: <span className="font-semibold">{pnl.totalSales.toLocaleString()}</span></div>
        <div>COGS: <span className="font-semibold">{pnl.totalCOGS.toLocaleString()}</span></div>
        <div>Gross: <span className="font-semibold">{pnl.grossProfit.toLocaleString()}</span></div>
        <div>Expenses: <span className="font-semibold">{pnl.totalExpenses.toLocaleString()}</span></div>
      </div>
    </div>
  );
}
