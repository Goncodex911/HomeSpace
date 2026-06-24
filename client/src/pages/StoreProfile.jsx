import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const profileStyles = `
  .profile-hero { background: linear-gradient(135deg, #1a1c1a 0%, #2f312e 50%, #1a1c1a 100%); position: relative; overflow: hidden; }
  .profile-hero::after { content: ''; position: absolute; top: -50%; right: -20%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(113,90,62,0.15) 0%, transparent 70%); pointer-events: none; }
  .tab-btn { position: relative; padding: 12px 24px; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.3s ease; color: #444748; }
  .tab-btn.active { color: #000; }
  .tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #000; }
  .tab-btn:hover { color: #000; }
  .product-card { background: #fff; border: 1px solid rgba(196,199,199,0.3); transition: all 0.5s cubic-bezier(0.23,1,0.32,1); }
  .product-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.06); }
  .cat-card { background: #fff; border: 1px solid rgba(196,199,199,0.3); transition: all 0.4s ease; cursor: pointer; }
  .cat-card:hover { border-color: #715a3e; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.05); }
  .collection-item { position: relative; overflow: hidden; cursor: pointer; }
  .collection-item img { transition: transform 1s cubic-bezier(0.23,1,0.32,1); }
  .collection-item:hover img { transform: scale(1.08); }
  .stat-pill { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); padding: 8px 20px; backdrop-filter: blur(8px); }
  .avatar-lg { width: 96px; height: 96px; background: linear-gradient(135deg, #715a3e 0%, #000 100%); display: flex; align-items: center; justify-content: center; font-family: 'Montserrat'; font-weight: 300; font-size: 32px; color: #fff; }
  .fade-in { animation: fadeIn 0.6s ease forwards; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
`;

const placeholderImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyqhinz1WRpRywtmtoOJl-Xjnv3ZbvvTm2JmT-zPfqdWGUzbgVFW3SuEYFW0ePw7PVS5vIYE_7VQNTj3c6aHRykSS0VW_UsqvEEpGUdASGaUd7L-M6e5YH9inLvruE5x1kjWYNWl0iQ5F79sK_-V5BlV6sQG86UWSsMTyCor4_AxC_C2ByrHcb2UIE6WuvBD88KEASLN3SCe4fJDlQK1KneVSBlqKwy78y896DRnsdyEoj5WkUghaOTPykAgZSg3yGgOVN1AhlEPEm',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCfcBqkWM3r21aDql5wiXK8r1kXDdZYe864IbIjJUXSGVCHKjEyK_UBES8bQM_fStWpzy37DyBN79HsugLf9B74NUc32hFtDivnF4iQMcvK3uAyLhTkfa5JTJ73f2Zl0izH8djHjzV7QHwEJY5FiyxH7sZZhYcBNYlrmU0soGLsyb0lHojl7T_fTfpRH8t9ZuqVqKfuRvXVSRhS2eeStyQk38lfXm3E1M5AxcxbYSvo2Bx9iiENsY4KqiVu2HFJIEq6gf4tU4SySm1k',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAXTVBsxtaabBH2J27cPb743kO_wPxof7yVDuNbR2VmrU1aQwAPxJt05kRu9X5kYNSfHznuKJ2MD2J38XPhwutH9eSDBmXVp3AsoxlmWUVBuywXJt8kDR5nWsPIGUKYRpiV2JdRzf8o5BlHknMcoNjfPBYefT04tn-l_wLr50QqMb2Hny0fwWR3euuGWGI1hu8QkPJHdt6bfwxVo98uI0PicozHCn0Hrct2nr2T5VIVJ_cb6W9sVlVwKY0nihRf6ycr4MUW_ejNTZb7',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAo0TFeq2XW3kTWiVvdUs-6HkTCbtUDvNOShLeF_DrVZPK_L7-f7WGbvvIW5c26zkOkQXCmTD2xHwFZjtwhpNI-aH8vPQ8sORWWRW-ml8W4S4cVHwKzxgJEBOZT2rIl8742AjVzhJwzDD34k7WqMkN-CGxwKshpuodtVVOHe9htIoY46E3UM9Ge257eymDu9vyHgn8Wc3M3M9RUaTnNhW7KUPz3LfQ85fMQZvr92C6skzsJnq4-CJALH2GMUyyNCA5zAT-K20qVLp_R',
];

const defaultItems = [
  { _id: 'd1', name: 'Ether Arc Lounge Chair', price: 1240, quantity: 12, category: 'Seating', description: 'Handcrafted lounge chair with velvet upholstery.' },
  { _id: 'd2', name: 'Orbital Sphere Lamp', price: 450, quantity: 8, category: 'Lighting', description: 'Frosted glass sphere on thin brass stem.' },
  { _id: 'd3', name: 'Monolith Travertine Table', price: 3800, quantity: 4, category: 'Tables', description: 'Heavy travertine marble dining table.' },
  { _id: 'd4', name: 'Stratus Modular Sofa', price: 5600, quantity: 2, category: 'Seating', description: 'Modular sofa in light pebble grey bouclé.' },
  { _id: 'd5', name: 'Cascade Pendant Light', price: 780, quantity: 6, category: 'Lighting', description: 'Multi-tier pendant with crystal drops.' },
  { _id: 'd6', name: 'Horizon Coffee Table', price: 1900, quantity: 3, category: 'Tables', description: 'Walnut and glass coffee table.' },
];

const defaultStore = {
  fullName: 'Elias Thorne', companyName: 'Nordic Essence', businessType: 'Furniture Design',
  philosophy: 'Minimalism meets warmth. Every curve tells a story of Scandinavian heritage and modern comfort. We craft pieces that transcend trends.',
  city: 'Copenhagen', state: 'Denmark', yearsInIndustry: 12, email: 'contact@nordicessence.com', phone: '+45 12 34 56 78',
};

const StoreProfile = () => {
  const { id } = useParams();
  const { user, token, logout } = useContext(AuthContext);
  const [store, setStore] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('collection');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api(`/stores/${id}`);
        setStore(res.data?.store || null);
        setItems(res.data?.items || []);
      } catch (err) {
        console.error('Failed to fetch store:', err);
        if (id?.startsWith('demo-')) { setStore(defaultStore); setItems(defaultItems); }
      } finally { setLoading(false); }
    };
    fetchStore();
  }, [id]);

  const displayStore = store || defaultStore;
  const displayItems = items.length > 0 ? items : defaultItems;
  const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const getCategory = (item) => {
    if (item.category && item.category !== 'Uncategorized') return item.category;
    const match = (item.description || '').match(/Category:\s*(.*)/);
    return match ? match[1].trim() : 'Uncategorized';
  };

  const categories = [...new Set(displayItems.map(i => getCategory(i)))];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="font-light tracking-widest uppercase text-on-surface-variant">Loading Curator Profile...</p>
    </div>
  );

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: profileStyles }} />

      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-variant py-4">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/"><img alt="AURA" className="h-8 md:h-10" src="https://lh3.googleusercontent.com/aida/AP1WRLsWGZ4LJsyWWw0DXI5i0NfMxhuFuxInq7d6NcREsRQma6gs0mTrWB6h28qpRcABtk3We1-9DLnWO45-C-Nn9EWMy8_BTFIOFWiOu0OTPqs2VcARYqgQa7JT1IyHYAIc1dlp-oQg2GsrEiph-0tKESg5sjj6-1iliWwqoDiztHIVWJswFGI-0xZS1IWK_RMm-5k6whLqsFQLFIpCNa5SpGArlemsLQhRt1oD4t_By4EPNHvJnSg-SiW26vA" /></Link>
            <div className="hidden md:flex gap-8">
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps" to="/">Home</Link>
              <Link className="text-primary border-b border-primary pb-1 font-label-caps text-label-caps" to="/stores">Curators</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {token ? (
              <>
                <Link to="/settings"><span className="material-symbols-outlined text-2xl text-on-surface hover:opacity-70">person</span></Link>
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

      {/* Hero */}
      <section className="profile-hero pt-28 pb-16 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto relative z-10">
          <Link to="/stores" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-8 font-label-caps text-label-caps">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to All Curators
          </Link>
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="avatar-lg rounded-sm flex-shrink-0">{getInitials(displayStore.companyName || displayStore.fullName)}</div>
            <div className="flex-1">
              <h1 className="font-display-lg text-display-lg-mobile md:text-headline-lg text-white font-light mb-2">{displayStore.companyName || displayStore.fullName}</h1>
              <p className="font-label-caps text-label-caps text-secondary-fixed-dim uppercase tracking-widest mb-4">by {displayStore.fullName} · {displayStore.businessType}</p>
              <p className="text-white/60 font-body-md max-w-2xl leading-relaxed italic mb-6">"{displayStore.philosophy}"</p>
              <div className="flex flex-wrap gap-3">
                {displayStore.city && <span className="stat-pill text-white/80 font-label-caps text-[10px] flex items-center gap-1.5 rounded-sm"><span className="material-symbols-outlined text-[14px]">location_on</span>{displayStore.city}, {displayStore.state}</span>}
                {displayStore.yearsInIndustry > 0 && <span className="stat-pill text-white/80 font-label-caps text-[10px] flex items-center gap-1.5 rounded-sm"><span className="material-symbols-outlined text-[14px]">workspace_premium</span>{displayStore.yearsInIndustry}+ Years</span>}
                <span className="stat-pill text-white/80 font-label-caps text-[10px] flex items-center gap-1.5 rounded-sm"><span className="material-symbols-outlined text-[14px]">inventory_2</span>{displayItems.length} Products</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[65px] z-40 bg-white border-b border-surface-variant">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex gap-0">
          {['collection', 'product', 'category'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn font-label-caps ${activeTab === tab ? 'active' : ''}`}>
              {tab === 'collection' ? 'Collection' : tab === 'product' ? 'Products' : 'Product Category'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">

        {/* COLLECTION TAB */}
        {activeTab === 'collection' && (
          <div className="fade-in space-y-12">
            <div>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-2">Curated Showcase</span>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Featured Collection</h2>
              <p className="text-on-surface-variant">A visual gallery of {displayStore.companyName || displayStore.fullName}'s finest creations.</p>
            </div>
            {displayItems.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-outline-variant/60"><span className="material-symbols-outlined text-5xl text-outline mb-3 block">collections</span><p className="text-on-surface-variant">No collection items yet.</p></div>
            ) : (
              <>
                {/* Hero grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                  <div className="md:col-span-8 collection-item h-[500px] bg-surface-container group">
                    <img className="w-full h-full object-cover" src={placeholderImages[0]} alt={displayItems[0]?.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8 text-white"><h3 className="font-headline-md text-headline-md mb-1">{displayItems[0]?.name}</h3><p className="font-label-caps text-label-caps opacity-70">${displayItems[0]?.price?.toLocaleString()}</p></div>
                  </div>
                  <div className="md:col-span-4 grid grid-rows-2 gap-gutter">
                    {displayItems.slice(1, 3).map((item, i) => (
                      <div key={item._id} className="collection-item h-[238px] bg-surface-container group">
                        <img className="w-full h-full object-cover" src={placeholderImages[i + 1]} alt={item.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white"><h4 className="font-headline-md text-[18px] mb-1">{item.name}</h4><p className="font-label-caps text-[10px] opacity-70">${item.price?.toLocaleString()}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* More items */}
                {displayItems.length > 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
                    {displayItems.slice(3).map((item, i) => (
                      <div key={item._id} className="collection-item aspect-square bg-surface-container group">
                        <img className="w-full h-full object-cover" src={placeholderImages[(i + 3) % placeholderImages.length]} alt={item.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 text-white"><h4 className="text-sm font-medium">{item.name}</h4><p className="text-[10px] opacity-70">${item.price?.toLocaleString()}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'product' && (
          <div className="fade-in space-y-10">
            <div className="flex justify-between items-end">
              <div>
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-2">Catalog</span>
                <h2 className="font-headline-lg text-headline-lg text-primary">All Products</h2>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">{displayItems.length} items</span>
            </div>
            {displayItems.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-outline-variant/60"><span className="material-symbols-outlined text-5xl text-outline mb-3 block">inventory_2</span><p className="text-on-surface-variant">No products listed yet.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
                {displayItems.map((item, i) => {
                  const baseDesc = (item.description || '').split('\n\n---\n')[0];
                  return (
                    <div key={item._id} className="product-card group">
                      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container">
                        <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={placeholderImages[i % placeholderImages.length]} alt={item.name} />
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 text-[9px] font-bold uppercase ${item.quantity > 0 ? 'bg-white/90 text-primary' : 'bg-error text-white'}`}>{item.quantity > 0 ? 'In Stock' : 'Sold Out'}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest">{getCategory(item)}</span>
                        <h4 className="font-headline-md text-[16px] text-primary mt-1 mb-2 truncate">{item.name}</h4>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{baseDesc || 'Premium artisan piece.'}</p>
                        <div className="flex justify-between items-center pt-3 border-t border-outline-variant/20">
                          <span className="font-bold text-primary">${item.price?.toLocaleString() || '0'}</span>
                          <span className="text-[10px] text-on-surface-variant">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PRODUCT CATEGORY TAB */}
        {activeTab === 'category' && (
          <div className="fade-in space-y-10">
            <div>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-2">Organization</span>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Product Categories</h2>
              <p className="text-on-surface-variant">Browse products organized by their category.</p>
            </div>
            {categories.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-outline-variant/60"><span className="material-symbols-outlined text-5xl text-outline mb-3 block">category</span><p className="text-on-surface-variant">No categories available.</p></div>
            ) : (
              <div className="space-y-16">
                {categories.map(cat => {
                  const catItems = displayItems.filter(item => getCategory(item) === cat);
                  const icons = { Seating: 'chair', Tables: 'table_restaurant', Lighting: 'light', Textiles: 'texture', Storage: 'shelves', Uncategorized: 'category' };
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-outline-variant/30">
                        <div className="w-12 h-12 bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-secondary">{icons[cat] || 'category'}</span></div>
                        <div><h3 className="font-headline-md text-headline-md text-primary">{cat}</h3><p className="text-xs text-on-surface-variant">{catItems.length} {catItems.length === 1 ? 'product' : 'products'}</p></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
                        {catItems.map((item, i) => {
                          const baseDesc = (item.description || '').split('\n\n---\n')[0];
                          return (
                            <div key={item._id} className="product-card group">
                              <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
                                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={placeholderImages[i % placeholderImages.length]} alt={item.name} />
                              </div>
                              <div className="p-5">
                                <h4 className="font-headline-md text-[16px] text-primary mb-1 truncate">{item.name}</h4>
                                <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{baseDesc || 'Artisan crafted piece.'}</p>
                                <div className="flex justify-between items-center pt-3 border-t border-outline-variant/20">
                                  <span className="font-bold text-primary">${item.price?.toLocaleString() || '0'}</span>
                                  <span className={`text-[10px] font-bold uppercase ${item.quantity > 0 ? 'text-green-600' : 'text-error'}`}>{item.quantity > 0 ? 'Available' : 'Sold Out'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

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

export default StoreProfile;
