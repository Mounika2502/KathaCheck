import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

import Dashboard from './pages/Dashboard';
import TodayRoute from './pages/TodayRoute';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import Collections from './pages/Collections';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Partners from './pages/Partners';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading KathaCheck...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/today-route" element={<TodayRoute />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Business App Routes */}
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
