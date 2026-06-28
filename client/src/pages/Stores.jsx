import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const storesStyles = `
  .store-card {
    background: #ffffff;
    border: 1px solid rgba(196, 199, 199, 0.3);
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
  }
  .store-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #000000, #715a3e);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .store-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  }
  .store-card:hover::before {
    transform: scaleX(1);
  }
  .store-avatar {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #000000 0%, #715a3e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Montserrat', sans-serif;
    font-weight: 300;
    font-size: 24px;
    color: #ffffff;
    letter-spacing: 2px;
    flex-shrink: 0;
  }
  .tag-pill {
    display: inline-block;
    padding: 4px 12px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid rgba(196, 199, 199, 0.5);
    color: #444748;
    transition: all 0.3s ease;
  }
  .store-card:hover .tag-pill {
    border-color: #715a3e;
    color: #715a3e;
  }
  .search-container {
    position: relative;
    max-width: 480px;
  }
  .search-container input {
    width: 100%;
    background: rgba(238,238,234,0.5);
    border: 1px solid transparent;
    padding: 14px 20px 14px 48px;
    font-size: 14px;
    transition: all 0.3s ease;
  }
  .search-container input:focus {
    outline: none;
    border-color: #000;
    background: #fff;
  }
  .stores-hero {
    background: linear-gradient(135deg, #1a1c1a 0%, #2f312e 50%, #1a1c1a 100%);
    position: relative;
    overflow: hidden;
  }
  .stores-hero::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(113,90,62,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .fade-up {
    opacity: 0;
    transform: translateY(30px);
    animation: fadeUp 0.8s cubic-bezier(0.21, 0.6, 0.35, 1) forwards;
  }
  .fade-up-delay-1 { animation-delay: 0.1s; }
  .fade-up-delay-2 { animation-delay: 0.2s; }
  .fade-up-delay-3 { animation-delay: 0.3s; }
  @keyframes fadeUp {
    to { opacity: 1; transform: translateY(0); }
  }
  .skeleton {
    background: linear-gradient(90deg, #eeeeea 25%, #e3e3df 50%, #eeeeea 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const Stores = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api('/stores');
        setStores(res.data || []);
      } catch (err) {
        console.error('Failed to fetch stores:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch =
      (store.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.businessType || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || store.businessType === filterType;
    return matchesSearch && matchesFilter;
  });

  const businessTypes = ['All', ...new Set(stores.map(s => s.businessType).filter(Boolean))];

  const isStoreOrAdmin = user && (user.role === 'store' || user.role === 'admin');

  // Default stores for display when DB is empty
  const defaultStores = [
    { _id: 'demo-1', companyName: 'Nordic Essence', fullName: 'Elias Thorne', businessType: 'Furniture Design', philosophy: 'Minimalism meets warmth. Every curve tells a story of Scandinavian heritage and modern comfort.', city: 'Copenhagen', state: 'Denmark', yearsInIndustry: 12 },
    { _id: 'demo-2', companyName: 'Terra Forma Studio', fullName: 'Sienna Mare', businessType: 'Interior Architecture', philosophy: 'We believe in sustainable luxury — where natural materials and artisanal craftsmanship create timeless spaces.', city: 'Milan', state: 'Italy', yearsInIndustry: 8 },
    { _id: 'demo-3', companyName: 'Vance Woodworks', fullName: 'Arthur Vance', businessType: 'Artisan Woodcraft', philosophy: 'Every piece of wood carries the memory of the forest. We honor that story through meticulous handcraft.', city: 'Portland', state: 'Oregon', yearsInIndustry: 15 },
    { _id: 'demo-4', companyName: 'Lumen Lighting Co.', fullName: 'Clara Winslet', businessType: 'Lighting Design', philosophy: 'Light shapes emotion. Our fixtures are sculptural expressions that transform any room into an experience.', city: 'Brooklyn', state: 'New York', yearsInIndustry: 6 },
    { _id: 'demo-5', companyName: 'Marble & Stone Atelier', fullName: 'Giovanni Rossi', businessType: 'Stone Sculpture', philosophy: 'Working with the raw beauty of natural stone, we create functional art that stands the test of centuries.', city: 'Florence', state: 'Tuscany', yearsInIndustry: 20 },
    { _id: 'demo-6', companyName: 'Weave Collective', fullName: 'Anika Patel', businessType: 'Textile Art', philosophy: 'Handwoven traditions meeting contemporary design. Each thread is a bridge between cultures and eras.', city: 'Jaipur', state: 'Rajasthan', yearsInIndustry: 10 },
  ];

  const displayStores = stores.length > 0 ? filteredStores : defaultStores;

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: storesStyles }} />

      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-variant py-4 transition-all duration-700" id="stores-header">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-center gap-8">
            <Link className="flex items-center" to="/">
              <span className="font-display-lg text-lg md:text-xl font-bold tracking-[0.25em] text-primary">LUMINA</span>
            </Link>
            <div className="hidden md:flex gap-8">
              <Link className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-caps text-label-caps" to="/">Home</Link>
              <Link className="text-primary border-b border-primary pb-1 font-label-caps text-label-caps" to="/stores">Curators</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {token ? (
              <>
                <span className="text-sm hidden sm:inline text-on-surface-variant">Hello, <strong>{user?.fullName}</strong></span>
                <Link to="/settings" className="flex items-center text-on-surface hover:opacity-70 transition-opacity" title="Profile Settings">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </Link>
                {isStoreOrAdmin && (
                  <Link to="/store" className="bg-primary text-on-primary text-xs font-label-caps px-4 py-2 hover:bg-secondary transition-colors uppercase tracking-wider">Store Manager</Link>
                )}
                <button onClick={logout} className="font-label-caps text-label-caps border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-all uppercase">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="font-label-caps text-label-caps text-primary hover:opacity-75 uppercase">Sign In</Link>
                <Link to="/register" className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 hover:bg-secondary transition-colors uppercase">Sign Up</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="stores-hero pt-32 pb-20 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto relative z-10">
          <div className="fade-up">
            <span className="font-label-caps text-label-caps text-secondary-fixed-dim uppercase tracking-widest block mb-4">Our Curated Network</span>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-6 font-light tracking-tight">Discover Our Curators</h1>
            <p className="font-body-lg text-body-lg text-white/60 max-w-2xl mb-10">Explore the finest artisans, designers, and studios behind our curated collection. Each curator brings a unique vision to the world of refined living.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center fade-up fade-up-delay-1">
            <div className="search-container flex-1 w-full md:w-auto">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">search</span>
              <input
                type="text"
                placeholder="Search curators by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="font-body-md"
              />
            </div>
            {businessTypes.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {businessTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 text-xs font-label-caps uppercase tracking-wider transition-all ${filterType === type ? 'bg-white text-primary' : 'border border-white/20 text-white/70 hover:border-white/50 hover:text-white'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stores Grid */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-2">Browse</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">All Curators</h2>
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant">{displayStores.length} {displayStores.length === 1 ? 'curator' : 'curators'} found</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="store-card p-8">
                  <div className="flex items-start gap-5 mb-6">
                    <div className="skeleton w-[72px] h-[72px] rounded-sm"></div>
                    <div className="flex-1 space-y-3">
                      <div className="skeleton h-5 w-3/4 rounded"></div>
                      <div className="skeleton h-3 w-1/2 rounded"></div>
                    </div>
                  </div>
                  <div className="skeleton h-16 w-full rounded mb-6"></div>
                  <div className="flex gap-2">
                    <div className="skeleton h-6 w-20 rounded"></div>
                    <div className="skeleton h-6 w-16 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayStores.length === 0 ? (
            <div className="text-center py-32 border border-dashed border-outline-variant/60">
              <span className="material-symbols-outlined text-6xl text-outline mb-4 block">storefront</span>
              <h3 className="font-headline-md text-headline-md text-primary mb-2">No Curators Found</h3>
              <p className="text-on-surface-variant font-body-md">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {displayStores.map((store, index) => (
                <Link
                  to={`/stores/${store._id}`}
                  key={store._id}
                  className={`store-card p-8 cursor-pointer block no-underline text-inherit fade-up fade-up-delay-${(index % 3) + 1}`}
                  id={`store-card-${store._id}`}
                >
                  {/* Store Header */}
                  <div className="flex items-start gap-5 mb-6">
                    <div className="store-avatar rounded-sm">
                      {getInitials(store.companyName || store.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline-md text-lg text-primary font-medium tracking-tight truncate">{store.companyName || store.fullName}</h3>
                      <p className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mt-1">by {store.fullName}</p>
                      {store.city && (
                        <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {store.city}{store.state ? `, ${store.state}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Philosophy */}
                  <p className="text-sm text-on-surface-variant font-light leading-relaxed mb-6 line-clamp-3 italic">
                    "{store.philosophy || 'Crafting excellence with passion and precision.'}"
                  </p>

                  {/* Tags */}
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                    <div className="flex gap-2 flex-wrap">
                      {store.businessType && <span className="tag-pill">{store.businessType}</span>}
                      {store.yearsInIndustry > 0 && <span className="tag-pill">{store.yearsInIndustry}+ yrs</span>}
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-surface-variant mt-16">
        <div className="px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body-md text-body-md tracking-tight text-on-surface-variant">© 2024 AURA ARTEFACTS. REFINED LIVING.</p>
          <div className="flex gap-8">
            <Link to="/" className="font-label-caps text-[10px] tracking-widest text-on-surface-variant hover:text-primary transition-colors">HOME</Link>
            <Link to="/stores" className="font-label-caps text-[10px] tracking-widest text-primary">CURATORS</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Stores;
