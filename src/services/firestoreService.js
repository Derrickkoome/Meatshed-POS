import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// ============ PRODUCTS ============

// Get all products
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get single product
export const getProduct = async (productId) => {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Add product
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (productId, productData) => {
  try {
    const docRef = doc(db, 'products', String(productId));
    
    // Remove any fields that shouldn't be in Firestore
    const { id, ...updateData } = productData;
    
    // Clean the data - remove undefined values
    const cleanData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        cleanData[key] = updateData[key];
      }
    });
    
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: new Date().toISOString(),
    });
    
    return { id: productId, ...cleanData };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// ============ ORDERS ============

// Get all orders
export const getOrders = async () => {
  try {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

// Get single order
export const getOrder = async (orderId) => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Create order
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      timestamp: new Date().toISOString(),
    });
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// ============ CUSTOMERS ============

// Get all customers
export const getCustomers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

// Get single customer
export const getCustomer = async (customerId) => {
  try {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting customer:', error);
    throw error;
  }
};

// Add customer
export const addCustomer = async (customerData) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...customerData, totalPurchases: 0, createdAt: new Date().toISOString() };
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Update customer
export const updateCustomer = async (customerId, customerData) => {
  try {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Search customers by phone
export const searchCustomerByPhone = async (phone) => {
  try {
    const q = query(collection(db, 'customers'), where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error searching customer:', error);
    throw error;
  }
};

// ============ SEED DATA ============

/// Seed initial products (run once)
export const seedProducts = async (products) => {
  try {
    const batch = products.map(product => {
      // Remove the numeric id and let Firestore generate one
      const { id, ...productData } = product;
      return addDoc(collection(db, 'products'), productData);
    });
    await Promise.all(batch);
    console.log('Products seeded successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
};