import { createContext, useState, useEffect } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const res = await api('/auth/profile');
          if (res.user) {
            localStorage.setItem('user', JSON.stringify(res.user));
            setUser(res.user);
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          // If token is invalid or expired, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [token]);

  const register = async (fullName, email, password) => {
    return await api('/auth/register', {
      method: 'POST',
      body: { fullName, email, password },
    });
  };

  const verifyOtp = async (email, otp) => {
    const res = await api('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const resendOtp = async (email) => {
    return await api('/auth/resend-otp', {
      method: 'POST',
      body: { email },
    });
  };

  const login = async (email, password) => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const forgotPassword = async (email) => {
    return await api('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  };

  const resetPassword = async (email, otp, newPassword) => {
    return await api('/auth/reset-password', {
      method: 'POST',
      body: { email, otp, newPassword },
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
    if (res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const applyVendor = async (vendorData) => {
    const res = await api('/auth/apply-vendor', {
      method: 'POST',
      body: vendorData,
    });
    if (res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
    }
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
