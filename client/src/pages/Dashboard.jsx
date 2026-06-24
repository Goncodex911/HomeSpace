import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const dashboardStyles = `
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
  }
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(229, 229, 225, 1);
  }
  .bento-card {
    background: #ffffff;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bento-card:hover {
    transform: translateY(-4px);
    box-shadow: 0px 10px 30px rgba(0,0,0,0.04);
  }
  .page-content-transition {
    animation: fadeInTranslate 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  @keyframes fadeInTranslate {
    from { 
      opacity: 0; 
      transform: translateX(10px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  .nav-link-active {
    position: relative;
    background-color: #e8e8e4;
    color: #000000;
    font-weight: 700;
  }
  .nav-link-active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: #000000;
  }
  .nav-link {
    transition: all 0.3s ease;
  }
  .image-dropzone {
    transition: all 0.3s ease;
    border: 1px dashed #747878;
  }
  .image-dropzone:hover {
    border-color: #000000;
    background-color: rgba(0,0,0,0.02);
  }
  input:focus, textarea:focus, select:focus {
    outline: none !important;
    border-bottom: 1px solid #000000 !important;
    box-shadow: none !important;
  }
`;

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState('overview'); // overview, inventory, add_product
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Seating');
  const [material, setMaterial] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [availability, setAvailability] = useState('In Stock');
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/items/my');
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setQuantity('');
    setCategory('Seating');
    setMaterial('');
    setWidth('');
    setHeight('');
    setDepth('');
    setAvailability('In Stock');
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setName(item.name);
    setPrice(item.price || '');
    setQuantity(item.quantity !== undefined ? item.quantity : '');
    
    // Parse specs if present in description
    const desc = item.description || '';
    const parts = desc.split('\n\n---\n');
    const baseDesc = parts[0];
    setDescription(baseDesc);

    let itemCategory = 'Seating';
    let itemMaterial = '';
    let itemWidth = '';
    let itemHeight = '';
    let itemDepth = '';
    let itemAvailability = item.quantity > 0 ? 'In Stock' : 'Made to Order';

    if (parts.length > 1) {
      const specText = parts[1];
      const catMatch = specText.match(/Category:\s*(.*)/);
      const matMatch = specText.match(/Material:\s*(.*)/);
      const dimMatch = specText.match(/Dimensions:\s*(\w*)w\s*x\s*(\w*)h\s*x\s*(\w*)d\s*cm/);
      const availMatch = specText.match(/Availability:\s*(.*)/);

      if (catMatch) itemCategory = catMatch[1].trim();
      if (matMatch) itemMaterial = matMatch[1].trim();
      if (dimMatch) {
        itemWidth = dimMatch[1];
        itemHeight = dimMatch[2];
        itemDepth = dimMatch[3];
      }
      if (availMatch) itemAvailability = availMatch[1].trim();
    }

    setCategory(itemCategory);
    setMaterial(itemMaterial);
    setWidth(itemWidth);
    setHeight(itemHeight);
    setDepth(itemDepth);
    setAvailability(itemAvailability);
    setView('add_product');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item from the catalog?')) return;
    setError('');
    setSuccess('');

    try {
      await api(`/items/delete/${id}`, {
        method: 'DELETE'
      });
      setSuccess('Product successfully removed from catalog.');
      fetchItems();
    } catch (err) {
      setError(err.message || 'Delete operation failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !price || quantity === '') {
      setError('Product Name, Price, and Quantity are required fields.');
      return;
    }

    // Append specifications to description in a parser-friendly format
    let finalDescription = description;
    if (category || material || width || height || depth || availability) {
      finalDescription += `\n\n---\nCategory: ${category}\nMaterial: ${material}\nDimensions: ${width}w x ${height}h x ${depth}d cm\nAvailability: ${availability}`;
    }

    try {
      if (editingId) {
        await api(`/items/update/${editingId}`, {
          method: 'PUT',
          body: {
            name,
            description: finalDescription,
            price: parseFloat(price),
            quantity: parseInt(quantity)
          }
        });
        setSuccess('Product updated successfully.');
      } else {
        await api('/items/add', {
          method: 'POST',
          body: {
            name,
            description: finalDescription,
            price: parseFloat(price),
            quantity: parseInt(quantity)
          }
        });
        setSuccess('Product published successfully to catalog.');
      }

      resetForm();
      setView('inventory');
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to save product details.');
    }
  };

  const handleDiscard = () => {
    resetForm();
    setView('inventory');
  };

  // Helper calculations for Overview tab
  const lowStockCount = items.filter(item => item.quantity < 5).length;
  
  // Format to standard items list or mock defaults if none
  const defaultItems = [
    { name: 'Ether Arc Lounge Chair', price: 1240, quantity: 12, description: 'Velvet' },
    { name: 'Orbital Sphere Lamp', price: 450, quantity: 2, description: 'Brass' },
    { name: 'Monolith Travertine Table', price: 3800, quantity: 4, description: 'Marble' },
    { name: 'Stratus Modular Sofa', price: 5600, quantity: 1, description: 'Wool' },
    { name: 'Velvet Dining Chair', price: 850, quantity: 0, description: 'Velvet' },
    { name: 'Brass Lamp', price: 320, quantity: 8, description: 'Brass' }
  ];

  const displayItems = items.length > 0 ? items : defaultItems;
  const maxPrice = Math.max(...displayItems.map(i => i.price || 1));

  // Search logic
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:flex-row relative">
      <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-surface-container-low border-r border-outline-variant/50 py-8 z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 mb-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-white">storefront</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface leading-tight">Lumina</h1>
              <p className="font-label-caps text-[10px] tracking-widest text-on-surface-variant opacity-60">Vendor Portal</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => { setView('overview'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 pl-5 py-3 nav-link ${view === 'overview' ? 'nav-link-active' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-caps text-label-caps">Overview</span>
          </button>
          
          <button 
            onClick={() => { setView('inventory'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 pl-5 py-3 nav-link ${view === 'inventory' ? 'nav-link-active' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="font-label-caps text-label-caps">Inventory</span>
          </button>

          <a 
            href="/orders" 
            onClick={(e) => { e.preventDefault(); alert('Orders panel integration coming soon.'); }}
            className="w-full flex items-center gap-4 pl-5 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="font-label-caps text-label-caps">Orders</span>
          </a>

          <a 
            href="/customers" 
            onClick={(e) => { e.preventDefault(); alert('Customers feed coming soon.'); }}
            className="w-full flex items-center gap-4 pl-5 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-caps text-label-caps">Customers</span>
          </a>
        </nav>

        <div className="mt-auto px-6 pt-8 border-t border-outline-variant/30">
          <button 
            onClick={() => { resetForm(); setView('add_product'); setIsMobileMenuOpen(false); }}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-sm hover:bg-secondary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mb-6 shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Product
          </button>

          <div className="space-y-4">
            <Link className="flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors" to="/settings">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-label-caps text-label-caps">Settings</span>
            </Link>
            <button 
              onClick={logout} 
              className="w-full text-left flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-caps text-label-caps">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 w-full glass flex justify-between items-center px-6 md:px-margin-desktop py-4 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-primary flex items-center">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="font-headline-md text-headline-md tracking-widest text-on-background capitalize">
              {view === 'overview' && 'Store Overview'}
              {view === 'inventory' && 'Inventory Catalog'}
              {view === 'add_product' && (editingId ? 'Edit Product' : 'New Catalog Item')}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            {view === 'inventory' && (
              <div className="relative hidden lg:block">
                <input 
                  className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary py-2 px-10 rounded-sm w-64 text-sm font-body-md transition-all duration-300" 
                  placeholder="Search products..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">CURATOR PROFILE</p>
                <p className="font-bold text-sm text-primary">{user?.fullName}</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
                <img 
                  alt="Admin Profile Avatar" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIw47cnP26s6sA2rw6KSRaMIV6KzjQqdj5IEyBh8ZJVZCJjNHXH1_fAbLhmqHcgsfb5iYcUwOzSgf7xvQJhPOpGZi45BZQkf3omG39mAObKscJpllQBps3DQeBsiDMHOWepvivWNwkvhWblXP5E7nJiM4uKAVS2BF2KO839R9uDkZX5TIi_BLAIoaJ5EfQreiWn4753MvC3EOtqNn6BKAbRHQe4B5FJwWbd2nOS2tBxiLS4mFvGQRJlZDI0x0Els2Z_wSTp7_sYa_G"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel View Canvas */}
        <div className="page-content-transition flex-1 px-6 md:px-margin-desktop py-12 space-y-12">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container border border-error/20 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-secondary-container text-on-secondary-container border border-secondary/20 text-sm">
              {success}
            </div>
          )}

          {/* VIEW: OVERVIEW */}
          {view === 'overview' && (
            <div className="space-y-12 animate-fade-in">
              {/* Statistics Section */}
              <section className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-2 block">Insights</span>
                    <h3 className="font-display-lg text-4xl text-primary font-light">My Store Statistics</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-4 py-2 border border-outline-variant text-label-caps font-label-caps rounded-sm text-xs bg-white">Realtime Data</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                  {/* Daily Sales */}
                  <div className="bento-card p-8 border border-outline-variant/30 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">Daily Sales</span>
                      <span className="material-symbols-outlined text-secondary">trending_up</span>
                    </div>
                    <div>
                      <span className="font-display-lg text-4xl leading-none font-light text-primary">$12,480</span>
                      <p className="text-xs text-on-surface-variant mt-2">
                        <span className="text-green-600 font-semibold">+12%</span> from yesterday
                      </p>
                    </div>
                  </div>

                  {/* Order Count */}
                  <div className="bento-card p-8 border border-outline-variant/30 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">Catalog items</span>
                      <span className="material-symbols-outlined text-outline">inventory_2</span>
                    </div>
                    <div>
                      <span className="font-display-lg text-4xl leading-none font-light text-primary">{String(items.length).padStart(2, '0')}</span>
                      <p className="text-xs text-on-surface-variant mt-2">Active catalog items</p>
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  <div className={`bento-card p-8 border border-outline-variant/30 flex flex-col justify-between h-48 transition-colors ${lowStockCount > 0 ? 'bg-red-50/50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">Low Stock Alerts</span>
                      <span className={`material-symbols-outlined ${lowStockCount > 0 ? 'text-error animate-pulse' : 'text-outline'}`}>
                        {lowStockCount > 0 ? 'warning' : 'check_circle'}
                      </span>
                    </div>
                    <div>
                      <span className={`font-display-lg text-4xl leading-none font-light ${lowStockCount > 0 ? 'text-error' : 'text-primary'}`}>
                        {String(lowStockCount).padStart(2, '0')}
                      </span>
                      <p className="text-xs text-on-surface-variant mt-2">Items require stock attention</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Performance Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                {/* Bar Chart representing relative pricing scale of items */}
                <div className="lg:col-span-2 bento-card p-8 border border-outline-variant/30 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-1 block">Analytics</span>
                      <h4 className="font-headline-md text-headline-md">Inventory Pricing Scale</h4>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">equalizer</span>
                  </div>

                  <div className="h-64 flex items-end justify-between gap-4 px-4 pt-8 border-b border-outline-variant/20 pb-2">
                    {displayItems.slice(0, 6).map((item, index) => {
                      const heightPercent = maxPrice > 0 ? Math.round(((item.price || 0) / maxPrice) * 100) : 40;
                      return (
                        <div key={item._id || index} className="flex flex-col items-center gap-4 flex-1 group h-full justify-end">
                          <div 
                            className="w-full bg-surface-container-highest group-hover:bg-primary transition-all duration-500 rounded-t-sm"
                            style={{ height: `${Math.max(heightPercent, 10)}%` }}
                          ></div>
                          <span className="font-label-caps text-[10px] text-center opacity-60 truncate w-16" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback Widget */}
                <div className="bento-card p-8 border border-outline-variant/30 flex flex-col justify-between">
                  <h4 className="font-headline-md text-headline-md mb-6">Recent Feedback</h4>
                  <div className="space-y-6 flex-1 overflow-y-auto max-h-[260px] pr-2">
                    <div className="border-b border-outline-variant/30 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-secondary scale-75 -ml-4">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <span className="font-label-caps text-[10px] text-on-surface-variant">2 hours ago</span>
                      </div>
                      <p className="text-sm italic">"The craftsmanship of the Oblique Chair is unmatched. Exquisite."</p>
                      <p className="text-[11px] font-bold mt-2 text-primary">— Julian V.</p>
                    </div>

                    <div className="border-b border-outline-variant/30 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-secondary scale-75 -ml-4">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="material-symbols-outlined">star</span>
                        </div>
                        <span className="font-label-caps text-[10px] text-on-surface-variant">5 hours ago</span>
                      </div>
                      <p className="text-sm italic">"Beautiful Travertine table, but shipping took longer than expected."</p>
                      <p className="text-[11px] font-bold mt-2 text-primary">— Elena R.</p>
                    </div>
                  </div>
                  <button className="w-full mt-4 text-center text-label-caps font-label-caps text-secondary hover:underline transition-all">
                    View All Reviews
                  </button>
                </div>
              </section>

              {/* Recent Orders Section */}
              <section className="bento-card border border-outline-variant/30 overflow-hidden">
                <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-white">
                  <h4 className="font-headline-md text-headline-md">Recent Orders</h4>
                  <span className="font-label-caps text-xs text-on-surface-variant">Showing latest processing orders</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Order ID</th>
                        <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Customer</th>
                        <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Items</th>
                        <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      <tr className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-8 py-5 font-bold">#LUM-9842</td>
                        <td className="px-8 py-5">Alexander Thorne</td>
                        <td className="px-8 py-5">1x Mid-Century Sofa</td>
                        <td className="px-8 py-5">$2,450.00</td>
                        <td className="px-8 py-5 text-right">
                          <span className="px-3 py-1 bg-secondary-container/30 text-secondary text-[10px] font-bold uppercase rounded-full">Processing</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-8 py-5 font-bold">#LUM-9841</td>
                        <td className="px-8 py-5">Sophia Laurent</td>
                        <td className="px-8 py-5">2x Marble Sidetables</td>
                        <td className="px-8 py-5">$1,800.00</td>
                        <td className="px-8 py-5 text-right">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">Shipped</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-8 py-5 font-bold">#LUM-9839</td>
                        <td className="px-8 py-5">Marcus Vane</td>
                        <td className="px-8 py-5">1x Dining Table Set</td>
                        <td className="px-8 py-5">$4,200.00</td>
                        <td className="px-8 py-5 text-right">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">Delivered</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* VIEW: INVENTORY */}
          {view === 'inventory' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display-lg text-3xl font-light text-primary">Catalog Collection</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Manage and curate items published on the store.</p>
                </div>
                <button
                  onClick={() => { resetForm(); setView('add_product'); }}
                  className="bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest py-3 px-6 hover:bg-secondary transition-all"
                >
                  Create Product
                </button>
              </div>

              {/* Search bar on smaller screens */}
              <div className="relative block lg:hidden w-full">
                <input 
                  className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary py-2 px-10 rounded-sm text-sm font-body-md" 
                  placeholder="Search products..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              </div>

              {loading ? (
                <div className="text-center py-20 text-on-surface-variant font-light">
                  Retrieving inventory...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-outline-variant/60 text-on-surface-variant">
                  {searchTerm ? 'No matches found for your search query.' : 'Your atelier catalog is empty. Create your first product to get started.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredItems.map((item) => {
                    // Strip the spec details from visual description
                    const rawDesc = item.description || '';
                    const baseDesc = rawDesc.split('\n\n---\n')[0];

                    return (
                      <div 
                        key={item._id} 
                        className="bento-card border border-outline-variant/40 p-6 flex flex-col justify-between h-72 shadow-sm"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-headline-md text-lg text-primary font-medium tracking-tight truncate w-44">{item.name}</h4>
                            <span className={`font-label-caps text-[10px] px-2.5 py-1 uppercase font-bold rounded-sm ${item.quantity < 5 ? 'bg-red-100 text-red-700' : 'bg-surface-container text-on-surface-variant'}`}>
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant font-light mb-6 line-clamp-4">
                            {baseDesc || 'No product narrative available.'}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                          <span className="font-bold text-lg text-primary">
                            ${(item.price || 0).toLocaleString()}
                          </span>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-xs font-semibold uppercase tracking-wider text-error hover:opacity-80 transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ADD OR EDIT PRODUCT */}
          {view === 'add_product' && (
            <div className="space-y-8 animate-fade-in">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 mb-4 text-on-surface-variant opacity-60">
                  <span className="font-label-caps text-label-caps">Storefront</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="font-label-caps text-label-caps">{editingId ? 'Edit Item' : 'New Catalog Item'}</span>
                </div>
                <h3 className="font-display-lg text-4xl text-primary font-light mb-4">
                  {editingId ? 'Update Curated Piece' : 'Create New Product'}
                </h3>
                <p className="font-body-lg text-on-surface-variant max-w-2xl text-sm leading-relaxed">
                  Curate your luxury collection. Ensure all specifications are precise, as they define the architectural integrity of our marketplace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-gutter max-w-container-max">
                {/* Left Column: Narrative Details */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-12">
                  {/* Product Gallery Simulator */}
                  <div className="bg-white p-8 border border-outline-variant/30">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <span className="font-label-caps text-xs text-secondary mb-1 block">Visuals</span>
                        <h4 className="font-headline-md text-lg text-primary">Product Gallery</h4>
                      </div>
                      <span className="font-label-caps text-[9px] text-on-surface-variant italic">Required: 1 image min.</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3 aspect-[21/9] image-dropzone flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden bg-surface-container-low">
                        <img 
                          className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-25 transition-opacity" 
                          alt="Woodgrain placeholder"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuADD_Mwm9Uv_NdYY-hdZAKVYVewBOuvjMYLR8hGb4PF9EKFrC140cA8E_OlUVqYia2oct4sJeow7jGNZ9g47IvFCU28v9o9NthRSHqHUMkOqWtKIZFvX25xBH8bDC_idPR23YiR4DqQRW03V_E7jxRQqhMR4AUkYws8iQ2gLq_hIQJek8CxBSDZcFRAGA2vJ6Qk1Wr2_VgokkM-X1KFdrnXuu_5vrzrmlxhjZKPT809m-i7bIbHmtxySnFjjb11hrTo3KwnG3pPAGm8"
                        />
                        <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant group-hover:text-primary transition-colors">upload_file</span>
                        <p className="font-label-caps text-[10px] text-on-surface-variant">Gallery Image Linked</p>
                      </div>
                    </div>
                  </div>

                  {/* Section Narrative fields */}
                  <div className="flex flex-col gap-8">
                    <div>
                      <span className="font-label-caps text-xs text-secondary mb-1 block">Narrative</span>
                      <h4 className="font-headline-md text-lg text-primary">Identity &amp; Story</h4>
                    </div>
                    <div className="space-y-10">
                      <div className="relative">
                        <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-surface px-1">Product Name</label>
                        <input 
                          className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-headline-md text-xl text-primary placeholder:opacity-30" 
                          placeholder="e.g. Oblique Lounge Chair" 
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-surface px-1">Detailed Description</label>
                        <textarea 
                          className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-body-md text-sm text-primary placeholder:opacity-30 resize-none" 
                          placeholder="Describe the design philosophy, comfort profile, and aesthetic inspiration..." 
                          rows="4"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Specs & Logic */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-12">
                  {/* Pricing and Classifications */}
                  <div className="bg-surface-container/60 p-8 border border-outline-variant/30 flex flex-col gap-8">
                    <div>
                      <span className="font-label-caps text-xs text-secondary mb-1 block">Commercials</span>
                      <h4 className="font-headline-md text-lg text-primary">Pricing &amp; Classification</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div className="col-span-2 relative">
                        <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-surface-container px-1">Category</label>
                        <input 
                          list="category-options"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Select or type a category..."
                          className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-body-md text-sm text-primary focus:outline-none focus:border-primary transition-colors"
                        />
                        <datalist id="category-options">
                          <option value="Seating" />
                          <option value="Tables" />
                          <option value="Lighting" />
                          <option value="Textiles" />
                          <option value="Storage" />
                        </datalist>
                      </div>
                      
                      <div className="relative">
                        <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-surface-container px-1">Price (USD)</label>
                        <input 
                          className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-body-md text-sm text-primary" 
                          placeholder="0.00" 
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>

                      <div className="relative">
                        <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-surface-container px-1">Quantity</label>
                        <input 
                          className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-body-md text-sm text-primary" 
                          placeholder="10" 
                          type="number"
                          required
                          min="0"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>

                      <div className="col-span-2 relative">
                        <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-surface-container px-1">Availability</label>
                        <select 
                          value={availability}
                          onChange={(e) => setAvailability(e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-body-md text-sm appearance-none cursor-pointer text-primary"
                        >
                          <option value="In Stock">In Stock</option>
                          <option value="Made to Order">Made to Order</option>
                          <option value="Limited Edition">Limited Edition</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="flex flex-col gap-8">
                    <div>
                      <span className="font-label-caps text-xs text-secondary mb-1 block">Technical</span>
                      <h4 className="font-headline-md text-lg text-primary">Dimensions &amp; Material</h4>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="relative">
                        <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-surface px-1">Primary Material</label>
                        <input 
                          className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-body-md text-sm text-primary placeholder:opacity-30" 
                          placeholder="e.g. Solid Walnut, Top-Grain Leather" 
                          type="text"
                          value={material}
                          onChange={(e) => setMaterial(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="font-label-caps text-[9px] text-on-surface-variant block mb-1">Width (cm)</label>
                          <input 
                            className="w-full bg-transparent border-0 border-b border-outline-variant py-2 font-body-md text-sm text-primary" 
                            type="text"
                            placeholder="80"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="font-label-caps text-[9px] text-on-surface-variant block mb-1">Height (cm)</label>
                          <input 
                            className="w-full bg-transparent border-0 border-b border-outline-variant py-2 font-body-md text-sm text-primary" 
                            type="text"
                            placeholder="90"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="font-label-caps text-[9px] text-on-surface-variant block mb-1">Depth (cm)</label>
                          <input 
                            className="w-full bg-transparent border-0 border-b border-outline-variant py-2 font-body-md text-sm text-primary" 
                            type="text"
                            placeholder="75"
                            value={depth}
                            onChange={(e) => setDepth(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-4 flex flex-col gap-4">
                    <button 
                      type="submit"
                      className="w-full bg-primary text-on-primary py-5 font-label-caps text-label-caps tracking-[0.2em] hover:bg-secondary transition-all duration-500 text-sm"
                    >
                      {editingId ? 'SAVE CHANGES' : 'PUBLISH TO CATALOG'}
                    </button>
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={handleDiscard}
                        className="flex-1 border border-outline-variant py-4 font-label-caps text-label-caps tracking-widest text-xs hover:border-primary transition-colors bg-white"
                      >
                        DISCARD
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="w-full mt-auto bg-surface border-t border-outline-variant py-8 bg-white/40">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-margin-desktop w-full max-w-container-max mx-auto text-xs text-on-surface-variant">
            <div className="mb-4 md:mb-0">
              <span className="font-headline-md font-bold text-primary mr-2">Lumina</span>
              <span>© 2024 Lumina Atelier. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
