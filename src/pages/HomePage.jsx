import { Link } from 'react-router-dom';
import { ShoppingCart, Package, TrendingUp, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          MeatShed POS
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Modern Point of Sale system for Kenyan butcheries
        </p>
        <Link to="/pos" className="btn-primary text-lg px-8 py-3 inline-block">
          Start Selling
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <FeatureCard 
          icon={<ShoppingCart size={40} />}
          title="Quick Sales"
          description="Fast and intuitive POS interface for rapid transactions"
        />
        <FeatureCard 
          icon={<Package size={40} />}
          title="Inventory Management"
          description="Real-time stock tracking and low-stock alerts"
        />
        <FeatureCard 
          icon={<TrendingUp size={40} />}
          title="Sales Analytics"
          description="Track performance with detailed reports"
        />
        <FeatureCard 
          icon={<Users size={40} />}
          title="Multi-User Support"
          description="Role-based access for admins and attendants"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card text-center hover:shadow-xl transition-shadow">
      <div className="text-meat mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}