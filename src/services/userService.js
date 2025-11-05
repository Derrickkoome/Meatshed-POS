import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// User roles
export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
};

// Create user profile in Firestore
export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      role: userData.role || ROLES.CASHIER, // Default to cashier
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, newRole) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Check if user is admin
export const isAdmin = (userProfile) => {
  return userProfile?.role === ROLES.ADMIN;
};

// Check if user is cashier
export const isCashier = (userProfile) => {
  return userProfile?.role === ROLES.CASHIER;
};