import React from 'react';

function ProductCard({ product }) {
  const src = product?.imageUrl;
  const cost = parseFloat(product.costPrice) || 0;
  const price = parseFloat(product.price) || 0;
  const marginValue = price - cost;
  const marginPercent = price > 0 ? ((marginValue / price) * 100) : 0;
  const marginColor = marginPercent < 10 ? 'text-red-600' : marginPercent < 25 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="product-card">
      <img
        src={src}
        alt={product.name || 'product'}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/assets/image-fallback.png';
        }}
      />
      <div className="product-info">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-lg">{product.name}</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${marginColor} bg-gray-100 dark:bg-gray-800`} title="Profit Margin">
            {marginPercent.toFixed(1)}% margin
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          Cost: <span className="font-semibold">{cost.toLocaleString()}</span> | Price: <span className="font-semibold">{price.toLocaleString()}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Profit per unit: <span className="font-semibold">{marginValue.toLocaleString()}</span>
        </div>
        {/* ...other product info... */}
      </div>
    </div>
  );
}

export default ProductCard;