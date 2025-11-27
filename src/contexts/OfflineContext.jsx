import { createContext, useContext, useState, useEffect } from 'react';
import { offlineStorage } from '../utils/offlineStorage';
import toast from 'react-hot-toast';

const OfflineContext = createContext({});

export const useOffline = () => useContext(OfflineContext);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    pendingOrders: 0,
    cachedProducts: 0,
    cachedCustomers: 0,
    syncQueueSize: 0,
    isOnline: true
  });

  // Update online status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      toast.success('Connection restored! Syncing data...', {
        icon: '📡',
        duration: 3000
      });
      await syncOfflineData();
      await updateStorageInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Changes will be saved locally.', {
        icon: '📴',
        duration: 4000
      });
      updateStorageInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial storage info
    updateStorageInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update storage information
  const updateStorageInfo = async () => {
    try {
      const info = await offlineStorage.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error updating storage info:', error);
    }
  };

  // Sync offline data
  const syncOfflineData = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      const pendingData = await offlineStorage.syncPendingData();
      
      // This would be handled by the OrderContext or other contexts
      // Just emit an event that can be caught by contexts
      const event = new CustomEvent('offlineSync', { 
        detail: pendingData 
      });
      window.dispatchEvent(event);

      await updateStorageInfo();
    } catch (error) {
      console.error('Error syncing offline data:', error);
      toast.error('Failed to sync some data. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save order offline
  const saveOrderOffline = async (orderData) => {
    try {
      const order = await offlineStorage.saveOrderOffline(orderData);
      await updateStorageInfo();
      toast.success('Order saved offline. Will sync when online.', {
        icon: '💾',
        duration: 3000
      });
      return order;
    } catch (error) {
      console.error('Error saving order offline:', error);
      toast.error('Failed to save order offline');
      throw error;
    }
  };

  // Cache data for offline use
  const cacheDataForOffline = async (products, customers) => {
    try {
      if (products) {
        await offlineStorage.cacheProducts(products);
      }
      if (customers) {
        await offlineStorage.cacheCustomers(customers);
      }
      await updateStorageInfo();
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  // Get cached data
  const getCachedData = async () => {
    try {
      const products = await offlineStorage.getCachedProducts();
      const customers = await offlineStorage.getCachedCustomers();
      return { products, customers };
    } catch (error) {
      console.error('Error getting cached data:', error);
      return { products: [], customers: [] };
    }
  };

  // Get pending orders
  const getPendingOrders = async () => {
    try {
      return await offlineStorage.getPendingOrders();
    } catch (error) {
      console.error('Error getting pending orders:', error);
      return [];
    }
  };

  // Mark order as synced
  const markOrderSynced = async (offlineId, firebaseId) => {
    try {
      await offlineStorage.markOrderSynced(offlineId, firebaseId);
      await updateStorageInfo();
    } catch (error) {
      console.error('Error marking order as synced:', error);
    }
  };

  // Manual sync trigger
  const triggerSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    await syncOfflineData();
  };

  const value = {
    isOnline,
    isSyncing,
    storageInfo,
    saveOrderOffline,
    cacheDataForOffline,
    getCachedData,
    getPendingOrders,
    markOrderSynced,
    triggerSync,
    updateStorageInfo
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}
