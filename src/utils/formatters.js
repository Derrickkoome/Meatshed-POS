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

// Calculate price based on weight and rate per kg
export const calculateWeightPrice = (weight, pricePerKg) => {
  return weight * pricePerKg;
};

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Format date for display (short version)
export const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('en-KE', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
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