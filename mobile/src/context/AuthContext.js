import React, { createContext, useState, useEffect } from 'react';
import api from '../api/api';
import { storage } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem('token');
      setToken(saved);
      setBooting(false);
      if (!saved) setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (booting) return;

    const fetchUserProfile = async () => {
      if (token) {
        try {
          const res = await api('/auth/profile');
          if (res.user) {
            await storage.setItem('user', JSON.stringify(res.user));
            setUser(res.user);
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          await storage.removeItem('token');
          await storage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [token, booting]);

  const persistAuth = async (newToken, newUser) => {
    await storage.setItem('token', newToken);
    await storage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (fullName, email, password) =>
    api('/auth/register', { method: 'POST', body: { fullName, email, password } });

  const verifyOtp = async (email, otp) => {
    const res = await api('/auth/verify-otp', { method: 'POST', body: { email, otp } });
    if (res.token) await persistAuth(res.token, res.user);
    return res;
  };

  const resendOtp = async (email) =>
    api('/auth/resend-otp', { method: 'POST', body: { email } });

  const login = async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } });
    if (res.token) await persistAuth(res.token, res.user);
    return res;
  };

  const forgotPassword = async (email) =>
    api('/auth/forgot-password', { method: 'POST', body: { email } });

  const resetPassword = async (email, otp, newPassword) =>
    api('/auth/reset-password', { method: 'POST', body: { email, otp, newPassword } });

  const logout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api('/auth/profile', { method: 'PUT', body: profileData });
    if (res.user) {
      await storage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const applyVendor = async (vendorData) => {
    const res = await api('/auth/apply-vendor', { method: 'POST', body: vendorData });
    if (res.user) {
      await storage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const loginWithGoogle = async ({ email, fullName }) => {
    const res = await api('/auth/social-login', {
      method: 'POST',
      body: { email, fullName, provider: 'google' },
    });
    if (res.token) await persistAuth(res.token, res.user);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        verifyOtp,
        resendOtp,
        login,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        applyVendor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
