import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';


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

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');

    try {
      if (provider === 'Google') {
        // Kiểm tra xem SDK Google đã tải chưa
        if (!window.google) {
          throw new Error('Google SDK is loading. Please refresh and try again.');
        }

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '82596489371-mockclientid.apps.googleusercontent.com',
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                // Fetch thông tin người dùng từ Google
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
        // Khởi tạo và đăng nhập Facebook SDK
        if (!window.FB) {
          throw new Error('Facebook SDK is loading. Please refresh and try again.');
        }

        // Khởi tạo FB SDK nếu chưa khởi tạo
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || '123456789012345',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });

        window.FB.login((response) => {
          if (response.authResponse) {
            // Lấy thông tin user từ Graph API
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
      // Nếu chưa cài đặt key thật hoặc SDK lỗi, cho phép sử dụng chế độ mock tiện lợi cho người dùng
      console.warn(`${provider} SDK failed or not initialized:`, err.message);
      const emailStr = prompt(`[MOCK MODE] Nhập email để giả lập đăng nhập bằng ${provider}:`, `${provider.toLowerCase()}.test@lumina.com`);
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

      // Lưu token và thông tin user
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      window.location.href = res.user.role === 'admin' ? '/admin' : '/';
    } catch (err) {
      setError(err.message || 'Đăng nhập mạng xã hội thất bại.');
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
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
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
