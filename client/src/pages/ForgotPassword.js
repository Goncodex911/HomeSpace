import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.js'

export default function ForgotPassword() {
  const [step, setStep] = useState('email')
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (step === 'email') {
      setStep('otp')
    } else if (step === 'otp') {
      setStep('password')
    } else {
      console.log('Reset password:', formData)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-[var(--color-foreground)] mb-2">
            HOME SPACE.
          </p>
          <h1 className="text-4xl font-light tracking-tight text-[var(--color-foreground)]">
            Quên mật khẩu ?
          </h1>
          <p className="text-4xl font-light tracking-tight text-[var(--color-foreground)]"> 
            Vui lòng nhập thông tin bên dưới để thiết lập lại mật khẩu
          </p>
        </div>

        <p className="text-sm text-[var(--color-foreground)] mb-8">
          {step === 'email' && 'Nhập email để nhận mã xác thực'}
          {step === 'otp' && 'Nhập mã xác thực gửi đến email của bạn'}
          {step === 'password' && 'Tạo mật khẩu mới cho tài khoản'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 'email' && (
            <div>
              <label className="text-xs font-bold tracking-widest text-[var(--color-foreground)] block mb-3">
                ĐỊA CHỈ EMAIL
              </label>
              <input
                type="email"
                placeholder="example@atelier.vn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-0 py-3 border-0 border-b-2 border-[var(--color-secondary)] bg-transparent text-[var(--color-foreground)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          )}

          {step === 'otp' && (
            <>
              <div>
                <label className="text-xs font-bold tracking-widest text-[var(--color-foreground)] block mb-3">
                  MÃ XÁC THỰ OTP
                </label>
                <input
                  type="text"
                  placeholder="••••••"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  className="w-full px-0 py-3 border-0 border-b-2 border-[var(--color-secondary)] bg-transparent text-[var(--color-foreground)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <p className="text-right pt-1">
                <button type="button" className="text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-primary)]">
                  GỬI LẠI MÃ
                </button>
              </p>
            </>
          )}

          {step === 'password' && (
            <>
              <div>
                <label className="text-xs font-bold tracking-widest text-[var(--color-foreground)] block mb-3">
                  MẬT KHẨU MỚI
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
            </>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white py-3 font-bold tracking-widest hover:bg-[var(--color-accent)] active:bg-[var(--color-primary)]"
          >
            {step === 'email' ? 'TIẾP TỤC' : step === 'otp' ? 'XÁC NHẬN' : 'ĐẶT LẠI MẬT KHẨU'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--color-foreground)]">
          ← <Link to="/" className="font-bold text-[var(--color-accent)] hover:text-[var(--color-primary)]">
            QUAY LẠI TRANG ĐĂNG NHẬP
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
