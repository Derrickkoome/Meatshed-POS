import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const OnlineOrderContext = createContext();

export function useOnlineOrders() {
  const context = useContext(OnlineOrderContext);
  if (!context) {
    throw new Error('useOnlineOrders must be used within OnlineOrderProvider');
  }
  return context;
}

export function OnlineOrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders on mount with real-time updates
  useEffect(() => {
    const ordersRef = collection(db, 'onlineOrders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Create new order
  const createOrder = async (orderData) => {
    try {
      const ordersRef = collection(db, 'onlineOrders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      
      return { id: docRef.id, ...orderData };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Update order
  const updateOrder = async (orderId, updates) => {
    try {
      const orderRef = doc(db, 'onlineOrders', orderId);
      await updateDoc(orderRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'onlineOrders', orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };

  const value = {
    orders,
    loading,
    createOrder,
    updateOrder,
    deleteOrder
  };

  return (
    <OnlineOrderContext.Provider value={value}>
      {children}
    </OnlineOrderContext.Provider>
  );
}