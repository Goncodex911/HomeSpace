import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

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

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const heroImage = document.getElementById('hero-image');
      const studioParallax = document.getElementById('studio-parallax');
      const header = document.getElementById('main-header');
      
      if (heroImage && scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
      
      if (header) {
        if (scrolled > 50) {
          header.classList.add('bg-white/80', 'backdrop-blur-xl', 'border-b', 'border-surface-variant', 'py-4');
          header.classList.remove('py-6');
        } else {
          header.classList.remove('bg-white/80', 'backdrop-blur-xl', 'border-b', 'border-surface-variant', 'py-4');
          header.classList.add('py-6');
        }
      }

      if (studioParallax) {
        studioParallax.style.transform = `translateY(${(scrolled - studioParallax.offsetTop) * 0.1}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (loading) return;

    const observerOptions = {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal, .stagger-container');
    elements.forEach(el => revealObserver.observe(el));

    // Initial check for viewport
    document.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add('active');
    });

    const buttons = document.querySelectorAll('.magnetic-btn');
    const handleMouseMove = (e) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.03)`;
    };
    const handleMouseLeave = (e) => {
      const btn = e.currentTarget;
      btn.style.transform = `translate(0, 0) scale(1)`;
    };

    buttons.forEach(btn => {
      btn.addEventListener('mousemove', handleMouseMove);
      btn.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      elements.forEach(el => revealObserver.unobserve(el));
      buttons.forEach(btn => {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [loading]);

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
    <div className="bg-surface text-on-surface font-body-md overflow-x-hidden min-h-screen">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 transition-all duration-700 py-6" id="main-header">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-center gap-8">
            <Link className="flex items-center" to="/">
              <img 
                alt="AURA Logo" 
                className="h-8 md:h-10" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLsWGZ4LJsyWWw0DXI5i0NfMxhuFuxInq7d6NcREsRQma6gs0mTrWB6h28qpRcABtk3We1-9DLnWO45-C-Nn9EWMy8_BTFIOFWiOu0OTPqs2VcARYqgQa7JT1IyHYAIc1dlp-oQg2GsrEiph-0tKESg5sjj6-1iliWwqoDiztHIVWJswFGI-0xZS1IWK_RMm-5k6whLqsFQLFIpCNa5SpGArlemsLQhRt1oD4t_By4EPNHvJnSg-SiW26vA"
              />
            </Link>
            <div className="hidden md:flex gap-8">
              <a className="text-primary border-b border-primary pb-1 font-label-caps text-label-caps" href="#collection">Living Room</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-caps text-label-caps" href="#collection">Bedroom</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-caps text-label-caps" href="#collection">Kitchen</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-caps text-label-caps" href="#collection">Office</a>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-surface-container/50 px-4 py-2 rounded-full transition-shadow hover:shadow-sm">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-body-md p-0 w-48 focus:outline-none" placeholder="Search collection..." type="text"/>
            </div>

            {token ? (
              <div className="flex items-center gap-4">
                <span className="text-sm hidden sm:inline text-on-surface-variant">Hello, <strong>{user?.fullName}</strong></span>
                <Link to="/settings" className="flex items-center text-on-surface hover:opacity-70 transition-opacity" title="Profile Settings">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="bg-secondary text-on-secondary text-xs font-label-caps px-4 py-2 hover:bg-primary transition-colors uppercase tracking-wider mr-2">
                    Admin Panel
                  </Link>
                )}
                {isStoreOrAdmin ? (
                  <Link to="/store" className="bg-primary text-on-primary text-xs font-label-caps px-4 py-2 hover:bg-secondary transition-colors uppercase tracking-wider">
                    Store Manager
                  </Link>
                ) : (
                  <Link to="/vendor-register" className="border border-secondary text-secondary text-xs font-label-caps px-4 py-2 hover:bg-secondary hover:text-white transition-all uppercase tracking-wider">
                    Apply as Curator
                  </Link>
                )}
                <button onClick={logout} className="font-label-caps text-label-caps border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-all uppercase">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/vendor-register" className="font-label-caps text-label-caps text-secondary hover:text-primary transition-all uppercase tracking-widest text-xs border border-secondary/35 px-4 py-2 hover:bg-secondary hover:text-white">
                  Become a Curator
                </Link>
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
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0 scale-110" id="hero-parallax-container">
          <div className="absolute inset-0 bg-black/25 z-10"></div>
          <img 
            alt="Hero background" 
            className="w-full h-full object-cover will-change-transform" 
            id="hero-image" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiGW6cAcnwTCfjLdDnsd7xZP42CS9rPVYz05A8QbYQHwuXnoSyqNmGv5LLotdbIwcknSe9c5ZFWi4PjpR9zChdImif72E80Xd_bmlxIkKhGOIT69CDB9HKsh2cAJrFwOWr7MCH2o1QfsNnZp8dm759_M2lz4waBM9grw8Ge_IZOBBXms-FSLAM78HZOeqkk3uxzh7rKcgKAsowORhTR05OVgpV8fTh6UL0b0vAO6rLFOgF5dmmpEs1v1RtRVzgZnev6tB8H_gVB--n"
          />
        </div>
        <div className="relative z-20 text-center text-white px-margin-mobile">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-8 tracking-tight reveal font-light">The Art of Refined Living</h1>
          <a href="#collection" className="magnetic-btn inline-block bg-primary text-on-primary px-12 py-5 font-label-caps text-label-caps hover:bg-secondary transition-all reveal uppercase tracking-widest">
            EXPLORE COLLECTION
          </a>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
          <a href="#collection">
            <span className="material-symbols-outlined text-white text-4xl">keyboard_double_arrow_down</span>
          </a>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal stagger-container">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4 stagger-item">
          <div>
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-4">Curation</span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Browse by Environment</h2>
          </div>
          <a className="text-primary font-label-caps text-label-caps border-b border-primary pb-1 hover:text-secondary hover:border-secondary transition-colors" href="#collection">View All Categories</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter h-auto md:h-[800px]">
          {/* Living */}
          <div className="md:col-span-8 relative group overflow-hidden bg-surface-container h-96 md:h-full stagger-item card-hover cursor-pointer">
            <img alt="Living Room" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6y8H-1FldXO_a1GP28ldBv-CKe6H6uj0yXn0kzpdAi7kaCTWhF2f7VzfFTvktIKRY0feUHZUABw50yMb2L7IDpepIkAC70-iKlgbxe8-Qbzx0nG5DijFk3mT5oPD--poV0aXgybrRiCBVu6rzlCMtZ5QfAeNfyAh6Sx_Gz5os0yCh6ws-xEPnsPkG_w22NfcbB95eQVcINk4tAWyXg5CJrcd2M3ryi-ABr-GtoF_-mOi3LX8z6E_C1LId4z7iYF8Rhk9q912_8DGa"/>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500"></div>
            <div className="absolute bottom-10 left-10 text-white transform transition-all duration-500 group-hover:-translate-y-2">
              <h3 className="font-headline-md text-headline-md mb-2">Living Room</h3>
              <p className="font-label-caps text-label-caps opacity-80">124 Items</p>
            </div>
          </div>
          {/* Column */}
          <div className="md:col-span-4 grid grid-rows-2 gap-gutter">
            <div className="relative group overflow-hidden bg-surface-container h-80 md:h-full stagger-item card-hover cursor-pointer">
              <img alt="Bedroom" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv8Sw7SWaAYxVJnlU6H8WzXNpWZJ0lMaUSUY6Be6un3ToFCvIOCU1gxsC8GK73RdI5-TSgxbqmynn2qvoi6s03rHWzh1lR_9P25gWTExY5lG_w9XDm3qaKEQIleeoxbDSLPupKbtDMEKOvJy6mkVtcdPU96BhxF59hfw3E_oZUikatfDEdmQ7ixLZOw5TO8RD7DPo4VcTmkRMhtSqsjrPFpWolXCQCdCZafV7c9FnlJxOUImIf9lTy_jA8lm4XVBRkAX64XZ4UPxWD"/>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500"></div>
              <div className="absolute bottom-8 left-8 text-white transform transition-all duration-500 group-hover:-translate-y-2">
                <h3 className="font-headline-md text-headline-md mb-2">Bedroom</h3>
                <p className="font-label-caps text-label-caps opacity-80">86 Items</p>
              </div>
            </div>
            <div className="relative group overflow-hidden bg-surface-container h-80 md:h-full stagger-item card-hover cursor-pointer">
              <img alt="Office" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnyYkAa3MYuMkb-k37jNtFIp6xcaCs35PeelFquLdfc-jGDuedIW6ZziDMwce-s2ZoOhqZ7f02FuumGYurzCEQXSZH5-c7CdvxNQKlyIHno9PKCi1eGdTQ15zUkz2H1CWHbZoyGECNa4MZP2E1V3E95_KhbFvgZj1LUOevbmp-J51EWIB1h8ge-nr3s1V6LHDOEGnFWje3Yk43rjuMZpdxZU0BX-H5cCXMJpjoFxrUydNdEuxEkEaPQx6JA7C1zHiXi8zlliw4fgjp"/>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500"></div>
              <div className="absolute bottom-8 left-8 text-white transform transition-all duration-500 group-hover:-translate-y-2">
                <h3 className="font-headline-md text-headline-md mb-2">Office</h3>
                <p className="font-label-caps text-label-caps opacity-80">42 Items</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Product Catalog Section */}
      <section id="collection" className="py-32 bg-surface-container-low reveal">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex flex-col items-center mb-16">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-8">Seasonal Selection</h2>
            <div className="flex gap-12 border-b border-surface-variant w-full md:w-auto justify-center">
              <button 
                onClick={() => setActiveCategory('New Arrivals')} 
                className={`font-label-caps text-label-caps pb-4 px-2 transition-all ${activeCategory === 'New Arrivals' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              >
                New Arrivals
              </button>
              <button 
                onClick={() => setActiveCategory('Best Sellers')} 
                className={`font-label-caps text-label-caps pb-4 px-2 transition-all ${activeCategory === 'Best Sellers' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              >
                Best Sellers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter stagger-container">
            {displayProducts.map((product, index) => (
              <div key={product._id || index} className="group cursor-pointer stagger-item card-hover">
                <div className="relative aspect-[3/4] overflow-hidden bg-white mb-6">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt={product.name}
                    src={product.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'}
                  />
                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out flex gap-2">
                    <button className="flex-1 glass-card py-3 font-label-caps text-[10px] hover:bg-primary hover:text-white transition-all border border-outline-variant/35">
                      QUICK ADD
                    </button>
                    <button className="flex-none glass-card w-12 flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-outline-variant/35">
                      <span className="material-symbols-outlined text-sm">view_in_ar</span>
                    </button>
                  </div>
                </div>
                <h4 className="font-headline-md text-[18px] mb-1">{product.name}</h4>
                <p className="text-on-surface-variant font-body-md">${product.price?.toLocaleString() || '0.00'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Teaser */}
      <section className="py-32 bg-primary text-white overflow-hidden reveal">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="relative group">
            <img 
              alt="3D Room Preview" 
              className="w-full h-[500px] object-cover opacity-80 will-change-transform transition-transform duration-[2s] group-hover:scale-110" 
              id="studio-parallax" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcS_cC93TlAgHuOI0P7abpiS6h2tNvVXWlinm6YtRoguLs1fdyAGD24ucZXx64woxQ2K2Nxz1P-KdaPW6E1JpKDuMluouPSYeG3xREU_Ni7H5xAvdzw4J8-lq5ZlSvBisGDfg1P6xIwUTSR7_SRR1zBOWRmFzPUl-ZxOA3xjwgQJuRvWvZeJdk0EjUHJrv-K9xvTr23bhOnh9xuP42rhRaFahIqHcAZfK301x1q8Lq9RfHN3YZEmRvb8FApRTEML2pQatJFJ68Q9Sz"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-transparent"></div>
          </div>
          <div>
            <span className="font-label-caps text-label-caps text-on-primary-container tracking-widest block mb-6">AURA STUDIO</span>
            <h2 className="font-display-lg text-display-lg-mobile md:text-headline-lg mb-8 leading-tight font-light">Visualize your future space in high-fidelity 3D.</h2>
            <p className="font-body-lg text-on-primary-container mb-12 max-w-lg">Our interactive room builder allows you to drag, drop, and configure any piece from our collection directly into your own architecture.</p>
            <button className="magnetic-btn bg-white text-primary px-10 py-4 font-label-caps text-label-caps hover:bg-secondary-fixed transition-all">
              START DESIGNING
            </button>
          </div>
        </div>
      </section>

      {/* Designer Spotlight */}
      <section className="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal stagger-container">
        <div className="text-center mb-24 stagger-item">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">Meet the Artisans</h2>
          <p className="text-on-surface-variant font-body-lg">The visionary minds behind our most iconic pieces.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
          <div className="text-center group stagger-item">
            <div className="w-48 h-48 mx-auto mb-8 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 rounded-full">
              <img alt="Elias Thorne" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEW4DtywODGeHenLJ346LTjB7EwAn1UEvsnckn0C6oW-zkadrDtBQ1XYTAiQJS54y_TFJqG2Qorjy7QmY9x7da6WTT8ZHa0RdOmLLM_aupCj9tc-hzuKtNC5hRa6UiLa17ig3nCDCEaqej70hAUvDFWCR-yVLpGplsExTVvZS6vbLChhKcCzlMfQqTMhIa0a2zGDCOZ6bjAbdI8efIrODZX4C25EgPGc3EdnuSTQERtXlzgCm0xXA35JiK0FZ0WdvApIah5d-LKYow"/>
            </div>
            <h3 className="font-headline-md text-headline-md mb-2">Elias Thorne</h3>
            <p className="font-label-caps text-label-caps text-secondary mb-4">LEAD ARCHITECT</p>
            <p className="text-on-surface-variant font-body-md px-4 italic">"Furniture is the sculpture of the everyday. It must be as functional as it is beautiful."</p>
          </div>
          <div className="text-center group stagger-item">
            <div className="w-48 h-48 mx-auto mb-8 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 rounded-full">
              <img alt="Sienna Mare" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2FA3ztRwUXRbf4S6jnkzbrpY4sWxrR8PRQJWLIrDeWB6ANZLkVdosCn4MMFEYBPqb2RqrCVdhEQVz-KtZ60acVhkeCrYAoHL26EO_a0DGm3WsDd26sLTD-t7sGgTuP9qptgo2ooOs-WomNv31HPsk-ipsei8JnEiCYZWbWG_-qn9eVJqQYLFjoycwS9x8RwlIC2CCEfWfVIaLwKL2zR2stVInd8N9AYa1_GteYOCRjriShQzkpWLUJKDXWY0IpBqtCVkS9UxZOnhA"/>
            </div>
            <h3 className="font-headline-md text-headline-md mb-2">Sienna Mare</h3>
            <p className="font-label-caps text-label-caps text-secondary mb-4">TEXTILE ARTISAN</p>
            <p className="text-on-surface-variant font-body-md px-4 italic">"Sustainability isn't a trend; it's the foundation of modern luxury and lasting quality."</p>
          </div>
          <div className="text-center group stagger-item">
            <div className="w-48 h-48 mx-auto mb-8 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 rounded-full">
              <img alt="Arthur Vance" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHOVCva3Y4fd_fDlLjxp9loaI6GJjHe3yipWmzHCQ2YB6Wh0jhOeIp0n_p4u0fF7_3r9zNQvXk9VDLYW2AM_ndE7vPgT4XvWMzoE7W8FkfDGpP-v8aL_8n2eHf3tib8mRjz-Xt8NWQm-qt7BpPn813Dj-o59LrcQxw9ftgEQL5zz7NFD_ZDEEvuGz-ZBorc_GWP3fR5FUbZbwnI9CnOhqRre45f8uhsSu0MLCiMpUjSy7Y3xTQUOGDTNsmxLQWvyuKerlUqVrQCLOR"/>
            </div>
            <h3 className="font-headline-md text-headline-md mb-2">Arthur Vance</h3>
            <p className="font-label-caps text-label-caps text-secondary mb-4">MASTER CRAFTSMAN</p>
            <p className="text-on-surface-variant font-body-md px-4 italic">"Every piece tells a story of the tree it came from. I just help the wood find its new voice."</p>
          </div>
        </div>
      </section>

      {/* Become a Curator Banner Section */}
      <section className="py-24 bg-surface border-t border-b border-surface-variant/30 reveal">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl space-y-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Partnership Opportunities</span>
            <h2 className="font-display-lg text-4xl md:text-5xl text-primary font-light tracking-tight">Are you a designer or furniture artisan?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Showcase your premium creations to a discerning audience of collectors, architects, and interior designers. Apply to join the Atelier as a curated seller.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link to="/vendor-register" className="magnetic-btn inline-block bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest px-10 py-5 hover:bg-secondary transition-all shadow-xl">
              Apply as Curator
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 bg-surface-container-highest reveal">
        <div className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto text-center">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-6 font-light">Join the Inner Circle</h2>
          <p className="text-on-surface-variant font-body-lg mb-12">Receive early access to new drops, artisan stories, and interior inspiration directly to your inbox.</p>
          <form className="flex flex-col md:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex-1 input-underline">
              <input className="w-full bg-transparent border-0 border-b border-outline focus:border-transparent focus:ring-0 text-body-lg py-4 placeholder:text-outline focus:outline-none" placeholder="Email Address" type="email"/>
            </div>
            <button className="magnetic-btn bg-primary text-on-primary px-10 py-4 font-label-caps text-label-caps hover:bg-secondary transition-all whitespace-nowrap" type="submit">SUBSCRIBE</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-surface-variant mt-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-20 max-w-container-max mx-auto">
          <div className="col-span-1 md:col-span-1">
            <h2 className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary mb-8 font-light">AURA</h2>
            <p className="font-body-md text-on-surface-variant max-w-xs mb-8">Elevating everyday environments through curated architectural furniture and artisanal objects.</p>
          </div>
          <div className="col-span-1">
            <h4 className="font-label-caps text-label-caps text-primary mb-6">EXPLORE</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Collection</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Showrooms</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Artisans</a></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h4 className="font-label-caps text-label-caps text-primary mb-6">SERVICES</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Shipping</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Returns</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Room Builder</a></li>
              <li><Link className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" to="/vendor-register">Become a Curator</Link></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h4 className="font-label-caps text-label-caps text-primary mb-6">LEGAL</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Privacy</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 font-body-md" href="#collection">Terms</a></li>
              <li className="pt-8 flex gap-4">
                <span className="material-symbols-outlined text-primary">language</span>
                <span className="material-symbols-outlined text-primary">shield</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="px-margin-mobile md:px-margin-desktop py-8 border-t border-surface-variant max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body-md text-body-md tracking-tight text-on-surface-variant">© 2024 AURA ARTEFACTS. REFINED LIVING.</p>
          <div className="flex gap-8">
            <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">INSTAGRAM</span>
            <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">PINTEREST</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
