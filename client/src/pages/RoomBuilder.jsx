import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { formatUSD } from '../utils/currency';

const RoomBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMaterial, setActiveMaterial] = useState('Cream');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lấy productId từ URL query params (?productId=...)
  const queryParams = new URLSearchParams(location.search);
  const targetProductId = queryParams.get('productId');

  // 1. Nạp thư viện Model-Viewer của Google qua CDN
  useEffect(() => {
    const scriptId = 'google-model-viewer';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  // 2. Fetch danh sách sản phẩm thật từ Database
  useEffect(() => {
    const fetch3DProducts = async () => {
      try {
        const res = await api('/items/all');
        const allItems = res.data || [];
        
        // Lọc ra các sản phẩm đã được cấu hình link model3D thật trong Database
        const itemsWith3D = allItems.filter(item => item.model3d);
        
        setProducts(itemsWith3D);
        if (itemsWith3D.length > 0) {
          // Nếu có productId trên URL, chọn đúng sản phẩm đó
          const matched = itemsWith3D.find(item => item._id === targetProductId);
          setSelectedProduct(matched || itemsWith3D[0]);
        } else {
          setError('Không tìm thấy sản phẩm nào có mô hình 3D trong hệ thống.');
        }
      } catch (err) {
        console.error('Lỗi fetch sản phẩm 3D:', err);
        setError('Không thể kết nối lấy dữ liệu mô hình 3D từ Server.');
      } finally {
        setLoading(false);
      }
    };
    fetch3DProducts();
  }, [targetProductId]);

  const handleProductChange = (product) => {
    setSelectedProduct(product);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center text-[#1a1c1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1c1a] mb-4"></div>
        <p className="font-medium uppercase tracking-widest text-xs">Đang tải không gian thiết kế 3D...</p>
      </div>
    );
  }

  // Giao diện khi không có sản phẩm 3D nào
  if (error || !selectedProduct) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center text-[#1a1c1a] px-6">
        <span className="material-symbols-outlined text-5xl text-[#707973] mb-4">view_in_ar</span>
        <h2 className="text-xl font-light tracking-wide mb-2 text-center">Không tìm thấy Mô hình 3D nào</h2>
        <p className="text-sm text-[#707973] text-center max-w-md mb-8 leading-relaxed">
          {error || 'Hãy vào trang quản trị Curator Dashboard để tạo mô hình 3D cho các sản phẩm bằng công cụ AI trước khi xem tại đây.'}
        </p>
        <div className="flex gap-4">
          <Link to="/store" className="bg-[#1a1c1a] text-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-[#006a50] transition-colors">
            Đến Curator Portal
          </Link>
          <Link to="/" className="border border-[#c4c7c7] px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-[#1a1c1a] hover:text-white transition-all">
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  // Parse specifications từ trường description nếu có để hiển thị thông số chi tiết
  const descParts = (selectedProduct.description || '').split('\n\n---\n');
  const baseDescription = descParts[0];
  let specsList = ['Độ hoàn thiện bề mặt tinh tế', 'Chất lượng xuất khẩu chuẩn Châu Âu', 'Bảo hành chính hãng 24 tháng'];
  
  if (descParts.length > 1) {
    const specText = descParts[1];
    const lines = specText.split('\n').filter(line => line.includes(':'));
    if (lines.length > 0) {
      specsList = lines.map(line => line.replace(/:/g, ': '));
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1a1c1a] font-sans flex flex-col">
      {/* Top Header */}
      <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-[#e5e5e1] fixed top-0 w-full z-50 flex items-center justify-between px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-8">
          <Link className="font-display-lg text-2xl tracking-tighter text-[#1a1c1a] font-light" to="/">
            AURA STUDIO
          </Link>
          <span className="bg-[#006a50]/10 text-[#006a50] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
            3D Showroom Live
          </span>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="border border-[#c4c7c7] px-6 py-2.5 font-medium hover:bg-[#1a1c1a] hover:text-white transition-all duration-300"
        >
          QUAY LẠI
        </button>
      </header>

      {/* Main Studio Interface */}
      <main className="flex-1 pt-20 flex flex-col lg:flex-row">
        {/* Left Side: 3D Viewport */}
        <div className="flex-1 min-h-[50vh] lg:min-h-[calc(100vh-80px)] bg-[#eeeeea] relative flex items-center justify-center">
          <model-viewer
            src={selectedProduct.model3d}
            ios-src=""
            alt={`Mô hình 3D thực tế của ${selectedProduct.name}`}
            shadow-intensity="1.5"
            camera-controls
            auto-rotate
            ar
            ar-modes="webxr scene-viewer quick-look"
            exposure="1.2"
            shadow-softness="0.8"
            style={{ width: '100%', height: '100%', minHeight: '450px' }}
          >
            {/* AR Button */}
            <button 
              slot="ar-button" 
              className="absolute bottom-6 right-6 bg-white border border-[#c4c7c7] text-[#1a1c1a] px-5 py-3 shadow-md font-semibold text-xs tracking-wider flex items-center gap-2 hover:bg-[#1a1c1a] hover:text-white transition-colors duration-300 rounded-none"
            >
              <span className="material-symbols-outlined text-sm">view_in_ar</span>
              XEM TRONG PHÒNG BẠN (AR)
            </button>

            <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md border border-[#c4c7c7] p-4 max-w-xs shadow-sm">
              <p className="text-xs text-[#707973] uppercase tracking-widest mb-1 font-bold">Hướng dẫn xoay 3D</p>
              <p className="text-[11px] text-[#404944] leading-relaxed">
                • Giữ chuột trái & di chuyển để **Xoay vật thể**.<br />
                • Cuộn chuột để **Phóng to / Thu nhỏ**.<br />
                • Giữ chuột phải để **Di chuyển góc nhìn**.
              </p>
            </div>
          </model-viewer>
        </div>

        {/* Right Side: Product Customization Panel */}
        <div className="w-full lg:w-[450px] bg-white border-t lg:border-t-0 lg:border-l border-[#e5e5e1] p-8 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="space-y-8">
            {/* Header info */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#006a50] bg-[#006a50]/10 px-3 py-1.5 rounded-none">
                {selectedProduct.category}
              </span>
              <h1 className="text-3xl font-light tracking-tight text-[#1a1c1a] mt-4">{selectedProduct.name}</h1>
              <p className="text-2xl font-light text-[#707973] mt-2">{formatUSD(selectedProduct.price || 0)}</p>
            </div>

            <hr className="border-[#e5e5e1]" />

            {/* Product Switcher */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#404944] mb-4 font-bold">Chọn sản phẩm trưng bày</h3>
              <div className="grid grid-cols-2 gap-3">
                {products.map((prod) => (
                  <button
                    key={prod._id}
                    onClick={() => handleProductChange(prod)}
                    className={`py-3 px-2 border text-center transition-all duration-300 ${selectedProduct._id === prod._id ? 'border-[#1a1c1a] bg-[#faf9f5] font-semibold' : 'border-[#e5e5e1] hover:border-[#1a1c1a]'}`}
                  >
                    <p className="text-[11px] uppercase tracking-wider truncate">{prod.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Customization swatch */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#404944] mb-4 font-bold">Tùy biến vật liệu & màu sắc</h3>
              <div className="flex gap-4">
                {['Cream', 'Charcoal', 'Sand'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveMaterial(color)}
                    className={`w-10 h-10 rounded-full border border-[#c4c7c7] transition-all relative ${activeMaterial === color ? 'ring-2 ring-offset-2 ring-[#1a1c1a]' : 'hover:scale-105'}`}
                    style={{
                      backgroundColor: color === 'Cream' ? '#FAF9F5' : color === 'Charcoal' ? '#444748' : '#D2B48C'
                    }}
                    title={color}
                  >
                    {activeMaterial === color && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#707973] mt-2">Vật liệu đang chọn: <strong className="text-[#1a1c1a]">{activeMaterial}</strong></p>
            </div>

            {/* Detail Description */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#404944] font-bold">Chi tiết thiết kế</h3>
              <p className="text-sm text-[#404944] leading-relaxed font-light">{baseDescription || 'Chưa có mô tả chi tiết cho tác phẩm này.'}</p>
              <ul className="space-y-2">
                {specsList.map((feat, idx) => (
                  <li key={idx} className="text-xs text-[#707973] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006a50]"></span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-8 border-t border-[#e5e5e1] mt-8 space-y-3">
            <button className="w-full bg-[#1a1c1a] text-white py-4 font-semibold uppercase tracking-widest text-xs hover:bg-[#006a50] transition-colors duration-300">
              THÊM VÀO GIỎ HÀNG
            </button>
            <p className="text-[11px] text-[#707973] text-center">Giao hàng miễn phí toàn quốc cho tất cả sản phẩm 3D Studio</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomBuilder;
