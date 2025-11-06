import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export const fixOrderQuantities = async () => {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    let fixedCount = 0;
    
    for (const orderDoc of snapshot.docs) {
      const order = orderDoc.data();
      
      if (order.items && Array.isArray(order.items)) {
        // Fix each item's quantity to be a number
        const fixedItems = order.items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity, 10) || 0,
          price: parseFloat(item.price) || 0
        }));
        
        // Update the order in Firestore
        await updateDoc(doc(db, 'orders', orderDoc.id), {
          items: fixedItems,
          subtotal: parseFloat(order.subtotal) || 0,
          tax: parseFloat(order.tax) || 0,
          total: parseFloat(order.total) || 0
        });
        
        fixedCount++;
        console.log(`Fixed order ${orderDoc.id}`);
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} orders`);
    alert(`Successfully fixed ${fixedCount} orders!`);
  } catch (error) {
    console.error('Error fixing orders:', error);
    alert('Error fixing orders. Check console for details.');
  }
};