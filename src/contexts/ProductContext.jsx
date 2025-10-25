import { createContext, useContext, useState, useEffect } from 'react';
import { productAPI } from '../services/api';
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
      const data = await productAPI.getAll(limit);
      setProducts(data.products || []);
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
      fetchProducts();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await productAPI.search(query);
      setProducts(data.products || []);
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
      const product = await productAPI.getById(id);
      return product;
    } catch (err) {
      toast.error('Failed to load product');
      throw err;
    }
  };

  // Add product (simulated)
  const addProduct = async (productData) => {
    try {
      const newProduct = await productAPI.add(productData);
      setProducts((prev) => [newProduct, ...prev]);
      toast.success('Product added successfully');
      return newProduct;
    } catch (err) {
      toast.error('Failed to add product');
      throw err;
    }
  };

  // Update product (simulated)
  const updateProduct = async (id, productData) => {
    try {
      const updated = await productAPI.update(id, productData);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      toast.success('Product updated successfully');
      return updated;
    } catch (err) {
      toast.error('Failed to update product');
      throw err;
    }
  };

  // Delete product (simulated)
  const deleteProduct = async (id) => {
    try {
      await productAPI.delete(id);
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