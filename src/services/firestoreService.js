import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const CUSTOMERS_COLLECTION = 'customers';

// Generate unique product code
export function generateProductCode() {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3-digit random number
  return `MSH${timestamp}${random}`;
}

// ============== PRODUCTS ==============

export async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getProduct(id) {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function createProduct(productData) {
  try {
    const productCode = generateProductCode();
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      productCode,
      barcode: productCode, // Use product code as default barcode
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...productData, productCode, barcode: productCode };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(id, productData) {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp()
    });
    
    return { id, ...productData };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(id) {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function searchProductByBarcode(barcode) {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), where('barcode', '==', barcode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error searching product by barcode:', error);
    throw error;
  }
}

export async function seedProducts(products) {
  try {
    const batch = writeBatch(db);
    
    products.forEach((product) => {
      const docRef = doc(collection(db, PRODUCTS_COLLECTION));
      batch.set(docRef, {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('Products seeded successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
}

export async function migrateExistingProducts() {
  try {
    console.log('Starting product code migration...');
    
    // Get all products
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const productsToUpdate = [];
    
    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      // Check if product doesn't have productCode
      if (!product.productCode) {
        productsToUpdate.push(product);
      }
    });
    
    if (productsToUpdate.length === 0) {
      console.log('All products already have product codes. Migration complete.');
      return { migrated: 0, message: 'All products already have product codes' };
    }
    
    console.log(`Found ${productsToUpdate.length} products without codes. Migrating...`);
    
    // Update products in batches
    const batch = writeBatch(db);
    let batchCount = 0;
    
    for (const product of productsToUpdate) {
      const productCode = generateProductCode();
      const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
      
      batch.update(docRef, {
        productCode,
        barcode: product.barcode || productCode, // Keep existing barcode or use product code
        updatedAt: serverTimestamp()
      });
      
      batchCount++;
      
      // Commit batch every 500 products (Firestore batch limit)
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`Migrated ${batchCount} products...`);
        batchCount = 0;
      }
    }
    
    // Commit remaining products
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Migrated remaining ${batchCount} products.`);
    }
    
    console.log(`Migration complete! Added product codes to ${productsToUpdate.length} products.`);
    return { 
      migrated: productsToUpdate.length, 
      message: `Successfully migrated ${productsToUpdate.length} products` 
    };
    
  } catch (error) {
    console.error('Error migrating products:', error);
    throw error;
  }
}

// ============== ORDERS ==============

export async function getOrders() {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function getOrder(id) {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

export async function createOrder(orderData) {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function deleteOrder(id) {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// ============== CUSTOMERS ==============

export async function getCustomers() {
  try {
    const querySnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

export async function getCustomer(id) {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
}

export async function getCustomerByPhone(phone) {
  try {
    const q = query(collection(db, CUSTOMERS_COLLECTION), where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const searchCustomerByPhone = getCustomerByPhone;

export async function createCustomer(customerData) {
  try {
    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...customerData };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const addCustomer = createCustomer;

export async function updateCustomer(id, customerData) {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: serverTimestamp()
    });
    
    return { id, ...customerData };
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

export async function deleteCustomer(id) {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
}
