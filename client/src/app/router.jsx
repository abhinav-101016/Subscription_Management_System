import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Skeleton } from '../components/ui/Skeleton';

// Lazy-loaded routes for code splitting
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const VerifyOtpPage = lazy(() => import('../pages/auth/VerifyOtpPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const SubscriptionsPage = lazy(() => import('../pages/subscriptions/SubscriptionsPage'));
const SubscriptionDetailPage = lazy(() => import('../pages/subscriptions/SubscriptionDetailPage'));
const InvoicesPage = lazy(() => import('../pages/invoices/InvoicesPage'));
const InvoiceDetailPage = lazy(() => import('../pages/invoices/InvoiceDetailPage'));
const PaymentsPage = lazy(() => import('../pages/payments/PaymentsPage'));
const PlansPage = lazy(() => import('../pages/plans/PlansPage'));
const TemplatesPage = lazy(() => import('../pages/templates/TemplatesPage'));
const BillingConsolePage = lazy(() => import('../pages/billing/BillingConsolePage'));
const DiscountsPage = lazy(() => import('../pages/discounts/DiscountsPage'));
const TaxesPage = lazy(() => import('../pages/taxes/TaxesPage'));
const StaffPage = lazy(() => import('../pages/staff/StaffPage'));
const CustomerPortalPage = lazy(() => import('../pages/portal/CustomerPortalPage'));

function PageLoader() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Protected App Shell */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/billing-console" element={<BillingConsolePage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/taxes" element={<TaxesPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/portal" element={<CustomerPortalPage />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

