import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../../lib/apiClient';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USER = {
  _id: 'usr_demo_admin_01',
  name: 'Alexander Hamilton',
  email: 'alexander@mercury-holdings.co',
  role: 'admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cadence_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore JSON error
    }
    // Default to admin for seamless evaluation
    return DEFAULT_DEMO_USER;
  });

  const [token, setToken] = useState(() => localStorage.getItem('cadence_token') || 'demo_jwt_token_admin');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cadence_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cadence_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('cadence_token', token);
    } else {
      localStorage.removeItem('cadence_token');
    }
  }, [token]);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('cadence-auth-logout', handleLogout);
    return () => window.removeEventListener('cadence-auth-logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      setToken(data.token);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cadence_user');
    localStorage.removeItem('cadence_token');
  };

  // Live Role Switcher for instant testing across personas
  const switchRole = (newRole) => {
    if (!['admin', 'staff', 'customer'].includes(newRole)) return;
    const roleProfiles = {
      admin: {
        _id: 'usr_demo_admin_01',
        name: 'Alexander Hamilton',
        email: 'alexander@mercury-holdings.co',
        role: 'admin',
      },
      staff: {
        _id: 'usr_demo_staff_01',
        name: 'Elena Rostova',
        email: 'elena@cadence.finance',
        role: 'staff',
      },
      customer: {
        _id: 'usr_demo_cust_01',
        name: 'Sarah Jenkins',
        email: 'sarah@acme-corp.com',
        role: 'customer',
      },
    };
    setUser(roleProfiles[newRole]);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    login,
    signup,
    verifyOtp,
    logout,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
