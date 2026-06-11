import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { authService } from '../services/api/authService';
import { PageLoader } from '../components/ui/Loader';
import AppShell from '../components/layout/AppShell';

// Lazy loaded page components
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const SendMoneyPage = lazy(() => import('../pages/SendMoney/SendMoneyPage'));
const TransactionHistoryPage = lazy(() => import('../pages/TransactionHistory/TransactionHistoryPage'));
const RechargePage = lazy(() => import('../pages/Recharge/RechargePage'));
const BillsPage = lazy(() => import('../pages/Bills/BillsPage'));
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'));
const KYCPage = lazy(() => import('../pages/KYC/KYCPage'));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'));
const RewardsPage = lazy(() => import('../pages/Rewards/RewardsPage'));
const UpiPage = lazy(() => import('../pages/UPI/UpiPage'));
const AuthFlow = lazy(() => import('../features/auth/AuthFlow'));

// Guard for protected pages
function ProtectedRoute({ children }) {
  const isAuth = authService.isAuthenticated();
  return isAuth ? <AppShell>{children}</AppShell> : <Navigate to="/signup" replace />;
}

// Guard for public auth pages
function PublicRoute({ children }) {
  const isAuth = authService.isAuthenticated();
  return !isAuth ? children : <Navigate to="/dashboard" replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <AuthFlow initialMode="login" />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <AuthFlow initialMode="signup" />
            </PublicRoute>
          } 
        />

        {/* Protected Feature Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/send-money" 
          element={
            <ProtectedRoute>
              <SendMoneyPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <TransactionHistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recharge" 
          element={
            <ProtectedRoute>
              <RechargePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bills" 
          element={
            <ProtectedRoute>
              <BillsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/kyc" 
          element={
            <ProtectedRoute>
              <KYCPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rewards" 
          element={
            <ProtectedRoute>
              <RewardsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upi" 
          element={
            <ProtectedRoute>
              <UpiPage />
            </ProtectedRoute>
          } 
        />

        {/* Redirect Routes */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
