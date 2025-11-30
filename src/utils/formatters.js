// Format price to Kenyan Shillings
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

// Format weight (kg or g)
export const formatWeight = (weight, unit = 'kg') => {
  if (unit === 'kg') {
    return `${weight.toFixed(2)} kg`;
  }
  return `${weight.toFixed(0)} g`;
};

// Convert grams to kilograms
export const gramsToKg = (grams) => {
  return grams / 1000;
};

// Convert kilograms to grams
export const kgToGrams = (kg) => {
  return kg * 1000;
};

// Calculate price based on weight and rate per kg with rounding to nearest 10
export const calculateWeightPrice = (weight, pricePerKg) => {
  const exactPrice = weight * pricePerKg;
  // Round to nearest 10
  return Math.round(exactPrice / 10) * 10;
};

// Format date
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    // Handle Firestore Timestamp
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

// Format date for display (short version)
export const formatDateShort = (date) => {
  if (!date) return 'N/A';
  
  try {
    // Handle Firestore Timestamp
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-KE', {
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

// Calculate cart total
export const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Calculate discount amount
export const calculateDiscount = (price, discountPercent) => {
  return price * (discountPercent / 100);
};

// Calculate price after discount
export const calculateDiscountedPrice = (price, discountPercent) => {
  return price - calculateDiscount(price, discountPercent);
};