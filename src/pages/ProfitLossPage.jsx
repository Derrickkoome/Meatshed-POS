import { useEffect, useState } from 'react';
import { getOrders, getProducts } from '../services/firestoreService';
import { useExpenses } from '../contexts/ExpenseContext';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

function calculatePnL({ orders, expenses, products, startDate, endDate }) {
  // Filter orders and expenses by date
  const filteredOrders = orders.filter(order => {
    const t = new Date(order.timestamp);
    return t >= startDate && t <= endDate;
  });
  const filteredExpenses = expenses.filter(exp => {
    const t = new Date(exp.timestamp);
    return t >= startDate && t <= endDate;
  });

  // Map productId to costPrice
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

export default function ProfitLossPage() {
  const { expenses, loading: loadingExpenses } = useExpenses();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

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

  const startDate = new Date(range.start);
  const endDate = new Date(range.end + 'T23:59:59');
  const pnl = calculatePnL({ orders, expenses, products, startDate, endDate });

  function downloadCSV() {
    const rows = [
      ['Metric', 'Amount'],
      ['Total Sales', pnl.totalSales],
      ['Cost of Goods Sold', pnl.totalCOGS],
      ['Gross Profit', pnl.grossProfit],
      ['Total Expenses', pnl.totalExpenses],
      ['Net Profit', pnl.netProfit],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PnL_${range.start}_to_${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 card mt-8">
      <h2 className="text-2xl font-bold mb-4">Profit & Loss Statement</h2>
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" value={range.start} onChange={e => setRange(r => ({ ...r, start: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input type="date" value={range.end} onChange={e => setRange(r => ({ ...r, end: e.target.value }))} className="input" />
        </div>
        <button onClick={downloadCSV} className="btn-primary self-end flex items-center gap-2"><Download size={16}/>Download CSV</button>
      </div>
      {loading || loadingExpenses ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full text-lg">
          <tbody>
            <tr><td>Total Sales</td><td className="text-right font-semibold">{pnl.totalSales.toLocaleString()}</td></tr>
            <tr><td>Cost of Goods Sold</td><td className="text-right">{pnl.totalCOGS.toLocaleString()}</td></tr>
            <tr><td>Gross Profit</td><td className="text-right">{pnl.grossProfit.toLocaleString()}</td></tr>
            <tr><td>Total Expenses</td><td className="text-right">{pnl.totalExpenses.toLocaleString()}</td></tr>
            <tr className="font-bold"><td>Net Profit</td><td className="text-right">{pnl.netProfit.toLocaleString()}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
