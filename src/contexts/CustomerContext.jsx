import { createContext, useContext, useState, useEffect } from 'react';
import {
  getCustomers as getCustomersFromDB,
  addCustomer as addCustomerToDB,
  updateCustomer as updateCustomerInDB,
  searchCustomerByPhone
} from '../services/firestoreService';
import toast from 'react-hot-toast';

const CustomerContext = createContext({});

export const useCustomers = () => useContext(CustomerContext);

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const customersFromDB = await getCustomersFromDB();
      setCustomers(customersFromDB);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Add new customer
  const addCustomer = async (customerData) => {
    try {
      // Check if phone already exists
      const existing = await searchCustomerByPhone(customerData.phone);
      if (existing) {
        toast.error('Customer with this phone number already exists');
        return null;
      }

      const newCustomer = await addCustomerToDB(customerData);
      setCustomers((prev) => [newCustomer, ...prev]);
      toast.success('Customer added successfully');
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
      throw error;
    }
  };

  // Update customer
  const updateCustomer = async (customerId, customerData) => {
    try {
      await updateCustomerInDB(customerId, customerData);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, ...customerData } : c))
      );
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
      throw error;
    }
  };

  // Search customer by phone
  const findCustomerByPhone = async (phone) => {
    try {
      return await searchCustomerByPhone(phone);
    } catch (error) {
      console.error('Error searching customer:', error);
      return null;
    }
  };

  // Get customer by ID
  const getCustomerById = (customerId) => {
    return customers.find((c) => c.id === customerId);
  };

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const value = {
    customers,
    loading,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    findCustomerByPhone,
    getCustomerById,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}