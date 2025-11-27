// IndexedDB utility for offline storage
const DB_NAME = 'MeatshedPOS';
const DB_VERSION = 1;
const STORES = {
  ORDERS: 'pendingOrders',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SYNC_QUEUE: 'syncQueue'
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.initDB();
    this.setupOnlineListener();
  }

  // Initialize IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const ordersStore = db.createObjectStore(STORES.ORDERS, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          ordersStore.createIndex('timestamp', 'timestamp', { unique: false });
          ordersStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // Setup online/offline event listeners
  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connection restored');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network connection lost');
    });
  }

  // Generic method to add data to a store
  async addToStore(storeName, data) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get all data from a store
  async getAllFromStore(storeName) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to update data in a store
  async updateInStore(storeName, data) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to delete data from a store
  async deleteFromStore(storeName, id) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Save order offline
  async saveOrderOffline(orderData) {
    const order = {
      ...orderData,
      timestamp: Date.now(),
      synced: false,
      offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    await this.addToStore(STORES.ORDERS, order);
    
    // Add to sync queue
    await this.addToSyncQueue({
      type: 'order',
      action: 'create',
      data: order,
      timestamp: Date.now()
    });

    return order;
  }

  // Get all pending orders
  async getPendingOrders() {
    const orders = await this.getAllFromStore(STORES.ORDERS);
    return orders.filter(order => !order.synced);
  }

  // Mark order as synced
  async markOrderSynced(offlineId, firebaseId) {
    const orders = await this.getAllFromStore(STORES.ORDERS);
    const order = orders.find(o => o.offlineId === offlineId);
    
    if (order) {
      order.synced = true;
      order.firebaseId = firebaseId;
      order.syncedAt = Date.now();
      await this.updateInStore(STORES.ORDERS, order);
    }
  }

  // Cache products for offline access
  async cacheProducts(products) {
    const transaction = this.db.transaction([STORES.PRODUCTS], 'readwrite');
    const store = transaction.objectStore(STORES.PRODUCTS);
    
    // Clear existing products
    store.clear();
    
    // Add new products
    products.forEach(product => {
      store.add(product);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get cached products
  async getCachedProducts() {
    return this.getAllFromStore(STORES.PRODUCTS);
  }

  // Cache customers for offline access
  async cacheCustomers(customers) {
    const transaction = this.db.transaction([STORES.CUSTOMERS], 'readwrite');
    const store = transaction.objectStore(STORES.CUSTOMERS);
    
    // Clear existing customers
    store.clear();
    
    // Add new customers
    customers.forEach(customer => {
      store.add(customer);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get cached customers
  async getCachedCustomers() {
    return this.getAllFromStore(STORES.CUSTOMERS);
  }

  // Add item to sync queue
  async addToSyncQueue(item) {
    await this.addToStore(STORES.SYNC_QUEUE, item);
  }

  // Get sync queue
  async getSyncQueue() {
    return this.getAllFromStore(STORES.SYNC_QUEUE);
  }

  // Clear sync queue
  async clearSyncQueue() {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync pending data when online
  async syncPendingData() {
    if (!this.isOnline) return;

    const pendingOrders = await this.getPendingOrders();
    const syncQueue = await this.getSyncQueue();

    console.log(`Syncing ${pendingOrders.length} pending orders and ${syncQueue.length} queue items`);

    // Return pending data for the app to handle syncing
    return {
      orders: pendingOrders,
      queue: syncQueue
    };
  }

  // Check if online
  checkOnlineStatus() {
    return this.isOnline;
  }

  // Get storage info
  async getStorageInfo() {
    if (!this.db) await this.initDB();

    const orders = await this.getAllFromStore(STORES.ORDERS);
    const products = await this.getAllFromStore(STORES.PRODUCTS);
    const customers = await this.getAllFromStore(STORES.CUSTOMERS);
    const syncQueue = await this.getSyncQueue();

    return {
      pendingOrders: orders.filter(o => !o.synced).length,
      cachedProducts: products.length,
      cachedCustomers: customers.length,
      syncQueueSize: syncQueue.length,
      isOnline: this.isOnline
    };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();
export default offlineStorage;
