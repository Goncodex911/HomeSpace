import { useState } from 'react'
import { Link } from 'react-router-dom'
import {LoginWithGoogle} from '../services/authService'

export default function LoginModal() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login:', formData)
  }

  const handleGoogleLogin = async() =>{
    try {
    setLoading(true);
    const result = await LoginWithGoogle();
    const firebaseUser = result.user;
    const idToken = await firebaseUser.getIdToken();
    const response = await axios.post(
        // thêm link trả về backend,
        {
            idToken,
        }
    );
    const {token,user} = response.data;
    localStorage.setItem("token",token);
    localStorage.setItem("user",JSON.stringify(user));
      console.log("Login success:", user);

      onClose();
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="relative w-full max-w-md">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          backgroundImage: 'url(/luxury-room.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative bg-white/97 backdrop-blur p-12 rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-tight text-[var(--color-foreground)] mb-2">
            HOME SPACE
          </h1>
          <p className="text-xs font-bold tracking-widest text-[var(--color-foreground)]">
            -KIẾN TẠO KHÔNG GIAN ĐẦM CHẤT BẢN SẮc-
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold tracking-widest text-[var(--color-foreground)] block mb-3">
              TÊN ĐĂNG NHẬP HOẶC EMAIL
            </label>
            <input
              type="text"
              placeholder="example@atelier.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-[var(--color-foreground)] placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-0"
            />
          </div>

          <div>
            <label className="text-xs font-bold tracking-widest text-[var(--color-foreground)] block mb-3">
              MẬT KHẨU
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-[var(--color-foreground)] placeholder-gray-400 focus:border-[var(--color-primary)] focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 border border-gray-300 accent-[var(--color-primary)] cursor-pointer"
              />
              <span className="text-xs font-bold tracking-widest text-[var(--color-foreground)]">
                GHI NHỚ TÀI KHOẢN
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-primary)]"
            >
              QUÊN MẬT KHẨU?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white py-3 font-bold tracking-widest hover:bg-[var(--color-accent)] active:bg-[var(--color-primary)]"
          >
            ĐĂNG NHẬP
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-center text-xs text-[var(--color-foreground)] mb-4 font-semibold tracking-widest">
            HOẶC ĐĂNG NHẬP VỚI
          </p>

          <button type="button" className="w-full border border-gray-300 py-3 flex items-center justify-center gap-3 hover:bg-gray-50 active:bg-white"
          onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-xs font-bold tracking-widest text-[var(--color-foreground)]"
            >
              TIẾP TỤC VỚI GOOGLE
            </span>

          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-foreground)]">
          Chưa có tài khoản?{' '}
          <Link to="/signup" className="font-bold text-[var(--color-accent)] hover:text-[var(--color-primary)]">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
