import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';
import { getDefaultPathForRole } from './routeConfig';

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const currentPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${currentPath}`} replace />;
  }

  return children;
}

export function RequireRole({ allowedRoles, children }) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export function GuestOnly({ children }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    const searchParams = new URLSearchParams(location.search);
    const nextPath = searchParams.get('next');
    return <Navigate to={nextPath || getDefaultPathForRole(role)} replace />;
  }

  return children;
}

