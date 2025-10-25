import { Link, useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from "../../contexts/AuthContext";
import toast from 'react-hot-toast';

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="bg-meat text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingCart size={28} />
            <span className="text-xl font-bold">MeatShed POS</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            {currentUser && (
              <>
                <Link to="/pos" className="hover:text-meat-light transition">POS</Link>
                <Link to="/inventory" className="hover:text-meat-light transition">Inventory</Link>
                <Link to="/orders" className="hover:text-meat-light transition">Orders</Link>
                <Link to="/dashboard" className="hover:text-meat-light transition">Dashboard</Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <span className="hidden md:block text-sm truncate max-w-[150px]">
                  {currentUser.email}
                </span>
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
  );
}