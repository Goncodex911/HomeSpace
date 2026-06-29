import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // Step 1: Request, Step 2: Input OTP & New Password
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword, resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setMessage('A reset OTP has been sent. Please check your console.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email, otp, newPassword);
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
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

      <main className="min-h-screen flex flex-col md:flex-row bg-background pt-20">
        {/* Split Layout: Visual Side */}
        <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-surface-container">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDLIIR77wfhViXL6ix0fse7LCP72pmOldxjDkioSXoyRPPyem2Sy-kBQn6P4C-HpIl5Rc55OchfLaoogttJfhcKHjEtEyAVtsy3O1MIKpLpfbobmjPHC45ZBl1JaSW124juD2mYSK4Y44QWFJWEXycjgki732hMoN659wgOU5NPU6VOkkLcQ2XDBebs0MwENZ4h2QBh7qzSx_Swar9MYi2nuQfINxsxyrW3-WV3y_FkWZcYzPKQhll0LuUVuFhx05i36piVAyVk9YHw')",
            }}
          ></div>
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute bottom-margin-desktop left-margin-desktop z-10 max-w-md">
            <p className="font-label-caps text-label-caps text-white/70 uppercase mb-4">The Atelier Collection</p>
            <h2 className="font-display-lg text-display-lg text-white leading-tight">Curating Timelessness.</h2>
          </div>
        </section>

        {/* Form Side */}
        <section className="flex-1 flex flex-col justify-center px-margin-mobile md:px-margin-desktop py-20 bg-surface">
          <div className="max-w-md mx-auto w-full space-y-12">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="font-headline-lg text-headline-lg text-primary">Reset Your Password</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                {step === 1
                  ? "Enter your email address and we'll send you an OTP to reset your password."
                  : "Enter the OTP code from your console and your new password."}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-error-container text-on-error-container text-sm border border-error/20">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-secondary-container text-on-secondary-container text-sm border border-secondary/20">
                {message}
              </div>
            )}

            {step === 1 ? (
              /* Step 1: Request Reset Form */
              <form className="space-y-10" onSubmit={handleRequestReset}>
                <div className="group relative space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant transition-colors group-focus-within:text-primary" htmlFor="email">Email Address</label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-3 text-body-lg placeholder:text-outline/50 transition-all duration-300 rounded-none focus:outline-none"
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-6">
                  <button
                    className={`w-full py-4 h-14 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest hover:bg-secondary transition-colors flex items-center justify-center gap-3 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset OTP'}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <div className="flex justify-center">
                    <Link className="inline-flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors group" to="/login">
                      <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              </form>
            ) : (
              /* Step 2: Confirm Reset Password Form */
              <form className="space-y-10" onSubmit={handleResetPassword}>
                <div className="group relative space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="otp">6-Digit OTP Code</label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-3 text-body-lg placeholder:text-outline/50 transition-all duration-300 rounded-none focus:outline-none"
                    id="otp"
                    name="otp"
                    placeholder="123456"
                    required
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <div className="group relative space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="newPassword">New Password</label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-3 text-body-lg placeholder:text-outline/50 transition-all duration-300 rounded-none focus:outline-none"
                    id="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-6">
                  <button
                    className={`w-full py-4 h-14 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest hover:bg-secondary transition-colors flex items-center justify-center gap-3 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  </button>
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
                      onClick={() => setStep(1)}
                    >
                      Resend Email
                    </button>
                    <span className="text-outline-variant">|</span>
                    <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" to="/login">
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResetPassword;
