import { Link } from 'react-router-dom';
import { Menu, ShoppingCart, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-meat text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingCart size={28} />
            <span className="text-xl font-bold">MeatShed POS</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link to="/pos" className="hover:text-meat-light transition">POS</Link>
            <Link to="/inventory" className="hover:text-meat-light transition">Inventory</Link>
            <Link to="/orders" className="hover:text-meat-light transition">Orders</Link>
            <Link to="/dashboard" className="hover:text-meat-light transition">Dashboard</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-meat-light transition">
              <User size={24} />
            </Link>
            <button className="md:hidden">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}