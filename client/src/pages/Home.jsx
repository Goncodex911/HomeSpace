import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Home = () => {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('New Arrivals');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api('/items/all');
        setItems(res.data || []);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Standard premium placeholders in case DB is empty
  const defaultProducts = [
    {
      _id: 'default-1',
      name: 'Ether Arc Lounge Chair',
      price: 1240,
      description: 'Close up product shot of a minimalist wooden chair with sharp architectural lines.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyqhinz1WRpRywtmtoOJl-Xjnv3ZbvvTm2JmT-zPfqdWGUzbgVFW3SuEYFW0ePw7PVS5vIYE_7VQNTj3c6aHRykSS0VW_UsqvEEpGUdASGaUd7L-M6e5YH9inLvruE5x1kjWYNWl0iQ5F79sK_-V5BlV6sQG86UWSsMTyCor4_AxC_C2ByrHcb2UIE6WuvBD88KEASLN3SCe4fJDlQK1KneVSBlqKwy78y896DRnsdyEoj5WkUghaOTPykAgZSg3yGgOVN1AhlEPEm'
    },
    {
      _id: 'default-2',
      name: 'Orbital Sphere Lamp',
      price: 450,
      description: 'A modern minimalist floor lamp with a thin black metal stem and a spherical frosted glass shade.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfcBqkWM3r21aDql5wiXK8r1kXDdZYe864IbIjJUXSGVCHKjEyK_UBES8bQM_fStWpzy37DyBN79HsugLf9B74NUc32hFtDivnF4iQMcvK3uAyLhTkfa5JTJ73f2Zl0izH8djHjzV7QHwEJY5FiyxH7sZZhYcBNYlrmU0soGLsyb0lHojl7T_fTfpRH8t9ZuqVqKfuRvXVSRhS2eeStyQk38lfXm3E1M5AxcxbYSvo2Bx9iiENsY4KqiVu2HFJIEq6gf4tU4SySm1k'
    },
    {
      _id: 'default-3',
      name: 'Monolith Travertine Table',
      price: 3800,
      description: 'A heavy travertine marble dining table with thick cylindrical legs.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXTVBsxtaabBH2J27cPb743kO_wPxof7yVDuNbR2VmrU1aQwAPxJt05kRu9X5kYNSfHznuKJ2MD2J38XPhwutH9eSDBmXVp3AsoxlmWUVBuywXJt8kDR5nWsPIGUKYRpiV2JdRzf8o5BlHknMcoNjfPBYefT04tn-l_wLr50QqMb2Hny0fwWR3euuGWGI1hu8QkPJHdt6bfwxVo98uI0PicozHCn0Hrct2nr2T5VIVJ_cb6W9sVlVwKY0nihRf6ycr4MUW_ejNTZb7'
    },
    {
      _id: 'default-4',
      name: 'Stratus Modular Sofa',
      price: 5600,
      description: 'A contemporary modular sofa system in a light pebble grey bouclé fabric.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo0TFeq2XW3kTWiVvdUs-6HkTCbtUDvNOShLeF_DrVZPK_L7-f7WGbvvIW5c26zkOkQXCmTD2xHwFZjtwhpNI-aH8vPQ8sORWWRW-ml8W4S4cVHwKzxgJEBOZT2rIl8742AjVzhJwzDD34k7WqMkN-CGxwKshpuodtVVOHe9htIoY46E3UM9Ge257eymDu9vyHgn8Wc3M3M9RUaTnNhW7KUPz3LfQ85fMQZvr92C6skzsJnq4-CJALH2GMUyyNCA5zAT-K20qVLp_R'
    }
  ];

  const displayProducts = items.length > 0 ? items : defaultProducts;

  const isStoreOrAdmin = user && (user.role === 'store' || user.role === 'admin');

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-surface-variant top-0 sticky z-50">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto h-20">
          <div className="flex items-center gap-8">
            <Link className="flex items-center font-headline-md text-headline-md tracking-tighter font-light text-primary" to="/">
              Lumina
            </Link>
            <div className="hidden md:flex gap-8">
              <span className="text-primary border-b border-primary pb-1 font-label-caps text-label-caps cursor-pointer">Living Room</span>
              <span className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps cursor-pointer">Bedroom</span>
              <span className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps cursor-pointer">Kitchen</span>
              <span className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps cursor-pointer">Office</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-surface-container px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-body-md p-0 w-48 focus:outline-none" placeholder="Search collection..." type="text"/>
            </div>

            {token ? (
              <div className="flex items-center gap-4">
                <span className="text-sm hidden sm:inline text-on-surface-variant">Hello, <strong>{user?.fullName}</strong></span>
                {isStoreOrAdmin && (
                  <Link to="/store" className="bg-primary text-on-primary text-xs font-label-caps px-4 py-2 hover:bg-secondary transition-colors uppercase tracking-wider">
                    Store Manager
                  </Link>
                )}
                <button onClick={logout} className="font-label-caps text-label-caps border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-all uppercase">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-label-caps text-label-caps text-primary hover:opacity-75 uppercase">
                  Sign In
                </Link>
                <Link to="/register" className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 hover:bg-secondary transition-colors uppercase">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative h-[calc(100vh-80px)] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/30 z-10"></div>
          <img 
            className="w-full h-full object-cover" 
            alt="Atelier living room setup"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiGW6cAcnwTCfjLdDnsd7xZP42CS9rPVYz05A8QbYQHwuXnoSyqNmGv5LLotdbIwcknSe9c5ZFWi4PjpR9zChdImif72E80Xd_bmlxIkKhGOIT69CDB9HKsh2cAJrFwOWr7MCH2o1QfsNnZp8dm759_M2lz4waBM9grw8Ge_IZOBBXms-FSLAM78HZOeqkk3uxzh7rKcgKAsowORhTR05OVgpV8fTh6UL0b0vAO6rLFOgF5dmmpEs1v1RtRVzgZnev6tB8H_gVB--n"
          />
        </div>
        <div className="relative z-20 text-center text-white px-margin-mobile">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-8 tracking-tight font-light">The Art of Refined Living</h1>
          <a href="#collection" className="inline-block bg-primary text-on-primary px-12 py-5 font-label-caps text-label-caps hover:bg-secondary transition-all duration-300 transform hover:scale-105 uppercase tracking-widest">
            EXPLORE COLLECTION
          </a>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-4">Curation</span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Browse by Environment</h2>
          </div>
          <span className="text-primary font-label-caps text-label-caps border-b border-primary pb-1 cursor-pointer">View All Categories</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter h-auto md:h-[600px]">
          {/* Living Room */}
          <div className="md:col-span-8 relative group overflow-hidden bg-surface-container h-80 md:h-full cursor-pointer">
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Living Room Category" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6y8H-1FldXO_a1GP28ldBv-CKe6H6uj0yXn0kzpdAi7kaCTWhF2f7VzfFTvktIKRY0feUHZUABw50yMb2L7IDpepIkAC70-iKlgbxe8-Qbzx0nG5DijFk3mT5oPD--poV0aXgybrRiCBVu6rzlCMtZ5QfAeNfyAh6Sx_Gz5os0yCh6ws-xEPnsPkG_w22NfcbB95eQVcINk4tAWyXg5CJrcd2M3ryi-ABr-GtoF_-mOi3LX8z6E_C1LId4z7iYF8Rhk9q912_8DGa"/>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute bottom-10 left-10 text-white">
              <h3 className="font-headline-md text-headline-md mb-2">Living Room</h3>
              <p className="font-label-caps text-label-caps opacity-80">124 Items</p>
            </div>
          </div>
          {/* Bedroom */}
          <div className="md:col-span-4 relative group overflow-hidden bg-surface-container h-80 md:h-full cursor-pointer">
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Bedroom Category" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv8Sw7SWaAYxVJnlU6H8WzXNpWZJ0lMaUSUY6Be6un3ToFCvIOCU1gxsC8GK73RdI5-TSgxbqmynn2qvoi6s03rHWzh1lR_9P25gWTExY5lG_w9XDm3qaKEQIleeoxbDSLPupKbtDMEKOvJy6mkVtcdPU96BhxF59hfw3E_oZUikatfDEdmQ7ixLZOw5TO8RD7DPo4VcTmkRMhtSqsjrPFpWolXCQCdCZafV7c9FnlJxOUImIf9lTy_jA8lm4XVBRkAX64XZ4UPxWD"/>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute bottom-10 left-10 text-white">
              <h3 className="font-headline-md text-headline-md mb-2">Bedroom</h3>
              <p className="font-label-caps text-label-caps opacity-80">86 Items</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Product Catalog Section */}
      <section id="collection" className="py-32 bg-surface-container-low">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex flex-col items-center mb-16">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-2">Inventory Catalog</span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-8">Seasonal Selection</h2>
            <div className="flex gap-12 border-b border-surface-variant w-full md:w-auto justify-center">
              <button 
                onClick={() => setActiveCategory('New Arrivals')} 
                className={`font-label-caps text-label-caps pb-4 px-2 transition-all ${activeCategory === 'New Arrivals' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
              >
                New Arrivals
              </button>
              <button 
                onClick={() => setActiveCategory('Best Sellers')} 
                className={`font-label-caps text-label-caps pb-4 px-2 transition-all ${activeCategory === 'Best Sellers' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
              >
                Best Sellers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {displayProducts.map((product) => (
              <div key={product._id} className="group cursor-pointer">
                <div className="relative aspect-[3/4] overflow-hidden bg-white mb-6">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    alt={product.name}
                    src={product.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                    <button className="flex-1 bg-white/95 backdrop-blur-md py-3 font-label-caps text-[10px] hover:bg-primary hover:text-white transition-colors border border-outline-variant">
                      QUICK ADD
                    </button>
                    <button className="flex-none bg-white/95 backdrop-blur-md w-12 flex items-center justify-center hover:bg-primary hover:text-white transition-colors border border-outline-variant">
                      <span className="material-symbols-outlined text-sm">view_in_ar</span>
                    </button>
                  </div>
                </div>
                <h4 className="font-headline-md text-base text-primary mb-1">{product.name}</h4>
                <p className="text-on-surface-variant font-body-md">${product.price?.toLocaleString() || '0.00'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Designer Spotlight Section */}
      <section className="py-32 bg-primary text-white overflow-hidden">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <img 
              className="w-full h-[400px] object-cover opacity-60" 
              alt="Blueprint design layout" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcS_cC93TlAgHuOI0P7abpiS6h2tNvVXWlinm6YtRoguLs1fdyAGD24ucZXx64woxQ2K2Nxz1P-KdaPW6E1JpKDuMluouPSYeG3xREU_Ni7H5xAvdzw4J8-lq5ZlSvBisGDfg1P6xIwUTSR7_SRR1zBOWRmFzPUl-ZxOA3xjwgQJuRvWvZeJdk0EjUHJrv-K9xvTr23bhOnh9xuP42rhRaFahIqHcAZfK301x1q8Lq9RfHN3YZEmRvb8FApRTEML2pQatJFJ68Q9Sz"
            />
          </div>
          <div className="space-y-8">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.2em]">Atelier Studio</span>
            <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg text-white font-light leading-tight">Designed for Life, Crafted for Generations.</h2>
            <p className="text-on-tertiary-container font-light leading-relaxed">
              Every piece in our catalog is carefully selected, balancing architectural integrity with modern functionality. We coordinate with elite design houses to produce unique, sustainable furniture.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white py-12 px-margin-mobile md:px-margin-desktop border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="font-label-caps text-label-caps text-on-surface-variant">
          © 2024 Lumina Marketplace. All rights reserved.
        </div>
        <div className="flex gap-margin-mobile">
          <span className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Contact</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
