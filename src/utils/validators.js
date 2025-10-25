// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Kenyan format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+254|0)[17]\d{8}$/;
  return phoneRegex.test(phone);
};

// Validate price
export const isValidPrice = (price) => {
  return !isNaN(price) && price > 0;
};

// Validate weight
export const isValidWeight = (weight) => {
  return !isNaN(weight) && weight > 0;
};

// Validate stock quantity
export const isValidStock = (stock) => {
  return Number.isInteger(stock) && stock >= 0;
};

// Check if product is in stock
export const isInStock = (product, requestedQuantity = 1) => {
  return product.stock >= requestedQuantity;
};

// Validate product data
export const validateProduct = (product) => {
  const errors = [];

  if (!product.title || product.title.trim() === '') {
    errors.push('Product name is required');
  }

  if (!isValidPrice(product.price)) {
    errors.push('Valid price is required');
  }

  if (!isValidStock(product.stock)) {
    errors.push('Valid stock quantity is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};