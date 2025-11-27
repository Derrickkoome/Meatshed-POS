import { createContext, useContext, useState, useEffect } from 'react';
import {
  getCustomers as getCustomersFromDB,
  addCustomer as addCustomerToDB,
  updateCustomer as updateCustomerInDB,
  deleteCustomer as deleteCustomerFromDB,
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

  // Delete customer
  const deleteCustomer = async (customerId) => {
    try {
      await deleteCustomerFromDB(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
      throw error;
    }
  };

  // Get customer by ID
  const getCustomerById = (customerId) => {
    return customers.find((c) => c.id === customerId);
  };

  // Add loyalty points to customer
  const addLoyaltyPoints = async (customerId, points, orderTotal, reason = 'Purchase') => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const currentPoints = customer.loyaltyPoints || 0;
      const newPoints = currentPoints + points;
      const totalSpent = (customer.totalSpent || 0) + orderTotal;
      const purchaseCount = (customer.purchaseCount || 0) + 1;

      await updateCustomerInDB(customerId, {
        loyaltyPoints: newPoints,
        totalSpent,
        purchaseCount,
        lastPurchaseDate: new Date().toISOString()
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, loyaltyPoints: newPoints, totalSpent, purchaseCount, lastPurchaseDate: new Date().toISOString() }
            : c
        )
      );

      return newPoints;
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      throw error;
    }
  };

  // Redeem loyalty points
  const redeemLoyaltyPoints = async (customerId, pointsToRedeem) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const currentPoints = customer.loyaltyPoints || 0;
      if (currentPoints < pointsToRedeem) {
        throw new Error('Insufficient loyalty points');
      }

      const newPoints = currentPoints - pointsToRedeem;

      await updateCustomerInDB(customerId, {
        loyaltyPoints: newPoints
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, loyaltyPoints: newPoints } : c
        )
      );

      toast.success(`Redeemed ${pointsToRedeem} points successfully`);
      return newPoints;
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      toast.error(error.message || 'Failed to redeem points');
      throw error;
    }
  };

  // Get loyalty tier based on total spent
  const getLoyaltyTier = (totalSpent = 0) => {
    if (totalSpent >= 100000) return { name: 'Platinum', discount: 10, color: 'purple' };
    if (totalSpent >= 50000) return { name: 'Gold', discount: 7, color: 'yellow' };
    if (totalSpent >= 20000) return { name: 'Silver', discount: 5, color: 'gray' };
    return { name: 'Bronze', discount: 2, color: 'orange' };
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
    deleteCustomer,
    findCustomerByPhone,
    getCustomerById,
    addLoyaltyPoints,
    redeemLoyaltyPoints,
    getLoyaltyTier,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}