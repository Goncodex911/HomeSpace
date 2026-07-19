import React, { useEffect, useRef, useContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const loadScript = (src, id) =>
  new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

/**
 * Google social login button for SignIn / SignUp.
 */
const SocialLoginButtons = ({ onError }) => {
  const { loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const finishLogin = useCallback(
    (res) => {
      if (res?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    },
    [navigate]
  );

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) return;
      setBusy(true);
      try {
        const res = await loginWithGoogle(response.credential);
        finishLogin(res);
      } catch (err) {
        onError?.(err.message || 'Google login failed');
      } finally {

        setBusy(false);
      }
    },
    [loginWithGoogle, finishLogin, onError]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,

        callback: handleGoogleCredential,
      });
      // Render standard Google button (max width allowed by Google is 400)
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 400,
        text: 'continue_with',
        shape: 'rectangular',
      });
    };

    if (window.google?.accounts?.id) {
      setTimeout(initializeGoogle, 50);
    } else {
      loadScript('https://accounts.google.com/gsi/client?hl=en', 'google-gsi')
        .then(() => {
          setTimeout(initializeGoogle, 50);
        })
        .catch(() => onError?.('Không tải được Google Sign-In'));
    }

    return () => {
      cancelled = true;
    };
  }, [handleGoogleCredential, onError]);

  return (
    <div className="mt-8 space-y-4">
      {GOOGLE_CLIENT_ID ? (
        <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
      ) : (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 border border-outline-variant/30 py-4 opacity-50 cursor-not-allowed text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest"
          title="Set VITE_GOOGLE_CLIENT_ID in client/.env"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-5.9-4.4H2.9v2.5C4.6 19.8 8 22 12 22z" />
            <path fill="#4A90E2" d="M6.1 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.7H2.9C2.3 9 2 10.4 2 12s.3 3 0.9 4.3l3.2-2.5z" />
            <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8 2 4.6 4.2 2.9 7.7l3.2 2.5C6.9 7.7 9.2 5.8 12 5.8z" />
          </svg>
          <span>Google (chưa cấu hình)</span>
        </button>
      )}
    </div>
  );
};

export default SocialLoginButtons;
