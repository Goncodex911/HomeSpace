import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.user && res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      // Check if account is unverified (handled by custom code/response)
      if (err.message.includes('not verified') || err.message.includes('unverified') || err.unverified) {
        // Redirection with state
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-margin-desktop h-20 w-full z-50 bg-white/70 backdrop-blur-md border-b border-outline-variant/30">
        <Link className="font-headline-md text-headline-md tracking-tighter font-light text-primary" to="/">
          Lumina
        </Link>
        <div>
          <Link className="font-label-caps text-label-caps tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors" to="/register">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="flex-grow flex flex-col md:flex-row min-h-screen pt-20">
      {/* Left Side: Architectural Interior Photo */}
      <section className="hidden md:block w-1/2 relative bg-surface-container-low overflow-hidden">
        <div className="absolute inset-0 bg-black/5 z-10"></div>
        <img
          alt="Luxury Interior"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEWhWuXVsm4CULvR7CKtQdIEhwgaxM6LU57SNTG0nfgaqCg59IgSvLuhuyl79prK_XHOry-9TRFNDg2HDBBiHw_QojE7epdKmWPjBdUiN4pReR6NrRpJrNewa8LZmAMCRneVFYn2PKwaLV5NaTMishIoSxaJKg6CIfmNC6reV2HqCMYef7Ti1vaiWlfyCDvAYPb4FsPrF9dMLonJPtuBOjhFgaWzk-6r2QQl6XZGe_C2btBvqhhvLw5piJXFb_pYNH4h9PIH8kUElV"
        />
        <div className="absolute bottom-margin-desktop left-margin-desktop z-20 max-w-md">
          <p className="font-label-caps text-label-caps text-white/70 uppercase tracking-[0.2em] mb-4">Curated Living</p>
          <h2 className="font-display-lg text-display-lg text-white leading-none">The art of the home.</h2>
        </div>
      </section>

      {/* Right Side: Clean White Login Panel */}
      <section className="w-full md:w-1/2 flex items-center justify-center px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
        <div className="w-full max-w-[440px] py-12 md:py-0">
          <header className="mb-12">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Welcome Back</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Access your curated collection and design preferences.</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container border border-error/20 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-10" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="relative">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2" htmlFor="email">Email Address</label>
              <input
                className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 font-body-md text-body-md text-on-surface placeholder:text-outline-variant/50 focus:ring-0 focus:border-primary transition-all duration-300 rounded-none focus:outline-none"
                id="email"
                name="email"
                placeholder="name@example.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Password Field */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="password">Password</label>
                <Link className="font-label-caps text-label-caps text-secondary hover:text-primary transition-colors" to="/reset-password">Forgot Password?</Link>
              </div>
              <input
                className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 font-body-md text-body-md text-on-surface placeholder:text-outline-variant/50 focus:ring-0 focus:border-primary transition-all duration-300 rounded-none focus:outline-none pr-10"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute right-0 bottom-3 text-on-surface-variant hover:text-primary transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'opsz' 20" }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {/* Action Button */}
            <div className="pt-4">
              <button
                className={`w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-5 px-unit-gutter tracking-widest hover:bg-secondary transition-colors duration-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Alternative Methods */}
          <div className="mt-10 flex items-center gap-4 text-outline-variant">
            <hr className="flex-grow border-outline-variant/30" />
            <span className="font-label-caps text-label-caps">or continue with</span>
            <hr className="flex-grow border-outline-variant/30" />
          </div>
          <div className="mt-8 flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 border border-outline-variant/30 py-3 hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'opsz' 18" }}>fingerprint</span>
              <span className="font-label-caps text-label-caps uppercase">Biometric</span>
            </button>
          </div>

          <footer className="mt-16 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{' '}
              <Link className="text-primary font-semibold hover:underline underline-offset-4 transition-all" to="/register">Sign Up</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
    </div>
  );
};

export default SignIn;
