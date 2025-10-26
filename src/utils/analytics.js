// Calculate percentage change
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Get date range
export const getDateRange = (range) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      return {
        start: weekStart,
        end: now
      };
    
    case 'month':
      const monthStart = new Date(today);
      monthStart.setDate(monthStart.getDate() - 30);
      return {
        start: monthStart,
        end: now
      };
    
    default:
      return { start: today, end: now };
  }
};

// Filter orders by date range
export const filterOrdersByDateRange = (orders, range) => {
  const { start, end } = getDateRange(range);
  
  return orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= start && orderDate <= end;
  });
};

// Calculate total revenue from orders
export const calculateTotalRevenue = (orders) => {
  return orders.reduce((sum, order) => sum + order.total, 0);
};

// Calculate average order value
export const calculateAverageOrderValue = (orders) => {
  if (orders.length === 0) return 0;
  return calculateTotalRevenue(orders) / orders.length;
};

// Get top selling products
export const getTopSellingProducts = (orders, limit = 5) => {
  const productSales = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.id]) {
        productSales[item.id] = {
          id: item.id,
          title: item.title,
          quantity: 0,
          revenue: 0,
          image: item.image
        };
      }
      productSales[item.id].quantity += item.quantity;
      productSales[item.id].revenue += item.price * item.quantity;
    });
  });
  
  return Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};

// Get sales by category
export const getSalesByCategory = (orders, products) => {
  const categorySales = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      const category = product?.category || 'other';
      
      if (!categorySales[category]) {
        categorySales[category] = 0;
      }
      categorySales[category] += item.price * item.quantity;
    });
  });
  
  return categorySales;
};

// Get sales by payment method
export const getSalesByPaymentMethod = (orders) => {
  const paymentSales = {};
  
  orders.forEach(order => {
    const method = order.paymentMethod;
    if (!paymentSales[method]) {
      paymentSales[method] = 0;
    }
    paymentSales[method] += order.total;
  });
  
  return paymentSales;
};

// Get low stock products
export const getLowStockProducts = (products, threshold = 10) => {
  return products
    .filter(product => product.stock <= threshold && product.stock > 0)
    .sort((a, b) => a.stock - b.stock);
};

// Get out of stock products
export const getOutOfStockProducts = (products) => {
  return products.filter(product => product.stock === 0);
};

// Get daily sales for last N days
export const getDailySales = (orders, days = 7) => {
  const dailySales = {};
  const today = new Date();
  
  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailySales[dateStr] = 0;
  }
  
  // Calculate sales for each day
  orders.forEach(order => {
    const orderDate = new Date(order.timestamp);
    const dateStr = orderDate.toISOString().split('T')[0];
    
    if (dailySales.hasOwnProperty(dateStr)) {
      dailySales[dateStr] += order.total;
    }
  });
  
  return dailySales;
};