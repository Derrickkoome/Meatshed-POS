import { useProducts } from '../contexts/ProductContext';
import { formatPrice } from '../utils/formatters';
import { Package, Search, Loader } from 'lucide-react';
import { useState } from 'react';

export default function InventoryPage() {
  const { products, loading, searchProducts, fetchProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    } else {
      fetchProducts();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-meat" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <button className="btn-primary">Add Product</button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
          />
        </div>
      </form>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg">No products found</p>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="card hover:shadow-xl transition-shadow">
      <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
        <img
          src={product.thumbnail || product.images?.[0]}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.title}</h3>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-meat">
          {formatPrice(product.price)}
        </span>
        <span className={`px-2 py-1 rounded text-sm ${
          product.stock > 10 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          Stock: {product.stock}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {product.description}
      </p>

      <div className="flex gap-2">
        <button className="btn-secondary flex-1 text-sm">Edit</button>
        <button className="btn-primary flex-1 text-sm">View</button>
      </div>
    </div>
  );
}