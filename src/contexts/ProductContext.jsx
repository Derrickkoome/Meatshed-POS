import { createContext, useContext, useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import { meatProducts } from '../data/meatProducts';
import toast from 'react-hot-toast';

const ProductContext = createContext({});

export const useProducts = () => useContext(ProductContext);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all products
  const fetchProducts = async (limit = 30) => {
    try {
      setLoading(true);
      setError(null);
      // Use meat products instead of API
      setProducts(meatProducts);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Search products
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setProducts(meatProducts);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const filtered = meatProducts.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      setProducts(filtered);
      setSearchQuery(query);
    } catch (err) {
      setError(err.message);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Get single product
  const getProductById = async (id) => {
    try {
      const product = meatProducts.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return product;
    } catch (err) {
      toast.error('Failed to load product');
      throw err;
    }
  };

  // Add product
  const addProduct = async (productData) => {
    try {
      const newProduct = {
        ...productData,
        id: Date.now(), // Generate unique ID
      };
      setProducts((prev) => [newProduct, ...prev]);
      toast.success('Product added successfully');
      return newProduct;
    } catch (err) {
      toast.error('Failed to add product');
      throw err;
    }
  };

  // Update product
  const updateProduct = async (id, productData) => {
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...productData } : p))
      );
      toast.success('Product updated successfully');
      return productData;
    } catch (err) {
      toast.error('Failed to update product');
      throw err;
    }
  };

  // Delete product
  const deleteProduct = async (id) => {
    try {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted successfully');
    } catch (err) {
      toast.error('Failed to delete product');
      throw err;
    }
  };

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const value = {
    products,
    loading,
    error,
    searchQuery,
    fetchProducts,
    searchProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}