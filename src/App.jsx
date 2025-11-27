import ProfitLossPage from './pages/ProfitLossPage';
                              <Route 
                                path="/profit-loss" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <ProfitLossPage />
                                  </RoleGuard>
                                } 
                              />
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProductProvider } from './contexts/ProductContext';
import { OrderProvider } from './contexts/OrderContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { OnlineOrderProvider } from './contexts/OnlineOrderContext';
import { DebtProvider } from './contexts/DebtContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { WasteProvider } from './contexts/WasteContext';
import { StockAdjustmentProvider } from './contexts/StockAdjustmentContext';
import { ReconciliationProvider } from './contexts/ReconciliationContext';
import { OfflineProvider } from './contexts/OfflineContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import OfflineIndicator from './components/OfflineIndicator';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OnlineOrdersPage from './pages/OnlineOrdersPage';
import ManualOrderPage from './pages/ManualOrderPage';
import DebtsPage from './pages/DebtsPage';
import CustomersPage from './pages/CustomersPage';
import ExpensesPage from './pages/ExpensesPage';
import WasteManagementPage from './pages/WasteManagementPage';
import StockAdjustmentPage from './pages/StockAdjustmentPage';
import ReconciliationPage from './pages/ReconciliationPage';

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CustomerProvider>
          <OrderProvider>
            <OnlineOrderProvider>
              <DebtProvider>
                <ExpenseProvider>
                  <WasteProvider>
                    <StockAdjustmentProvider>
                      <ReconciliationProvider>
                        <OfflineProvider>
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
                              <Route 
                                path="/dashboard" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <DashboardPage />
                                  </RoleGuard>
                                } 
                              />
                              <Route path="/pos" element={<POSPage />} />
                              <Route 
                                path="/inventory" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <InventoryPage />
                                  </RoleGuard>
                                } 
                              />
                              <Route path="/orders" element={<OrderHistoryPage />} />
                              <Route path="/online-orders" element={<OnlineOrdersPage />} />
                              <Route path="/debts" element={<DebtsPage />} />
                              <Route path="/customers" element={<CustomersPage />} />
                              <Route 
                                path="/expenses" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <ExpensesPage />
                                  </RoleGuard>
                                } 
                              />
                              <Route 
                                path="/waste" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <WasteManagementPage />
                                  </RoleGuard>
                                } 
                              />
                              <Route 
                                path="/stock-adjustments" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <StockAdjustmentPage />
                                  </RoleGuard>
                                } 
                              />
                              <Route 
                                path="/reconciliation" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <ReconciliationPage />
                                  </RoleGuard>
                                } 
                              />
                              <Route 
                                path="/manual-order" 
                                element={
                                  <RoleGuard requireAdmin={true}>
                                    <ManualOrderPage />
                                  </RoleGuard>
                                } 
                              />
                            </Routes>
                          </div>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
                            <OfflineIndicator />
                          </Router>
                        </OfflineProvider>
                      </ReconciliationProvider>
                    </StockAdjustmentProvider>
                  </WasteProvider>
                </ExpenseProvider>
              </DebtProvider>
            </OnlineOrderProvider>
          </OrderProvider>
        </CustomerProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;