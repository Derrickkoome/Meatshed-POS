import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getOrders as getOrdersFromDB,
  createOrder as createOrderInDB
} from '../services/firestoreService';
import toast from 'react-hot-toast';

const OrderContext = createContext({});

export const useOrders = () => useContext(OrderContext);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from Firestore
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersFromDB = await getOrdersFromDB();
      setOrders(ordersFromDB);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Create new order in Firestore
const createOrder = async (orderData) => {
  try {
    const newOrder = await createOrderInDB({
      ...orderData,
      id: `ORD-${Date.now()}`,
      timestamp: orderData.timestamp || new Date().toISOString(), // Ensure timestamp exists
    });
    
    setOrders((prev) => [newOrder, ...prev]);
    toast.success('Order completed successfully!');
    return newOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    toast.error('Failed to create order');
    throw error;
  }
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

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const value = {
    orders,
    loading,
    createOrder,
    getOrderById,
    getOrdersByDateRange,
    getTotalSales,
    getTodaysSales,
    fetchOrders,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}