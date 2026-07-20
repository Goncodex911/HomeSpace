import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Settings from './pages/Settings';
import VendorRegister from './pages/VendorRegister';
import AdminDashboard from './pages/AdminDashboard';
import Stores from './pages/Stores';
import StoreProfile from './pages/StoreProfile';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CancelOrder from './pages/CancelOrder';
import ReturnOrder from './pages/ReturnOrder';
import OrderDetail from './pages/OrderDetail';
import MockPayment from './pages/MockPayment';
import RoomBuilder from './pages/RoomBuilder';
import Catalog from './pages/Catalog';
import ChatWidget from './components/ChatWidget';
import { Toaster } from 'react-hot-toast';

// Role-based Private Route Wrapper
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
        <p className="font-light tracking-widest uppercase">Loading Atelier...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && (!user || !allowedRoles.includes(user.role))) {
    if (user && user.vendorStatus === 'pending') {
      return <Navigate to="/vendor-register" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (Only accessible if NOT logged in)
const PublicRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
        <p className="font-light tracking-widest uppercase">Loading Atelier...</p>
      </div>
    );
  }

  if (token) {
    const localUserStr = localStorage.getItem('user');
    let currentUser = user;
    if (!currentUser && localUserStr) {
      try {
        currentUser = JSON.parse(localUserStr);
      } catch (e) { }
    }
    if (currentUser && currentUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
      <CartProvider>
      <Toaster position="top-center" toastOptions={{
        style: {
          borderRadius: '0',
          background: '#faf9f5',
          color: '#1a1c1a',
          border: '1px solid #c4c7c7',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          padding: '16px',
        },
      }} />
      <Router>
        <div className="flex flex-col min-h-screen">
          <Routes>
            {/* Public Customer Homepage */}
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />

            {/* Public Store Pages */}
            <Route path="/stores" element={<Stores />} />
            <Route path="/stores/:id" element={<StoreProfile />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            {/* Public Authentication Pages */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />
            <Route
              path="/verify-otp"
              element={
                <PublicRoute>
                  <VerifyOtp />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Protected Store Management Dashboard (Only for store/admin roles) */}
            <Route
              path="/store"
              element={
                <PrivateRoute allowedRoles={['store', 'admin']}>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Protected Admin Dashboard Console */}
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            {/* Protected Account Settings Page */}
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <Checkout />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <PrivateRoute>
                  <OrderDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:id/cancel"
              element={
                <PrivateRoute>
                  <CancelOrder />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:id/return"
              element={
                <PrivateRoute>
                  <ReturnOrder />
                </PrivateRoute>
              }
            />
            <Route
              path="/mock-payment"
              element={
                <PrivateRoute>
                  <MockPayment />
                </PrivateRoute>
              }
            />

            {/* 3D Room Builder Page */}
            <Route path="/room-builder" element={<RoomBuilder />} />

            {/* Vendor Registration Page */}
            <Route path="/vendor-register" element={<VendorRegister />} />

            {/* Fallback Redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatWidget />
        </div>
      </Router>
      </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
