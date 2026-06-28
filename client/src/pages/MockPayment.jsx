import React, { useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const mockPaymentStyles = `
  .mock-payment-card {
    background: #ffffff;
    border: 1px solid rgba(196,199,199,0.4);
    box-shadow: 0 20px 50px rgba(0,0,0,0.05);
    max-width: 500px;
    width: 100%;
  }
  .qr-frame {
    border: 2px dashed #715a3e;
    background: #faf9f5;
  }
`;

const MockPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const orderCode = searchParams.get('orderCode');
  const amount = searchParams.get('amount');

  const handleConfirm = async (status) => {
    if (!orderCode) return;
    setLoading(true);
    try {
      await api('/payment/confirm-payment', {
        method: 'POST',
        body: {
          orderCode: Number(orderCode),
          status: status,
        },
      });

      // Redirect back to cart page with success/cancel status
      navigate(`/cart?status=${status}&orderCode=${orderCode}`);
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật trạng thái đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-on-surface font-body-md">
      <style dangerouslySetInnerHTML={{ __html: mockPaymentStyles }} />

      <div className="mock-payment-card p-8 rounded-sm space-y-6 reveal active">
        {/* Header */}
        <div className="text-center border-b border-outline-variant/30 pb-4">
          <h2 className="font-display-lg text-xl font-light text-primary uppercase tracking-wider">Cổng Thanh Toán Giả Lập</h2>
          <p className="text-xs text-on-surface-variant mt-1">Đang hoạt động ở chế độ Demo (Thiếu PayOS API Keys)</p>
        </div>

        {/* Order Details */}
        <div className="bg-surface-container/30 p-4 rounded-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Mã đơn hàng:</span>
            <span className="font-bold text-primary">#{orderCode || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Số tiền thanh toán:</span>
            <span className="font-bold text-primary text-base">${Number(amount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="qr-frame p-4 rounded-md">
            {/* Generate a mock VietQR Image for visual reference */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ATELIER_ORDER_${orderCode}_AMOUNT_${amount}`}
              alt="Mock QR Code"
              className="w-48 h-48"
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Quét mã QR để chuyển khoản giả lập</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Hoặc nhấn nút xác nhận bên dưới để hoàn tất giao dịch</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant/20">
          <button
            onClick={() => handleConfirm('success')}
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 hover:bg-secondary transition-colors font-label-caps uppercase tracking-wider text-xs font-bold disabled:bg-gray-300"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận Đã chuyển khoản thành công'}
          </button>
          
          <button
            onClick={() => handleConfirm('cancel')}
            disabled={loading}
            className="w-full border border-primary text-primary py-3 hover:bg-primary/5 transition-colors font-label-caps uppercase tracking-wider text-xs disabled:opacity-50"
          >
            Hủy thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockPayment;
