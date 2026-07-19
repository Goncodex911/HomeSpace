import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Google social login button using Firebase Authentication.
 */
const SocialLoginButtons = ({ onError }) => {
  const { loginWithGoogleFirebase } = useContext(AuthContext);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const finishLogin = (res) => {
    if (res?.user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    setBusy(true);
    try {
      const res = await loginWithGoogleFirebase();
      finishLogin(res);
    } catch (err) {
      console.error(err);
      onError?.(err.message || 'Google login via Firebase failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <button
        type="button"
        disabled={busy}
        onClick={handleFirebaseGoogleLogin}
        className="w-full flex items-center justify-center gap-3 border border-outline-variant/60 py-4 hover:bg-surface-container-low transition-all duration-300 active:scale-[0.98] text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest font-semibold disabled:opacity-50"
      >
        {busy ? (
          <span>Connecting...</span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-5.9-4.4H2.9v2.5C4.6 19.8 8 22 12 22z" />
              <path fill="#4A90E2" d="M6.1 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.7H2.9C2.3 9 2 10.4 2 12s.3 3 0.9 4.3l3.2-2.5z" />
              <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8 2 4.6 4.2 2.9 7.7l3.2 2.5C6.9 7.7 9.2 5.8 12 5.8z" />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SocialLoginButtons;
