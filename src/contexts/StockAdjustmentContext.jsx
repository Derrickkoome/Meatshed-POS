import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const StockAdjustmentContext = createContext({});

export const useStockAdjustments = () => useContext(StockAdjustmentContext);

export function StockAdjustmentProvider({ children }) {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const adjustmentsRef = collection(db, 'stock_adjustments');
      const q = query(adjustmentsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setAdjustments(records);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
      toast.error('Failed to load stock adjustments');
    } finally {
      setLoading(false);
    }
  };

  const createAdjustment = async (adjustmentData) => {
    try {
      const adjustmentsRef = collection(db, 'stock_adjustments');
      const newAdjustment = {
        ...adjustmentData,
        timestamp: new Date().toISOString(),
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(adjustmentsRef, newAdjustment);
      const createdAdjustment = { id: docRef.id, ...newAdjustment };
      
      setAdjustments(prev => [createdAdjustment, ...prev]);
      return createdAdjustment;
    } catch (error) {
      console.error('Error creating adjustment:', error);
      toast.error('Failed to create stock adjustment');
      throw error;
    }
  };

  const getAdjustmentsByProduct = async (productId) => {
    try {
      const adjustmentsRef = collection(db, 'stock_adjustments');
      const q = query(
        adjustmentsRef, 
        where('productId', '==', productId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching product adjustments:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  return (
    <StockAdjustmentContext.Provider
      value={{
        adjustments,
        loading,
        createAdjustment,
        getAdjustmentsByProduct,
        fetchAdjustments,
      }}
    >
      {children}
    </StockAdjustmentContext.Provider>
  );
}
