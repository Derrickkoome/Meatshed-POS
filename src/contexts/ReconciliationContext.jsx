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

const ReconciliationContext = createContext({});

export const useReconciliation = () => useContext(ReconciliationContext);

export function ReconciliationProvider({ children }) {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const reconciliationsRef = collection(db, 'reconciliations');
      const q = query(reconciliationsRef, orderBy('closedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        closedAt: doc.data().closedAt?.toDate?.() || doc.data().closedAt
      }));
      
      setReconciliations(records);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
      toast.error('Failed to load reconciliation records');
    } finally {
      setLoading(false);
    }
  };

  const createReconciliation = async (reconciliationData) => {
    try {
      const docRef = await addDoc(collection(db, 'reconciliations'), {
        ...reconciliationData,
        closedAt: Timestamp.now()
      });

      const newReconciliation = {
        id: docRef.id,
        ...reconciliationData,
        closedAt: new Date()
      };

      setReconciliations(prev => [newReconciliation, ...prev]);
      toast.success('Day closed successfully');
      return newReconciliation;
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      toast.error('Failed to close day');
      throw error;
    }
  };

  const getTodayReconciliation = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return reconciliations.find(rec => {
      const recDate = new Date(rec.closedAt);
      recDate.setHours(0, 0, 0, 0);
      return recDate.getTime() === today.getTime();
    });
  };

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const value = {
    reconciliations,
    loading,
    fetchReconciliations,
    createReconciliation,
    getTodayReconciliation
  };

  return (
    <ReconciliationContext.Provider value={value}>
      {children}
    </ReconciliationContext.Provider>
  );
}
