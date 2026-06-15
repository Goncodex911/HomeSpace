import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.js'

export default function SignUp() {
  const [formData, setFormData] = useState({
    displayName: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Sign up:', formData)
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-[var(--color-foreground)] mb-2">
            HOME SPACE.
          </p>
          <h1 className="text-4xl font-light tracking-tight text-[var(--color-foreground)]">
            Tạo tài khoản mới
          </h1>
        </div>

        <p className="text-sm text-[var(--color-foreground)] mb-8">
          Chào mừng bạn đến với cộng đồng tinh hoa nội thất của chúng tôi.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold tracking-widest text-[var(--color-foreground)] block mb-3">
              TÊN ĐĂNG NHẬP
            </label>
            <input
              type="text"
              placeholder="Nhập tên người dùng của bạn"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-0 py-3 border-0 border-b-2 border-[var(--color-secondary)] bg-transparent text-[var(--color-foreground)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)]"
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
              className="w-full px-0 py-3 border-0 border-b-2 border-[var(--color-secondary)] bg-transparent text-[var(--color-foreground)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-xs font-bold tracking-widest text-[var(--color-foreground)] block mb-3">
              NHẬP LẠI MẬT KHẨU
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-0 py-3 border-0 border-b-2 border-[var(--color-secondary)] bg-transparent text-[var(--color-foreground)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white py-3 font-bold tracking-widest hover:bg-[var(--color-accent)] active:bg-[var(--color-primary)]"
          >
            ĐĂNG KÝ
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[var(--color-secondary)]">
          <p className="text-center text-xs text-[var(--color-foreground)] font-semibold tracking-widest">
            HOẶC TẠO TÀI KHOẢN VỚI
          </p>

          <button type="button" className="w-full mt-4 border border-[var(--color-secondary)] py-3 flex items-center justify-center gap-3 hover:bg-gray-50 active:bg-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            ĐĂNG KÝ NHANH VỚI GMAIL
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-foreground)]">
          Đã có tài khoản?{' '}
          <Link to="/" className="font-bold text-[var(--color-accent)] hover:text-[var(--color-primary)]">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
