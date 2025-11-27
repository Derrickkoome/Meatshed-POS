import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getOrders as getOrdersFromDB,
  createOrder as createOrderInDB,
  deleteOrder as deleteOrderFromDB
} from '../services/firestoreService';
import { offlineStorage } from '../utils/offlineStorage';
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

  // Create new order in Firestore or offline
const createOrder = async (orderData) => {
  const orderToSave = {
    ...orderData,
    id: `ORD-${Date.now()}`,
    timestamp: orderData.timestamp || new Date().toISOString(),
  };

  try {
    // Try to save to Firestore
    const newOrder = await createOrderInDB(orderToSave);
    setOrders((prev) => [newOrder, ...prev]);
    toast.success('Order completed successfully!');
    return newOrder;
  } catch (error) {
    console.error('Error creating order online:', error);
    
    // If offline, save to IndexedDB
    if (!navigator.onLine) {
      try {
        const offlineOrder = await offlineStorage.saveOrderOffline(orderToSave);
        setOrders((prev) => [offlineOrder, ...prev]);
        toast.success('Order saved offline. Will sync when online.', { icon: '💾' });
        return offlineOrder;
      } catch (offlineError) {
        console.error('Error saving order offline:', offlineError);
        toast.error('Failed to save order');
        throw offlineError;
      }
    } else {
      toast.error('Failed to create order');
      throw error;
    }
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

  // Delete order (admin only)
  const deleteOrder = async (orderId) => {
    try {
      await deleteOrderFromDB(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      toast.success('Order deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
      throw error;
    }
  };

  // Sync offline orders when online
  const syncOfflineOrders = async () => {
    try {
      const pendingOrders = await offlineStorage.getPendingOrders();
      
      for (const order of pendingOrders) {
        try {
          const syncedOrder = await createOrderInDB(order);
          await offlineStorage.markOrderSynced(order.offlineId, syncedOrder.id);
          console.log(`Synced order ${order.offlineId}`);
        } catch (error) {
          console.error(`Failed to sync order ${order.offlineId}:`, error);
        }
      }
      
      if (pendingOrders.length > 0) {
        await fetchOrders(); // Refresh orders
        toast.success(`Synced ${pendingOrders.length} offline orders`);
      }
    } catch (error) {
      console.error('Error syncing offline orders:', error);
    }
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
    
    // Listen for sync events
    const handleSync = (event) => {
      syncOfflineOrders();
    };
    
    window.addEventListener('offlineSync', handleSync);
    
    return () => {
      window.removeEventListener('offlineSync', handleSync);
    };
  }, []);

  const value = {
    orders,
    loading,
    createOrder,
    deleteOrder,
    getOrderById,
    getOrdersByDateRange,
    getTotalSales,
    getTodaysSales,
    fetchOrders,
    syncOfflineOrders,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}