import { useLocation } from 'react-router-dom'

export default function AuthLayout({ children }) {
  const location = useLocation()
  const isLoginPage = location.pathname === '/'

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url(/luxury-room.png)',
          backgroundAttachment: 'fixed',
        }}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Dark brown sidebar */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] text-white items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-12">
            <p className="text-xs font-bold tracking-widest opacity-75 mb-4">
              ESTABLISHED 2024
            </p>
            <h1 className="text-5xl font-light tracking-tight leading-tight">
              Kiến tạo không gian đấm chất bản sắc.
            </h1>
          </div>
          <p className="text-sm opacity-80">
            Khám phá nghệ thuật bài trí nội thất cao cấp và sở hữu những thiết kế độc bản từ HomeSpace. Chúng tôi cam kết mang đến trải nghiệm mua sắm trực tuyến đẳng cấp, nơi bạn có thể tìm thấy những món đồ nội thất độc đáo và tinh tế, được thiết kế để làm nổi bật phong cách sống của bạn. Hãy để HomeSpace giúp bạn biến ngôi nhà thành một tác phẩm nghệ thuật sống động và đầy cảm hứng.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        {children}
      </div>
    </div>
  )
}
