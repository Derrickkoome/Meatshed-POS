import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const ExpenseContext = createContext({});

export const useExpenses = () => useContext(ExpenseContext);

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch expenses from Firestore
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const expensesRef = collection(db, 'expenses');
      const q = query(expensesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Create new expense
  const createExpense = async (expenseData) => {
    try {
      const expensesRef = collection(db, 'expenses');
      const newExpense = {
        ...expenseData,
        timestamp: expenseData.timestamp || new Date().toISOString(),
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(expensesRef, newExpense);
      const createdExpense = { id: docRef.id, ...newExpense };
      
      setExpenses(prev => [createdExpense, ...prev]);
      toast.success('Expense recorded successfully');
      return createdExpense;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Failed to record expense');
      throw error;
    }
  };

  // Update expense
  const updateExpense = async (expenseId, updates) => {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === expenseId 
            ? { ...expense, ...updates } 
            : expense
        )
      );
      
      toast.success('Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
      throw error;
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId) => {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await deleteDoc(expenseRef);
      
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
      throw error;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        createExpense,
        updateExpense,
        deleteExpense,
        fetchExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}
