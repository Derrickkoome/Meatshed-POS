import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/serviceWorkerRegistration'
import { AuthProvider } from './contexts/AuthContext'
import { ProductProvider } from './contexts/ProductContext'
import { CartProvider } from './contexts/CartContext'
import { OrderProvider } from './contexts/OrderContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { OnlineOrderProvider } from './contexts/OnlineOrderContext' // ADD THIS LINE

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <OrderProvider>
            <CustomerProvider>
              <OnlineOrderProvider> {/* ADD THIS WRAPPER */}
                <App />
              </OnlineOrderProvider> {/* ADD THIS CLOSING TAG */}
            </CustomerProvider>
          </OrderProvider>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  </StrictMode>,
)

// Register service worker for offline support
registerServiceWorker();