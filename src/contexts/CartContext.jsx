import { createContext, useContext, useState, useEffect } from 'react';
import { calculateCartTotal } from '../utils/formatters';
import toast from 'react-hot-toast';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Add item to cart
  const addToCart = (product, quantity = 1, weight = null) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      // Update quantity if item already exists
      updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      // Add new item
      const newItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: quantity,
        weight: weight, // For weight-based products
        image: product.thumbnail || product.images?.[0],
        stock: product.stock,
      };
      setCartItems((prev) => [...prev, newItem]);
      toast.success(`${product.title} added to cart`);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    toast.success('Item removed from cart');
  };

  // Update item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          // Check stock availability
          if (newQuantity > item.stock) {
            toast.error('Not enough stock available');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Update item weight (for weight-based products)
  const updateWeight = (productId, newWeight) => {
    if (newWeight <= 0) {
      toast.error('Weight must be greater than 0');
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, weight: newWeight } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  // Calculate totals
  const getCartTotal = () => {
    return calculateCartTotal(cartItems);
  };

  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.length;
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems,
    paymentMethod,
    setPaymentMethod,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateWeight,
    clearCart,
    getCartTotal,
    getItemCount,
    getTotalItems,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}