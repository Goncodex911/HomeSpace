import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';


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

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');

    try {
      if (provider === 'Google') {
        if (!window.google) {
          throw new Error('Google SDK is loading. Please refresh and try again.');
        }

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '82596489371-mockclientid.apps.googleusercontent.com',
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleUser = await userInfoRes.json();
                
                await submitSocialLogin({
                  email: googleUser.email,
                  fullName: googleUser.name || googleUser.email.split('@')[0],
                  provider: 'google',
                });
              } catch (err) {
                setError(err.message || 'Lỗi khi lấy thông tin tài khoản Google');
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: (err) => {
            setError(err.message || 'Google Login Error');
            setLoading(false);
          }
        });
        client.requestAccessToken();

      } else if (provider === 'Facebook') {
        if (!window.FB) {
          throw new Error('Facebook SDK is loading. Please refresh and try again.');
        }

        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || '123456789012345',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });

        window.FB.login((response) => {
          if (response.authResponse) {
            window.FB.api('/me', { fields: 'name,email' }, async (userData) => {
              if (userData && userData.email) {
                await submitSocialLogin({
                  email: userData.email,
                  fullName: userData.name || userData.email.split('@')[0],
                  provider: 'facebook',
                });
              } else {
                setError('Không thể lấy email từ tài khoản Facebook của bạn.');
                setLoading(false);
              }
            });
          } else {
            setError('Đăng nhập Facebook bị hủy bỏ.');
            setLoading(false);
          }
        }, { scope: 'public_profile,email' });
      }
    } catch (err) {
      console.warn(`${provider} SDK failed or not initialized:`, err.message);
      const emailStr = prompt(`[MOCK MODE] Nhập email để giả lập đăng ký/đăng nhập bằng ${provider}:`, `${provider.toLowerCase()}.test@lumina.com`);
      if (emailStr) {
        await submitSocialLogin({
          email: emailStr,
          fullName: `${provider} User`,
          provider: provider.toLowerCase(),
        });
      } else {
        setLoading(false);
      }
    }
  };

  const submitSocialLogin = async (bodyData) => {
    try {
      const res = await api('/auth/social-login', {
        method: 'POST',
        body: bodyData,
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      window.location.href = res.user.role === 'admin' ? '/admin' : '/';
    } catch (err) {
      setError(err.message || 'Đăng ký/Đăng nhập mạng xã hội thất bại.');
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

          {/* Alternative Methods */}
          <div className="mt-8 flex items-center gap-4 text-outline-variant">
            <hr className="flex-grow border-outline-variant/30" />
            <span className="font-label-caps text-label-caps">or continue with</span>
            <hr className="flex-grow border-outline-variant/30" />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="flex-grow flex-1 flex items-center justify-center gap-2 border border-outline-variant/30 py-3.5 hover:bg-surface-container-low transition-colors bg-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-label-caps text-[10px] tracking-wider uppercase">Google</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSocialLogin('Facebook')}
              className="flex-grow flex-1 flex items-center justify-center gap-2 border border-outline-variant/30 py-3.5 hover:bg-surface-container-low transition-colors bg-white"
            >
              <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-label-caps text-[10px] tracking-wider uppercase">Facebook</span>
            </button>
          </div>

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
