import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscribe, setSubscribe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(fullName, email, password);
      // Navigate to OTP page, passing email state
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.message || 'Registration failed');
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
        <div className="hidden md:block">
          <Link className="font-label-caps text-label-caps tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors" to="/login">
            Sign In
          </Link>
        </div>
      </header>

      <main className="min-h-screen pt-20 flex flex-col md:flex-row bg-surface-container-lowest">
        {/* Left Panel: Sign Up Form */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface-container-lowest">
          <div className="max-w-md w-full py-12 md:py-0">
          <div className="mb-12">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Create Your Atelier Account</h1>
            <p className="font-body-md text-on-surface-variant">Join our curated community of designers and architects.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container border border-error/20 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="full_name">Full Name</label>
              <input
                className="w-full border-none border-b border-outline-variant py-3 text-body-lg font-body-lg placeholder:text-outline-variant focus:outline-none focus:ring-0 focus:border-primary bg-transparent rounded-none px-0"
                id="full_name"
                name="full_name"
                placeholder="E.g. Julian Vossen"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="email">Email Address</label>
              <input
                className="w-full border-none border-b border-outline-variant py-3 text-body-lg font-body-lg placeholder:text-outline-variant focus:outline-none focus:ring-0 focus:border-primary bg-transparent rounded-none px-0"
                id="email"
                name="email"
                placeholder="julian@atelier.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  className="w-full border-none border-b border-outline-variant py-3 text-body-lg font-body-lg placeholder:text-outline-variant focus:outline-none focus:ring-0 focus:border-primary bg-transparent rounded-none px-0 pr-10"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-0 top-3 text-on-surface-variant hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-start gap-4 pt-4">
              <div className="flex h-6 items-center">
                <input
                  className="h-4 w-4 rounded-none border-outline-variant text-primary focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                  id="subscribe"
                  name="subscribe"
                  type="checkbox"
                  checked={subscribe}
                  onChange={(e) => setSubscribe(e.target.checked)}
                />
              </div>
              <div className="text-sm leading-6">
                <label className="font-body-md text-on-surface-variant cursor-pointer select-none" htmlFor="subscribe">
                  Subscribe to Architectural Journals and seasonal curated release collections.
                </label>
              </div>
            </div>
            <div className="pt-6">
              <button
                className={`w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest py-5 px-8 transition-all duration-300 hover:bg-secondary active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
          <div className="mt-12 text-center">
            <p className="font-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link className="text-primary font-semibold border-b border-transparent hover:border-primary pb-0.5 transition-all" to="/login">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right Panel: Architectural Visual */}
      <section className="hidden md:block w-1/2 relative overflow-hidden bg-surface-container">
        <div className="absolute inset-0 bg-black/5 z-10"></div>
        <img
          alt="Minimalist Architectural Detail"
          className="w-full h-full object-cover transform transition-transform duration-[2000ms] hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDrfAUd9aHoll5_gbogUbTux1oG0TBdOFiHxxuHrnIIjZ89R3hCy7pVCdAcLUY7tBSL-YBaP7cMdQjY9R0sKeuNwWZzkAlEhgFNNxk_QGPCg-9HDs23AINVYaIciGl3DeJRtvj6dJhlt6dAAq0sEvWIiSfoA4BH4vill1_ihN6sucMCF0HVdTmMrsZHnsjnWI-Xe9lggsdw-b4NnC0v6TaIYvWRlPXLdU9k-eQcrfpMuaWvCOU2e0V5edNUi-q6vbbQqnVZlo1H0l5"
        />
        <div className="absolute bottom-margin-desktop left-margin-desktop z-20 max-w-sm">
          <p class="font-label-caps text-label-caps text-white/60 tracking-[0.2em] mb-4">CURATED SPACES</p>
          <h2 class="font-display-lg text-headline-lg text-white leading-tight font-light">The harmony of form and shadow.</h2>
        </div>
        <div className="absolute top-margin-desktop right-margin-desktop z-20 p-8 glass-header border border-white/10 rounded-none shadow-2xl hidden lg:block max-w-[280px]">
          <span className="material-symbols-outlined text-primary mb-4">architecture</span>
          <p className="font-body-md text-on-surface-variant italic">"Architecture is the learned game, correct and magnificent, of forms assembled in the light."</p>
          <div className="mt-4 h-px w-12 bg-primary"></div>
        </div>
      </section>
    </main>
    </div>
  );
};

export default SignUp;
