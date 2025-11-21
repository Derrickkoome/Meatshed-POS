import { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const DebtContext = createContext();

export function useDebts() {
  return useContext(DebtContext);
}

export function DebtProvider({ children }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'debts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDebts(debtsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching debts:', error);
      toast.error('Failed to load debts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createDebt = async (debtData) => {
    try {
      const docRef = await addDoc(collection(db, 'debts'), {
        ...debtData,
        createdAt: new Date().toISOString(),
        status: 'outstanding', // outstanding, partial, paid
        remainingBalance: debtData.totalAmount,
        payments: []
      });
      toast.success('Credit sale recorded');
      return docRef.id;
    } catch (error) {
      console.error('Error creating debt:', error);
      toast.error('Failed to record credit sale');
      throw error;
    }
  };

  const addPayment = async (debtId, payment) => {
    try {
      const debt = debts.find(d => d.id === debtId);
      if (!debt) throw new Error('Debt not found');

      const newPayments = [...(debt.payments || []), payment];
      const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = debt.totalAmount - totalPaid;
      const status = remainingBalance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'outstanding';

      await updateDoc(doc(db, 'debts', debtId), {
        payments: newPayments,
        remainingBalance: Math.max(0, remainingBalance),
        status,
        lastPaymentDate: payment.date
      });

      toast.success('Payment recorded');
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to record payment');
      throw error;
    }
  };

  const updateDebt = async (debtId, updates) => {
    try {
      await updateDoc(doc(db, 'debts', debtId), updates);
      toast.success('Debt updated');
    } catch (error) {
      console.error('Error updating debt:', error);
      toast.error('Failed to update debt');
      throw error;
    }
  };

  const deleteDebt = async (debtId) => {
    try {
      await deleteDoc(doc(db, 'debts', debtId));
      toast.success('Debt record deleted');
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error('Failed to delete debt');
      throw error;
    }
  };

  const getCustomerDebts = (customerPhone) => {
    return debts.filter(debt => debt.customerPhone === customerPhone);
  };

  const getTotalOutstanding = () => {
    return debts
      .filter(debt => debt.status !== 'paid')
      .reduce((sum, debt) => sum + debt.remainingBalance, 0);
  };

  const value = {
    debts,
    loading,
    createDebt,
    addPayment,
    updateDebt,
    deleteDebt,
    getCustomerDebts,
    getTotalOutstanding
  };

  return <DebtContext.Provider value={value}>{children}</DebtContext.Provider>;
}
