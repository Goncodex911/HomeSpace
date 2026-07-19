import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import gsap from 'gsap';

const Catalog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States cho bộ lọc
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Đọc query parameters khi trang được load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    const search = params.get('search');
    if (cat) setFilterCategory(cat);
    if (search) setSearchQuery(search);
  }, [location.search]);

  // Fetch toàn bộ sản phẩm
  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        setLoading(true);
        const res = await api('/items/all');
        setItems(res.data || []);
      } catch (err) {
        console.error(err);
        setError('Không thể kết nối máy chủ để lấy danh sách sản phẩm.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllItems();
  }, []);

  // Kích hoạt hiệu ứng GSAP khi danh sách sản phẩm thay đổi
  useEffect(() => {
    if (!loading && items.length > 0) {
      gsap.fromTo(
        '.catalog-item-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out', overwrite: 'auto' }
      );
    }
  }, [loading, filterCategory, searchQuery, sortBy, items]);

  // Bộ lọc danh mục tĩnh trong thiết kế của Aura Studio
  const CATEGORIES = ['All', 'Living Room', 'Bedroom', 'Office', 'Kitchen', 'Seating', 'Lighting', 'Tables'];

  // Logic lọc và sắp xếp
  const getFilteredItems = () => {
    let result = [...items];

    // 1. Lọc theo Category
    if (filterCategory !== 'All') {
      result = result.filter((item) => {
        const itemCat = (item.category || '').toLowerCase().replace(/\s+/g, '');
        const targetCat = filterCategory.toLowerCase().replace(/\s+/g, '');
        return itemCat.includes(targetCat) || targetCat.includes(itemCat);
      });
    }

    // 2. Lọc theo ô Tìm kiếm
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query)
      );
    }

    // 3. Sắp xếp
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'best-seller') {
      result.sort((a, b) => (a.quantity || 0) - (b.quantity || 0)); // giả lập bán chạy
    } else {
      // Mới nhất (newest)
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1a1c1a] font-sans flex flex-col pt-24 pb-20">
      {/* Navigation Header */}
      <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-[#e5e5e1] fixed top-0 w-full z-50 flex items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link className="font-display-lg text-2xl tracking-tighter text-[#1a1c1a] font-light" to="/">
          AURA STUDIO
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-70 transition-opacity">
            Trang Chủ
          </Link>
          <Link to="/cart" className="text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-70 transition-opacity flex items-center gap-1">
            Giỏ Hàng <span className="material-symbols-outlined text-sm">shopping_cart</span>
          </Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full grid grid-cols-12 gap-gutter mt-10">
        
        {/* Left Filter Sidebar */}
        <aside className="col-span-12 md:col-span-3 space-y-10">
          <div>
            <h3 className="font-label-caps text-xs uppercase tracking-widest text-[#707973] mb-4 font-bold">Tìm kiếm</h3>
            <div className="relative border-b border-[#c4c7c7] pb-2 flex items-center">
              <span className="material-symbols-outlined text-sm text-[#707973] mr-2">search</span>
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-error font-bold">Xóa</button>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-label-caps text-xs uppercase tracking-widest text-[#707973] mb-4 font-bold">Môi Trường & Thiết Kế</h3>
            <div className="flex flex-wrap md:flex-col gap-2 md:gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilterCategory(cat);
                    navigate(`/catalog?category=${cat}`);
                  }}
                  className={`text-left text-xs uppercase tracking-wider py-1 hover:text-[#006a50] transition-colors ${filterCategory === cat ? 'text-[#006a50] font-bold border-b border-[#006a50] md:border-b-0' : 'text-[#707973]'}`}
                >
                  {cat === 'All' ? 'Tất cả sản phẩm' : cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-label-caps text-xs uppercase tracking-widest text-[#707973] mb-4 font-bold">Sắp xếp</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-[#c4c7c7] px-3 py-2.5 text-xs outline-none focus:border-[#1a1c1a]"
            >
              <option value="newest">Mới nhất</option>
              <option value="best-seller">Bán chạy nhất</option>
              <option value="price-low">Giá tăng dần</option>
              <option value="price-high">Giá giảm dần</option>
            </select>
          </div>
        </aside>

        {/* Right Products Feed */}
        <section className="col-span-12 md:col-span-9">
          <div className="flex justify-between items-baseline border-b border-[#e5e5e1] pb-6 mb-10">
            <h1 className="font-display-lg text-3xl font-light tracking-tight">
              {filterCategory === 'All' ? 'Bộ sưu tập Aura' : filterCategory}
            </h1>
            <p className="text-xs text-[#707973] uppercase tracking-wider font-semibold">
              Hiển thị {filteredItems.length} kết quả
            </p>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a1c1a] mb-4"></div>
              <p className="font-medium text-xs uppercase tracking-widest">Đang tải bộ sưu tập...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#c4c7c7] p-10 bg-white">
              <span className="material-symbols-outlined text-4xl text-[#707973] mb-3">inventory_2</span>
              <h3 className="text-sm font-semibold mb-1">Không tìm thấy sản phẩm</h3>
              <p className="text-xs text-[#707973] mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
              <button
                onClick={() => {
                  setFilterCategory('All');
                  setSearchQuery('');
                  setSortBy('newest');
                }}
                className="bg-[#1a1c1a] text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#006a50] transition-all"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {filteredItems.map((product) => (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className="catalog-item-card group cursor-pointer block bg-white border border-[#e5e5e1]/40 p-4 transition-all duration-300 hover:shadow-md"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#fbfbfa] mb-4">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={product.name}
                      src={product.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'}
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {product.model3d && (
                        <span className="bg-[#006a50] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-[10px]">view_in_ar</span> 3D
                        </span>
                      )}
                    </div>
                  </div>
                  <h4 className="font-headline-md text-[16px] mb-1 font-semibold text-[#1a1c1a] group-hover:text-[#006a50] transition-colors truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-[#707973] mb-2 uppercase tracking-widest">{product.category}</p>
                  <p className="text-[#1a1c1a] font-bold text-sm">{product.price?.toLocaleString() || '0'} đ</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Catalog;
