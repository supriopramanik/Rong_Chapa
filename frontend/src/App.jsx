import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/common/MainLayout.jsx';
import { HomePage } from './pages/Home.jsx';
import { ShopPage } from './pages/Shop.jsx';
import { PrintRequestPage } from './pages/PrintRequest.jsx';
import { AboutPage } from './pages/About.jsx';
import { LoginPage } from './pages/Login.jsx';
import { RegisterPage } from './pages/Register.jsx';
import { UserDashboardPage } from './pages/Dashboard.jsx';
import { AdminLayout } from './components/admin/AdminLayout.jsx';
import { AdminDashboardPage } from './pages/admin/Dashboard.jsx';
import { AdminPrintOrdersPage } from './pages/admin/PrintOrders.jsx';
import { AdminShopManagerPage } from './pages/admin/ShopManager.jsx';
import { AdminShopOrdersPage } from './pages/admin/ShopOrders.jsx';
import { AdminLoginPage } from './pages/admin/Login.jsx';
import { TermsPage } from './pages/Terms.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AdminRoute } from './components/admin/AdminRoute.jsx';
import { CustomerRoute } from './components/common/CustomerRoute.jsx';
import './styles/admin.css';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/print" element={<PrintRequestPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <CustomerRoute>
                <UserDashboardPage />
              </CustomerRoute>
            }
          />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="print-orders" element={<AdminPrintOrdersPage />} />
          <Route path="shop-orders" element={<AdminShopOrdersPage />} />
          <Route path="shop" element={<AdminShopManagerPage />} />
        </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
