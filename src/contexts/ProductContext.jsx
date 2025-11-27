import { createContext, useContext, useState, useEffect } from 'react';
import {
  getProducts,
  createProduct as createProductInDB,
  updateProduct as updateProductInDB,
  deleteProduct as deleteProductFromDB,
  seedProducts,
} from '../services/firestoreService';
import { meatProducts } from '../data/meatProducts';
import { offlineStorage } from '../utils/offlineStorage';
import toast from 'react-hot-toast';

const ProductContext = createContext({});

export const useProducts = () => useContext(ProductContext);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from Firestore
      const productsFromDB = await getProducts();

      // If no products in DB, seed with initial data
      if (productsFromDB.length === 0) {
        console.log('No products found, seeding initial data...');
        await seedProducts(meatProducts);
        const seededProducts = await getProducts();
        setProducts(seededProducts);
        // Cache for offline use
        await offlineStorage.cacheProducts(seededProducts);
      } else {
        setProducts(productsFromDB);
        // Cache for offline use
        await offlineStorage.cacheProducts(productsFromDB);
      }
    } catch (err) {
      setError(err.message);
      console.log('Failed to load products from server, trying cache...');
      
      // Try to load from cache if offline
      try {
        const cachedProducts = await offlineStorage.getCachedProducts();
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
          toast.success('Loaded products from offline cache', { icon: '📦' });
        } else {
          toast.error('No products available offline');
        }
      } catch (cacheErr) {
        toast.error('Failed to load products');
        console.error(cacheErr);
      }
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
      const allProducts = await getProducts();
      const filtered = allProducts.filter((product) =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.category?.toLowerCase().includes(query.toLowerCase())
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
      const product = products.find((p) => p.id === id);
      return product;
    } catch (err) {
      toast.error('Failed to load product');
      throw err;
    }
  };

  // Add product to Firestore
  const addProduct = async (productData) => {
    try {
      const newProduct = await createProductInDB(productData);
      setProducts((prev) => [newProduct, ...prev]);
      toast.success('Product added successfully');
      return newProduct;
    } catch (err) {
      toast.error('Failed to add product');
      throw err;
    }
  };

  // Update product in Firestore
  const updateProduct = async (id, productData) => {
    try {
      await updateProductInDB(id, productData);
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

  // Delete product from Firestore
  const deleteProduct = async (id) => {
    try {
      await deleteProductFromDB(id);
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