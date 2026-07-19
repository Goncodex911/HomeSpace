import { createContext, useState, useEffect } from 'react';
import api from '../api/api';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';

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

  const loginWithGoogle = async (credentialToken) => {
    // Để lấy thông tin email, name từ credential token của Google (JWT), ta cần decode nó
    try {
      const base64Url = credentialToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { email, name } = JSON.parse(jsonPayload);

      const res = await api('/auth/social-login', {
        method: 'POST',
        body: {
          email,
          fullName: name,
          provider: 'google',
        },
      });

      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
      }
      return res;
    } catch (error) {
      console.error('Error decoding/sending Google token:', error);
      throw new Error('Google authentication failed');
    }
  };

  const loginWithGoogleFirebase = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await api('/auth/firebase-login', {
        method: 'POST',
        body: { idToken },
      });

      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
      }
      return res;
    } catch (error) {
      console.error('Firebase Google Login Error:', error.message);
      throw error;
    }
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
        loginWithGoogleFirebase,
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
