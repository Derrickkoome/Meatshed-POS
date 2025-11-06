import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProductProvider } from './contexts/ProductContext';
import { OrderProvider } from './contexts/OrderContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { OnlineOrderProvider } from './contexts/OnlineOrderContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OnlineOrdersPage from './pages/OnlineOrdersPage';

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CustomerProvider>
          <OrderProvider>
            <OnlineOrderProvider>
              <Router>
                <Toaster position="top-right" />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  
                  {/* Protected Routes */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen bg-gray-50">
                          <Header />
                          <div className="pt-16 lg:pt-0">
                            <Routes>
                              <Route path="/dashboard" element={<DashboardPage />} />
                              <Route path="/pos" element={<POSPage />} />
                              <Route path="/inventory" element={<InventoryPage />} />
                              <Route path="/orders" element={<OrderHistoryPage />} />
                              <Route path="/online-orders" element={<OnlineOrdersPage />} />
                            </Routes>
                          </div>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </OnlineOrderProvider>
          </OrderProvider>
        </CustomerProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;