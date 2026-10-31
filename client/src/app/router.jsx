import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Skeleton } from '../components/ui/Skeleton';
import { RequireAuth, RequireRole, GuestOnly } from '../routes/RouteGuards';
import { useAuth } from '../features/auth/AuthContext';
import { getDefaultPathForRole } from '../routes/routeConfig';

// Lazy-loaded routes for code splitting
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const VerifyOtpPage = lazy(() => import('../pages/auth/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

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
const ForbiddenPage = lazy(() => import('../pages/error/ForbiddenPage'));
const NotFoundPage = lazy(() => import('../pages/error/NotFoundPage'));

function PageLoader() {
  return (
    <div className="space-y-6 p-6 animate-pulse max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function RoleHomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={getDefaultPathForRole(role)} replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Guest-Only Authentication Routes */}
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <SignupPage />
            </GuestOnly>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <GuestOnly>
              <VerifyOtpPage />
            </GuestOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPasswordPage />
            </GuestOnly>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestOnly>
              <ResetPasswordPage />
            </GuestOnly>
          }
        />

        {/* Protected App Workspace (/app/*) */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {/* Default /app redirects by role */}
          <Route index element={<RoleHomeRedirect />} />

          {/* Admin & Staff Routes */}
          <Route
            path="dashboard"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <DashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="subscriptions"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <SubscriptionsPage />
              </RequireRole>
            }
          />
          <Route
            path="subscriptions/:id"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <SubscriptionDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="invoices"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <InvoicesPage />
              </RequireRole>
            }
          />
          <Route
            path="invoices/:id"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <InvoiceDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="payments"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <PaymentsPage />
              </RequireRole>
            }
          />
          <Route
            path="billing"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <BillingConsolePage />
              </RequireRole>
            }
          />
          <Route
            path="plans"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <PlansPage />
              </RequireRole>
            }
          />
          <Route
            path="templates"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <TemplatesPage />
              </RequireRole>
            }
          />

          {/* Admin-Only Governance & Configurations */}
          <Route
            path="discounts"
            element={
              <RequireRole allowedRoles={['admin']}>
                <DiscountsPage />
              </RequireRole>
            }
          />
          <Route
            path="taxes"
            element={
              <RequireRole allowedRoles={['admin']}>
                <TaxesPage />
              </RequireRole>
            }
          />
          <Route
            path="staff"
            element={
              <RequireRole allowedRoles={['admin']}>
                <StaffPage />
              </RequireRole>
            }
          />

          {/* Customer Portal Routes */}
          <Route
            path="portal"
            element={
              <RequireRole allowedRoles={['customer', 'admin', 'staff']}>
                <CustomerPortalPage />
              </RequireRole>
            }
          />
          <Route
            path="portal/subscriptions/:id"
            element={
              <RequireRole allowedRoles={['customer', 'admin', 'staff']}>
                <SubscriptionDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="portal/invoices"
            element={
              <RequireRole allowedRoles={['customer', 'admin', 'staff']}>
                <InvoicesPage />
              </RequireRole>
            }
          />
          <Route
            path="portal/invoices/:id"
            element={
              <RequireRole allowedRoles={['customer', 'admin', 'staff']}>
                <InvoiceDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="portal/payments"
            element={
              <RequireRole allowedRoles={['customer', 'admin', 'staff']}>
                <PaymentsPage />
              </RequireRole>
            }
          />
        </Route>

        {/* Backwards Compatibility Redirects for Flat Paths */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/subscriptions" element={<Navigate to="/app/subscriptions" replace />} />
        <Route path="/subscriptions/:id" element={<Navigate to="/app/subscriptions" replace />} />
        <Route path="/invoices" element={<Navigate to="/app/invoices" replace />} />
        <Route path="/invoices/:id" element={<Navigate to="/app/invoices" replace />} />
        <Route path="/payments" element={<Navigate to="/app/payments" replace />} />
        <Route path="/billing-console" element={<Navigate to="/app/billing" replace />} />
        <Route path="/billing" element={<Navigate to="/app/billing" replace />} />
        <Route path="/plans" element={<Navigate to="/app/plans" replace />} />
        <Route path="/templates" element={<Navigate to="/app/templates" replace />} />
        <Route path="/discounts" element={<Navigate to="/app/discounts" replace />} />
        <Route path="/taxes" element={<Navigate to="/app/taxes" replace />} />
        <Route path="/staff" element={<Navigate to="/app/staff" replace />} />
        <Route path="/portal" element={<Navigate to="/app/portal" replace />} />

        {/* Error Pages */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
