import React from 'react';

function ProductCard({ product }) {
  const src = product?.imageUrl;

  return (
    <div className="product-card">
      <img
        src={src}
        alt={product.name || 'product'}
        onError={(e) => {
          e.currentTarget.onerror = null;
          // local fallback asset or a small data URI / placeholder
          e.currentTarget.src = '/assets/image-fallback.png';
        }}
      />
      <div className="product-info">
        {/* ... */}
      </div>
    </div>
  );
}

export default ProductCard;