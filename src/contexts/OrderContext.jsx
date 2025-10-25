import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';

const OrderContext = createContext({});

export const useOrders = () => useContext(OrderContext);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  // Create new order
  const createOrder = (orderData) => {
    const newOrder = {
      id: `ORD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...orderData,
    };

    setOrders((prev) => [newOrder, ...prev]);
    toast.success('Order completed successfully!');
    return newOrder;
  };

  // Get order by ID
  const getOrderById = (orderId) => {
    return orders.find((order) => order.id === orderId);
  };

  // Get orders by date range
  const getOrdersByDateRange = (startDate, endDate) => {
    return orders.filter((order) => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  // Calculate total sales
  const getTotalSales = () => {
    return orders.reduce((total, order) => total + order.total, 0);
  };

  // Get today's sales
  const getTodaysSales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter((order) => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  };

  const value = {
    orders,
    createOrder,
    getOrderById,
    getOrdersByDateRange,
    getTotalSales,
    getTodaysSales,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}