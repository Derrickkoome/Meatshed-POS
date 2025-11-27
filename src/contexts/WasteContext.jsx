import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const WasteContext = createContext({});

export const useWaste = () => useContext(WasteContext);

export function WasteProvider({ children }) {
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWasteRecords = async () => {
    try {
      setLoading(true);
      const wasteRef = collection(db, 'waste_records');
      const q = query(wasteRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setWasteRecords(records);
    } catch (error) {
      console.error('Error fetching waste records:', error);
      toast.error('Failed to load waste records');
    } finally {
      setLoading(false);
    }
  };

  const createWasteRecord = async (wasteData) => {
    try {
      const wasteRef = collection(db, 'waste_records');
      const newRecord = {
        ...wasteData,
        timestamp: wasteData.timestamp || new Date().toISOString(),
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(wasteRef, newRecord);
      const createdRecord = { id: docRef.id, ...newRecord };
      
      setWasteRecords(prev => [createdRecord, ...prev]);
      toast.success('Waste record created successfully');
      return createdRecord;
    } catch (error) {
      console.error('Error creating waste record:', error);
      toast.error('Failed to create waste record');
      throw error;
    }
  };

  const deleteWasteRecord = async (recordId) => {
    try {
      const recordRef = doc(db, 'waste_records', recordId);
      await deleteDoc(recordRef);
      
      setWasteRecords(prev => prev.filter(record => record.id !== recordId));
      toast.success('Waste record deleted successfully');
    } catch (error) {
      console.error('Error deleting waste record:', error);
      toast.error('Failed to delete waste record');
      throw error;
    }
  };

  useEffect(() => {
    fetchWasteRecords();
  }, []);

  return (
    <WasteContext.Provider
      value={{
        wasteRecords,
        loading,
        createWasteRecord,
        deleteWasteRecord,
        fetchWasteRecords,
      }}
    >
      {children}
    </WasteContext.Provider>
  );
}
