import { useProducts } from '../contexts/ProductContext';
import { formatPrice } from '../utils/formatters';
import { Package, Search, Loader, Plus, Trash2, Edit, Image as ImageIcon, Download, Barcode, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { exportInventoryToPDF, exportInventoryToExcel } from '../utils/exportUtils';
import BarcodeComponent from 'react-barcode';
import { migrateExistingProducts } from '../services/firestoreService';

export default function InventoryPage() {
  const { products, loading, searchProducts, fetchProducts, addProduct, deleteProduct, updateProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [migrating, setMigrating] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    } else {
      fetchProducts();
    }
  };

  const handleMigrateProducts = async () => {
    if (!window.confirm('This will add unique product codes to all existing products that don\'t have them. Continue?')) {
      return;
    }

    try {
      setMigrating(true);
      const result = await migrateExistingProducts();
      toast.success(result.message);
      // Refresh products to show the new codes
      await fetchProducts();
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Failed to migrate products. Please try again.');
    } finally {
      setMigrating(false);
    }
  };

  const meatCategories = {
    all: { name: 'All Products', icon: '🥩', color: 'bg-gray-100 text-gray-800' },
    beef: { name: 'Beef', icon: '🐄', color: 'bg-red-100 text-red-800' },
    goat: { name: 'Goat', icon: '🐐', color: 'bg-orange-100 text-orange-800' },
    lamb: { name: 'Lamb/Mutton', icon: '🐑', color: 'bg-pink-100 text-pink-800' },
    chicken: { name: 'Chicken', icon: '🐔', color: 'bg-yellow-100 text-yellow-800' },
    pork: { name: 'Pork', icon: '🐷', color: 'bg-rose-100 text-rose-800' },
    processed: { name: 'Processed', icon: '🌭', color: 'bg-purple-100 text-purple-800' },
  };

  const displayProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

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
        <div>
          <h1 className="text-3xl font-bold">Meat Inventory</h1>
          <p className="text-gray-600 mt-1">Manage your meat products and stock levels</p>
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          {/* Migration Button - Prominent */}
          <button
            onClick={() => { console.log('Migrate button clicked'); handleMigrateProducts(); }}
            disabled={false} // Temporarily enable for testing
            className="bg-red-500 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg text-lg"
          >
            <RotateCcw size={24} className={migrating ? 'animate-spin' : ''} />
            {migrating ? '🔄 Migrating...' : '🚀 MIGRATE CODES NOW'}
          </button>
          
          {/* Other buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportInventoryToPDF(products)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              PDF
            </button>
            <button
              onClick={() => exportInventoryToExcel(products)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Excel
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Meat Product
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {Object.entries(meatCategories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedCategory === key
                ? cat.color + ' ring-2 ring-meat'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
            <span className="ml-2 text-sm">
              ({key === 'all' ? products.length : products.filter(p => p.category === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meat products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
          />
        </div>
      </form>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            onDelete={deleteProduct}
            onEdit={setEditingProduct}
            categoryColor={meatCategories[product.category]?.color}
          />
        ))}
      </div>

      {displayProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg">
            {selectedCategory === 'all' 
              ? 'No products found' 
              : `No ${meatCategories[selectedCategory].name} products found`}
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary mt-4"
          >
            Add Product
          </button>
        </div>
      )}

      {showAddModal && (
        <ProductModal 
          onClose={() => setShowAddModal(false)}
          onSave={addProduct}
          title="Add New Meat Product"
        />
      )}

      {editingProduct && (
        <ProductModal 
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(data) => updateProduct(editingProduct.id, data)}
          title="Edit Meat Product"
        />
      )}
    </div>
  );
}

function ProductCard({ product, onDelete, onEdit, categoryColor }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.title}"?`)) return;
    
    try {
      setDeleting(true);
      await onDelete(product.id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card hover:shadow-xl transition-shadow">
      <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden relative group">
        <img
          src={product.thumbnail || 'https://picsum.photos/300?random'}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
          <button 
            onClick={() => onEdit(product)}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg"
          >
            <ImageIcon size={20} className="text-meat" />
          </button>
        </div>
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold ${categoryColor}`}>
          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </div>
      </div>
      
      <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.title}</h3>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-meat">
          {formatPrice(product.price)}
        </span>
        <span className={`px-2 py-1 rounded text-sm font-semibold ${
          product.stock > 10 
            ? 'bg-green-100 text-green-800' 
            : product.stock > 0
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {product.stock} {product.stock === 1 ? 'item' : 'items'}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {product.description || 'Fresh quality meat'}
      </p>

      {product.productCode && (
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Code:</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {product.productCode}
            </span>
          </div>
        </div>
      )}

      {product.barcode && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Barcode size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">Barcode: {product.barcode}</span>
          </div>
          <div className="flex justify-center">
            <BarcodeComponent 
              value={product.barcode} 
              width={1.5} 
              height={40} 
              fontSize={12}
              margin={0}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={() => onEdit(product)}
          className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1"
        >
          <Edit size={16} />
          Edit
        </button>
        <button 
          onClick={handleDelete}
          disabled={deleting}
          className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1 hover:bg-red-100 hover:text-red-700"
        >
          <Trash2 size={16} />
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSave, title }) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    price: product?.price || '',
    stock: product?.stock || '',
    description: product?.description || '',
    thumbnail: product?.thumbnail || '',
    category: product?.category || 'beef',
    barcode: product?.barcode || '',
  });
  const [loading, setLoading] = useState(false);

  const meatCategories = {
    beef: {
      name: 'Beef',
      icon: '🐄',
      products: ['Beef Steak', 'Beef Ribs', 'Ground Beef', 'Beef Liver', 'T-Bone Steak', 'Sirloin', 'Brisket']
    },
    goat: {
      name: 'Goat',
      icon: '🐐',
      products: ['Goat Meat', 'Goat Ribs', 'Goat Liver', 'Goat Leg']
    },
    lamb: {
      name: 'Lamb/Mutton',
      icon: '🐑',
      products: ['Lamb Chops', 'Mutton', 'Lamb Leg', 'Lamb Shoulder']
    },
    chicken: {
      name: 'Chicken',
      icon: '🐔',
      products: ['Whole Chicken', 'Chicken Breast', 'Chicken Wings', 'Chicken Thighs', 'Chicken Drumsticks']
    },
    pork: {
      name: 'Pork',
      icon: '🐷',
      products: ['Pork Chops', 'Bacon', 'Pork Ribs', 'Pork Belly', 'Ham']
    },
    processed: {
      name: 'Processed Meats',
      icon: '🌭',
      products: ['Sausages', 'Salami', 'Hot Dogs', 'Minced Meat', 'Burgers']
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || formData.stock === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        title: formData.title,
        price: parseFloat(formData.price),
        stock: parseFloat(formData.stock),
        description: formData.description,
        thumbnail: formData.thumbnail,
        category: formData.category,
        barcode: formData.barcode,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card max-w-lg w-full my-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Meat Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(meatCategories).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: key })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.category === key
                      ? 'border-meat bg-meat-light'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-semibold">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              placeholder={`e.g., ${meatCategories[formData.category].products[0]}`}
              list="meat-suggestions"
            />
            <datalist id="meat-suggestions">
              {meatCategories[formData.category].products.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">
              Popular {meatCategories[formData.category].name} products: {meatCategories[formData.category].products.slice(0, 3).join(', ')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            {formData.thumbnail && (
              <div className="mt-2">
                <img 
                  src={formData.thumbnail} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/300?random';
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Paste an image URL or leave blank for default
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Price per Item (KES) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
                placeholder="100 or 2.5"
              />
              <p className="text-xs text-gray-500 mt-1">Quantity in stock (decimals allowed, e.g., 2.5 kg)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              rows="3"
              placeholder="Fresh, premium quality meat..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product Code
            </label>
            <input
              type="text"
              value={product?.productCode || 'Will be generated automatically'}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              placeholder="Auto-generated unique code"
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique product identifier (auto-generated)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Barcode
            </label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meat focus:border-transparent"
              placeholder="Scan or enter barcode (e.g., 123456789012)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add a barcode for quick scanning at POS (defaults to product code)
            </p>
          </div>

          {product && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Update stock quantity when receiving new deliveries or after sales reconciliation.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
