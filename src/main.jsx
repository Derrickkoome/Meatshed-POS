import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { ProductProvider } from './contexts/ProductContext'
import { CartProvider } from './contexts/CartContext'
import { OrderProvider } from './contexts/OrderContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <OrderProvider>
            <App />
          </OrderProvider>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  </StrictMode>,
)