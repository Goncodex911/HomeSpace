import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useContext(AuthContext);

  const [email, setEmail] = useState(location.state?.email || '');
  const [showEmailInput, setShowEmailInput] = useState(!location.state?.email);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Backspace on empty input goes to previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!email) {
      setError('Please provide your email address');
      setShowEmailInput(true);
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      setMessage('Account verified successfully. Welcome to Lumina!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    if (!email) {
      setError('Please enter your email to resend OTP');
      setShowEmailInput(true);
      return;
    }

    setError('');
    setMessage('');
    try {
      await resendOtp(email);
      setMessage('Verification code resent. Please check your console.');
      setResendCooldown(30); // 30s cooldown
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full bg-white/70 backdrop-blur-md border-b border-outline-variant/30 h-20 px-margin-mobile md:px-margin-desktop flex items-center justify-between z-50">
        <Link className="font-headline-md text-headline-md tracking-tighter font-light text-primary" to="/">
          Lumina
        </Link>
        <div>
          <Link className="font-label-caps text-label-caps tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors" to="/login">
            Sign In
          </Link>
        </div>
      </header>

      <main className="min-h-screen pt-20 flex flex-col md:flex-row bg-background">
        {/* Image Side (Split Screen) */}
        <section className="hidden md:block md:w-1/2 lg:w-3/5 h-[calc(100vh-80px)] sticky top-20 overflow-hidden">
          <img
            alt="Lumina Lamp"
            className="w-full h-full object-cover grayscale-[20%] contrast-[1.05]"
            src="https://lh3.googleusercontent.com/aida/AP1WRLtuNU8hVZmXU1R-rZSdDjqzNbV9jImdPwZn1ZhvH6_iAh3v5eCONIzngwCZY9GhKEI5lgkaQ74UOxPE1vwknZ08uXv1nQpFlXKVw09aJuRbojpGevAz9fqYXs_k5KwaWuDVzFeuUD_Ip_7PxVKpI_yG1EWr6Z1hdgG6kKA1GjASbKLomqDwLamnZefBTEAAicf7QWdyBLCUCn82xd19lJX-NXsJXWCS-CPY91tsS4bcsz_8x_XRQQCEMcQI"
          />
        </section>

      {/* Form Side */}
      <section className="w-full md:w-1/2 lg:w-2/5 px-6 md:px-12 lg:px-24 flex flex-col justify-center py-20 bg-surface-container-lowest">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-12">
            <h1 className="font-headline-lg text-headline-lg mb-4 text-primary">Verify Your Email</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              We've sent a 6-digit code to your email address. Please enter it below to activate your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm border border-error/20">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-secondary-container text-on-secondary-container text-sm border border-secondary/20">
              {message}
            </div>
          )}

          <form className="space-y-10" onSubmit={handleSubmit}>
            {showEmailInput && (
              <div className="space-y-1">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="verify-email">Email Address</label>
                <input
                  className="w-full border-none border-b border-outline-variant py-2 bg-transparent text-body-md placeholder:text-outline-variant/50 focus:outline-none focus:ring-0 focus:border-primary rounded-none px-0"
                  id="verify-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {!showEmailInput && (
              <div className="flex justify-between items-center text-sm bg-surface-container-low px-4 py-3 border border-outline-variant/30">
                <span className="text-on-surface-variant">Verifying <strong>{email}</strong></span>
                <button
                  type="button"
                  className="text-primary hover:underline text-xs"
                  onClick={() => setShowEmailInput(true)}
                >
                  Change Email
                </button>
              </div>
            )}

            {/* OTP Input Grid */}
            <div className="flex justify-between gap-3">
              {otp.map((val, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  className="w-12 h-16 md:w-14 md:h-20 text-center text-headline-md border-0 border-b-2 border-outline-variant bg-transparent transition-all duration-300 focus:border-primary focus:ring-0 rounded-none"
                  maxlength="1"
                  type="text"
                  value={val}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  required
                />
              ))}
            </div>

            <div className="space-y-6">
              <button
                className={`w-full bg-primary text-on-primary py-5 font-body-md text-body-md uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="flex flex-col items-center gap-4">
                <p className="font-body-md text-body-md text-on-surface-variant">Didn't receive the code?</p>
                <button
                  className={`font-label-caps text-label-caps uppercase tracking-widest text-primary border-b border-transparent hover:border-primary transition-all duration-300 ${resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  id="resend-btn"
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
    </div>
  );
};

export default VerifyOtp;
