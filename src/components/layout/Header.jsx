import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ShoppingCart, Package, FileText, Truck, LogOut, ShoppingBag, User, Shield, Calendar, CreditCard, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin } from '../../services/userService';
import toast from 'react-hot-toast';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: true },
    { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
    { to: '/inventory', icon: Package, label: 'Inventory', adminOnly: true },
    { to: '/orders', icon: FileText, label: 'Order History' },
    { to: '/online-orders', icon: Truck, label: 'Online Orders' },
    { to: '/debts', icon: CreditCard, label: 'Debts & Credit' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/manual-order', icon: Calendar, label: 'Manual Order Entry', adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin(userProfile)) {
      return false;
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MeatShed Logo" className="h-10 w-10 object-contain" />
            <h1 className="text-xl font-bold text-meat">MeatShed POS</h1>
          </div>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 top-[57px]"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Dropdown */}
      <div
        className={`lg:hidden fixed left-0 right-0 bg-white border-b border-gray-200 z-40 shadow-lg transition-all duration-300 ease-in-out top-[57px] ${
          isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <nav className="px-4 py-2">
          {currentUser && (
            <div className="px-4 py-3 mb-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 truncate">{currentUser.email}</p>
            </div>
          )}
          
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-meat text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop Header - Only visible on larger screens */}
      <header className="hidden lg:block bg-meat text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="MeatShed Logo" className="h-12 w-12 object-contain bg-white rounded-lg p-1" />
              <span className="text-xl font-bold">MeatShed POS</span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              {currentUser && (
                <>
                  {isAdmin(userProfile) && (
                    <Link to="/dashboard" className="hover:text-meat-light transition">Dashboard</Link>
                  )}
                  <Link to="/pos" className="hover:text-meat-light transition">POS</Link>
                  {isAdmin(userProfile) && (
                    <>
                      <Link to="/inventory" className="hover:text-meat-light transition">Inventory</Link>
                      <Link to="/manual-order" className="hover:text-meat-light transition">Manual Entry</Link>
                    </>
                  )}
                  <Link to="/orders" className="hover:text-meat-light transition">Orders</Link>
                  <Link to="/online-orders" className="hover:text-meat-light transition">Online Orders</Link>
                  <Link to="/debts" className="hover:text-meat-light transition">Debts</Link>
                  <Link to="/customers" className="hover:text-meat-light transition">Customers</Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-sm truncate max-w-[150px]">
                      {currentUser.email}
                    </span>
                    {isAdmin(userProfile) && (
                      <span className="px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded flex items-center gap-1">
                        <Shield size={12} />
                        ADMIN
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="hover:text-meat-light transition flex items-center gap-2"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="hover:text-meat-light transition">
                  <User size={24} />
                </Link>
              )}
              <button className="md:hidden">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}