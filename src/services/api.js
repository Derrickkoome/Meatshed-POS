import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle errors globally
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', errorMessage);
    return Promise.reject(error);
  }
);

// Product API methods
export const productAPI = {
  // Get all products
  getAll: (limit = 30, skip = 0) => {
    return api.get(`/products?limit=${limit}&skip=${skip}`);
  },

  // Get single product
  getById: (id) => {
    return api.get(`/products/${id}`);
  },

  // Search products
  search: (query) => {
    return api.get(`/products/search?q=${query}`);
  },

  // Get products by category
  getByCategory: (category) => {
    return api.get(`/products/category/${category}`);
  },

  // Add product (simulated)
  add: (productData) => {
    return api.post('/products/add', productData);
  },

  // Update product (simulated)
  update: (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  // Delete product (simulated)
  delete: (id) => {
    return api.delete(`/products/${id}`);
  },
};

// Cart API methods
export const cartAPI = {
  // Get user's cart
  getUserCart: (userId) => {
    return api.get(`/carts/user/${userId}`);
  },

  // Add to cart
  add: (cartData) => {
    return api.post('/carts/add', cartData);
  },

  // Update cart
  update: (cartId, cartData) => {
    return api.put(`/carts/${cartId}`, cartData);
  },
};

export default api;