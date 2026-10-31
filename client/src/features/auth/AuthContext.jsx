import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cadence_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('cadence_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate identity honestly from GET /api/auth/me using real JWT
  const rehydrate = useCallback(async () => {
    const activeToken = localStorage.getItem('cadence_token');
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/api/auth/me');
      const currentUser = res?.user || res?.data || res;
      if (currentUser && (currentUser._id || currentUser.id || currentUser.email)) {
        setUser(currentUser);
        localStorage.setItem('cadence_user', JSON.stringify(currentUser));
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      localStorage.removeItem('cadence_token');
      localStorage.removeItem('cadence_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      const receivedToken = data.token;
      const receivedUser = data.user;

      if (!receivedToken || !receivedUser) {
        throw new Error('Server returned invalid authentication payload');
      }

      localStorage.setItem('cadence_token', receivedToken);
      localStorage.setItem('cadence_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return { token: receivedToken, user: receivedUser };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    return await api.post('/api/auth/signup', userData);
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/api/auth/verify-signup', { email, otp });
    const receivedToken = res?.token;
    const receivedUser = res?.user;
    if (receivedToken && receivedUser) {
      localStorage.setItem('cadence_token', receivedToken);
      localStorage.setItem('cadence_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
    }
    return res;
  };

  const resendOtp = async (email) => {
    return await api.post('/api/auth/resend-signup-otp', { email });
  };

  const forgotPassword = async (email) => {
    return await api.post('/api/auth/forgot-password', { email });
  };

  const resetPassword = async (email, otp, new_password) => {
    return await api.post('/api/auth/reset-password', { email, otp, new_password });
  };

  const logout = () => {
    localStorage.removeItem('cadence_token');
    localStorage.removeItem('cadence_user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  const role = user?.role || 'customer';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        login,
        signup,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        rehydrate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
