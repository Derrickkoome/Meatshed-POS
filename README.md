# 🥩 Meatshed POS

A modern, comprehensive Point of Sale (POS) system designed specifically for meat shops and butcher stores. Built with React and Firebase, featuring inventory management, customer tracking, receipt generation, and analytics.

![Meatshed POS](https://via.placeholder.com/800x400?text=Meatshed+POS+Screenshot)

## ✨ Features

### 🎯 Core Functionality
- **Product Management**: Organize products by categories (Beef, Chicken, Goat, Lamb, Pork, Processed meats)
- **Point of Sale**: Intuitive interface for quick and efficient transactions
- **Inventory Tracking**: Real-time stock monitoring with automatic updates
- **Customer Management**: Customer database with phone number search
- **Receipt Generation**: Professional receipts with PDF export capabilities
- **Payment Processing**: Support for Cash, Card, and M-Pesa payments

### 👥 User Management
- **Authentication**: Secure Firebase Authentication
- **Role-based Access**: Admin and staff user roles
- **Protected Routes**: Admin-only sections for inventory management

### 📊 Analytics & Reporting
- **Sales Analytics**: Comprehensive sales tracking and reporting
- **Export Capabilities**: Export reports to PDF and Excel formats
- **Order History**: Complete transaction history with detailed records
- **Dashboard**: Visual sales metrics and performance indicators

### 🛒 Shopping Experience
- **Category Filtering**: Easy navigation by meat type
- **Product Search**: Quick product lookup functionality
- **Shopping Cart**: Add, update quantities, and remove items
- **Tax Calculation**: Automatic 16% VAT calculation (Kenya)
- **Stock Validation**: Prevents sales of out-of-stock items

## 🚀 Live Demo

Experience the application live at: [https://derrickkoome.github.io/Meatshed-POS](https://derrickkoome.github.io/Meatshed-POS)

## 🛠 Technology Stack

### Frontend
- **React 19**: Latest React with modern hooks and concurrent features
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Router DOM**: Client-side routing and navigation
- **Lucide React**: Beautiful, customizable icons
- **React Hot Toast**: Elegant toast notifications

### Backend & Database
- **Firebase**: Complete backend solution
  - **Firebase Auth**: User authentication and authorization
  - **Firestore**: NoSQL database for real-time data management

### Utilities & Libraries
- **Axios**: HTTP client for API requests
- **jsPDF**: PDF document generation
- **jsPDF-AutoTable**: Professional table generation for PDFs
- **XLSX**: Excel file processing and generation
- **ESLint**: Code linting and formatting

## 📁 Project Structure

```
meatshed-pos/
├── public/
│   ├── vite.svg
│   └── favicon files
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Receipt.jsx
│   │   └── RoleGuard.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── CustomerContext.jsx
│   │   ├── OnlineOrderContext.jsx
│   │   ├── OrderContext.jsx
│   │   └── ProductContext.jsx
│   ├── data/
│   │   └── meatProducts.js
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── InventoryPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── OnlineOrdersPage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   ├── POSPage.jsx
│   │   └── SignupPage.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── firebase.js
│   │   └── firestoreService.js
│   ├── utils/
│   │   ├── analytics.js
│   │   ├── exportUtils.js
│   │   └── formatters.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── eslint.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🏗 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v7 or higher) or **yarn**
- **Git** for version control

### 1. Clone the Repository
```bash
git clone https://github.com/Derrickkoome/Meatshed-POS.git
cd meatshed-pos
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory and configure your Firebase settings:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 4. Firebase Setup
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication with Email/Password provider
3. Set up Firestore Database
4. Update the environment variables with your Firebase config

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🚀 Deployment

### Deploy to GitHub Pages
```bash
# Build the application
npm run build

# Deploy to GitHub Pages
npm run deploy
```

The app will be deployed to your GitHub Pages URL.

### Other Deployment Options
This project can be deployed to any static hosting service like:
- **Netlify**
- **Vercel**
- **Firebase Hosting**

## 📖 Usage Guide

### For Shop Owners/Admins
1. **Create Admin Account**: Sign up with admin credentials during initial setup
2. **Add Products**: Use the Inventory page to add/sync products
3. **Manage Staff**: Create staff accounts with limited permissions
4. **Monitor Sales**: View dashboard for sales analytics and reports

### For Staff/Cashiers
1. **Login**: Use your staff credentials to access the POS
2. **Process Sales**: Add products to cart, search customers, complete transactions
3. **Handle Customers**: Search customers by phone number or create walk-in sales
4. **Print Receipts**: Generate and print professional receipts

### Making a Sale
1. Navigate to the POS page
2. Filter products by category or search for specific items
3. Add products to cart using quantity controls
4. Optionally search for returning customers by phone number
5. Select payment method (Cash/Card/M-Pesa)
6. Complete the sale - receipt will auto-generate

## 🛡 Security Features

- **Firebase Authentication**: Secure user authentication
- **Role-based Access Control**: Admin-only sections protected
- **Protected Routes**: Authorization checks on all sensitive pages
- **Data Validation**: Input validation on all forms
- **Secure API Calls**: Proper error handling and validation

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop Computers**: Full feature set for shop computers
- **Tablets**: Touch-optimized interface for iPad/Android tablets
- **Mobile Phones**: Limited functionality for mobile access

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Guidelines
- Follow ESLint configuration
- Use descriptive commit messages
- Maintain consistent code style
- Test your changes thoroughly

## 📝 License

This project is proprietary software. All rights reserved.

## 👨‍💻 Author

**Derrick Koome**
- GitHub: [@Derrickkoome](https://github.com/Derrickkoome)
- LinkedIn: [Derrick Koome](https://linkedin.com/in/derrick-koome)

## 🙏 Acknowledgments

- Icons provided by [Lucide React](https://lucide.dev)
- UI design inspired by modern POS systems
- Special thanks to the open-source community for amazing tools

## 📞 Support

For support or questions:
- Open an issue on GitHub
- Contact the developer directly
- Check the documentation for common solutions

---

Made with ❤️ for butcher shops and meat retailers everywhere.
