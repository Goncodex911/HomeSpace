import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api, { resolveImageUrl } from '../api/api';
import AdminStatsChart from '../components/AdminStatsChart';
import { formatUSD } from '../utils/currency';
import {
  filterInventoryItems,
  getUniqueCategories,
  hasActiveInventoryFilters,
} from '../utils/inventoryFilters';
import {
  filterOrders,
  getOrderItemsLabel,
  getOrderStoreTotal,
  hasActiveOrderFilters,
} from '../utils/orderFilters';

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
  const [view, setView] = useState('overview'); // overview, inventory, add_product, wallet
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showInventoryFilters, setShowInventoryFilters] = useState(true);

  // Wallet & Withdrawal states
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawHolder, setWithdrawHolder] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawModalSuccess, setWithdrawModalSuccess] = useState(false);
  const withdrawCloseTimerRef = useRef(null);

  const closeWithdrawModal = () => {
    if (withdrawCloseTimerRef.current) {
      window.clearTimeout(withdrawCloseTimerRef.current);
      withdrawCloseTimerRef.current = null;
    }
    setShowWithdrawModal(false);
    setWithdrawModalSuccess(false);
    setWithdrawError('');
  };

  const openWithdrawModal = () => {
    setWithdrawError('');
    setWithdrawModalSuccess(false);
    setShowWithdrawModal(true);
  };

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
  
  // Image & 3D Model states
  const [image, setImage] = useState('');
  const [model3d, setModel3d] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generating3d, setGenerating3d] = useState(false);
  const [syncTaskId, setSyncTaskId] = useState('');
  const [syncingTaskId, setSyncingTaskId] = useState(false);

  // Orders & Customers
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderMinAmount, setOrderMinAmount] = useState('');
  const [orderMaxAmount, setOrderMaxAmount] = useState('');
  const [orderSortBy, setOrderSortBy] = useState('newest');
  const [orderSearch, setOrderSearch] = useState('');
  const [showOrderFilters, setShowOrderFilters] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [statsPeriod, setStatsPeriod] = useState('month');
  const [storeStats, setStoreStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const statsPeriodLabels = { month: 'Month', quarter: 'Quarter', year: 'Year' };

  const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const storeUserId = user?.id || user?._id;
  const isStoreAdmin = user?.role === 'admin';

  const getStoreOrderTotal = (order) => getOrderStoreTotal(order, storeUserId, isStoreAdmin);
  const formatOrderItems = (order) => getOrderItemsLabel(order, storeUserId, isStoreAdmin);

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

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setError('');
      const data = await api('/orders');
      setOrders(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      setError('');
      const res = await api('/orders/customers');
      setCustomers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchStoreStats = async (period = statsPeriod) => {
    try {
      setStatsLoading(true);
      const res = await api(`/orders/store/stats?period=${period}`);
      setStoreStats(res);
    } catch (err) {
      console.error('Failed to fetch store stats:', err.message);
      setStoreStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      setError('');
      await api(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status },
      });
      setSuccess('Order status updated successfully.');
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const [balRes, histRes] = await Promise.all([
        api('/payment/wallet'),
        api('/payment/withdraw/my'),
      ]);
      setWalletBalance(balRes.walletBalance || 0);
      setWithdrawals(histRes.data || []);
    } catch (err) {
      // silently fail – wallet is secondary feature
      console.error('Wallet fetch error:', err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawModalSuccess(false);
    setWithdrawSubmitting(true);
    try {
      await api('/payment/withdraw', {
        method: 'POST',
        body: {
          amount: parseFloat(withdrawAmount),
          bankName: withdrawBank,
          accountNumber: withdrawAccount,
          accountHolder: withdrawHolder,
        },
      });
      setWithdrawAmount('');
      setWithdrawBank('');
      setWithdrawAccount('');
      setWithdrawHolder('');
      setWithdrawSubmitting(false);
      setWithdrawModalSuccess(true);
      withdrawCloseTimerRef.current = window.setTimeout(() => {
        closeWithdrawModal();
        fetchWallet();
      }, 2000);
    } catch (err) {
      const message = err.message || 'Failed to submit withdrawal request.';
      setWithdrawError(message);
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  useEffect(() => {
    fetchItems();
    
    // Nạp thư viện Google Model Viewer hỗ trợ render 3D
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

  useEffect(() => {
    if (view === 'wallet') fetchWallet();
    if (view === 'orders') fetchOrders();
    if (view === 'customers') fetchCustomers();
    if (view === 'overview') fetchStoreStats(statsPeriod);
  }, [view, statsPeriod]);

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
    setImage('');
    setModel3d('');
    setUploading(false);
    setGenerating3d(false);
    setSyncTaskId('');
    setSyncingTaskId(false);
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
    setImage(item.image || '');
    setModel3d(item.model3d || '');
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
            quantity: parseInt(quantity),
            image,
            model3d
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
            quantity: parseInt(quantity),
            image,
            model3d
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

  // Hàm upload ảnh lên Cloudinary thông qua server api
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Vì fetch thông thường không tự parse Form Data, ta gọi trực tiếp
      const token = localStorage.getItem('token');
      const response = await fetch('/api/items/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Image upload failed');
      }

      setImage(resData.imageUrl);
      setSuccess('Image uploaded to Cloudinary successfully.');
    } catch (err) {
      setError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  // Hàm gọi AI tạo mô hình 3D từ ảnh
  const handleGenerate3D = async () => {
    if (!image) {
      setError('Please upload a product image first.');
      return;
    }

    if (!editingId) {
      setError('Please save the product first to generate a 3D model.');
      return;
    }

    setError('');
    setSuccess('');
    setGenerating3d(true);

    try {
      const res = await api(`/items/generate-3d/${editingId}`, {
        method: 'POST',
        body: { imageUrl: image }
      });

      setModel3d(res.model3d);
      setSuccess(res.message || '3D Model generated successfully!');
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to generate 3D model.');
    } finally {
      setGenerating3d(false);
    }
  };

  // Hàm đồng bộ Task ID cũ
  const handleSyncTripo = async () => {
    if (!syncTaskId.trim()) {
      setError('Please enter a Tripo3D Task ID.');
      return;
    }

    if (!editingId) {
      setError('Please save the product first to sync the 3D model.');
      return;
    }

    setError('');
    setSuccess('');
    setSyncingTaskId(true);

    try {
      const res = await api(`/items/tripo-sync/${editingId}`, {
        method: 'POST',
        body: { taskId: syncTaskId.trim() }
      });

      setModel3d(res.model3d);
      setSuccess(res.message || '3D Model synchronized successfully!');
      fetchItems();
    } catch (err) {
      setError(err.message || 'Sync failed: Make sure the Task ID is correct and belongs to this API Key.');
    } finally {
      setSyncingTaskId(false);
    }
  };

  const handleDiscard = () => {
    resetForm();
    setView('inventory');
  };

  // Helper calculations for Overview tab
  const lowStockCount = items.filter(item => item.quantity < 5).length;
  const formatMoney = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const todayRevenue = storeStats?.today?.revenue || 0;
  const todayChange = storeStats?.today?.changePercent || 0;
  const categoryOptions = useMemo(() => getUniqueCategories(items), [items]);

  const filteredItems = useMemo(
    () =>
      filterInventoryItems(items, {
        searchTerm,
        categoryFilter,
        stockFilter,
        minPrice,
        maxPrice,
        sortBy,
      }),
    [items, searchTerm, categoryFilter, stockFilter, minPrice, maxPrice, sortBy]
  );

  const inventoryFiltersActive = hasActiveInventoryFilters({
    searchTerm,
    categoryFilter,
    stockFilter,
    minPrice,
    maxPrice,
    sortBy,
  });

  const clearInventoryFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStockFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const filteredOrders = useMemo(
    () =>
      filterOrders(
        orders,
        {
          searchTerm: orderSearch,
          statusFilter: orderStatusFilter,
          paymentFilter: orderPaymentFilter,
          minAmount: orderMinAmount,
          maxAmount: orderMaxAmount,
          sortBy: orderSortBy,
        },
        storeUserId,
        isStoreAdmin
      ),
    [
      orders,
      orderSearch,
      orderStatusFilter,
      orderPaymentFilter,
      orderMinAmount,
      orderMaxAmount,
      orderSortBy,
      storeUserId,
      isStoreAdmin,
    ]
  );

  const orderFiltersActive = hasActiveOrderFilters({
    searchTerm: orderSearch,
    statusFilter: orderStatusFilter,
    paymentFilter: orderPaymentFilter,
    minAmount: orderMinAmount,
    maxAmount: orderMaxAmount,
    sortBy: orderSortBy,
  });

  const clearOrderFilters = () => {
    setOrderSearch('');
    setOrderStatusFilter('all');
    setOrderPaymentFilter('all');
    setOrderMinAmount('');
    setOrderMaxAmount('');
    setOrderSortBy('newest');
  };

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((entry) => {
      const name = entry.customer?.fullName?.toLowerCase() || '';
      const email = entry.customer?.email?.toLowerCase() || '';
      return name.includes(term) || email.includes(term);
    });
  }, [customers, customerSearch]);

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

          <button 
            onClick={() => { setView('wallet'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 pl-5 py-3 nav-link ${view === 'wallet' ? 'nav-link-active' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="font-label-caps text-label-caps">Wallet</span>
          </button>

          <button 
            onClick={() => { setView('orders'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 pl-5 py-3 nav-link ${view === 'orders' ? 'nav-link-active' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="font-label-caps text-label-caps">Orders</span>
          </button>

          <button 
            onClick={() => { setView('customers'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 pl-5 py-3 nav-link ${view === 'customers' ? 'nav-link-active' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-caps text-label-caps">Customers</span>
          </button>
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
              {view === 'orders' && 'Store Orders'}
              {view === 'customers' && 'Customer Directory'}
              {view === 'add_product' && (editingId ? 'Edit Product' : 'New Catalog Item')}
              {view === 'wallet' && 'Wallet & Withdrawals'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
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
                      <span className="font-display-lg text-4xl leading-none font-light text-primary">${formatMoney(todayRevenue)}</span>
                      <p className="text-xs text-on-surface-variant mt-2">
                        {todayChange >= 0 ? (
                          <span className="text-green-600 font-semibold">+{todayChange}%</span>
                        ) : (
                          <span className="text-red-600 font-semibold">{todayChange}%</span>
                        )}{' '}
                        from yesterday
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
                <div className="lg:col-span-2 bento-card p-8 border border-outline-variant/30 flex flex-col">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div>
                      <span className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-1 block">Analytics</span>
                      <h4 className="font-headline-md text-headline-md">Sales Statistics</h4>
                      <p className="text-xs text-on-surface-variant mt-1">
                        ${formatMoney(storeStats?.totals?.revenue)} · {storeStats?.totals?.orders || 0} paid orders
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {['month', 'quarter', 'year'].map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setStatsPeriod(period)}
                          className={`px-3 py-1.5 font-label-caps text-[10px] uppercase tracking-wider border transition-all ${
                            statsPeriod === period
                              ? 'border-primary bg-primary text-white'
                              : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                          }`}
                        >
                          {statsPeriodLabels[period]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AdminStatsChart
                    data={storeStats}
                    chartType={storeStats?.chartType || (statsPeriod === 'month' ? 'bar' : 'line')}
                    loading={statsLoading}
                    period={statsPeriod}
                  />
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

              <div className="bento-card border border-outline-variant/30 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">tune</span>
                    <div>
                      <p className="font-label-caps text-xs uppercase tracking-widest text-primary">Smart Filters</p>
                      <p className="text-xs text-on-surface-variant">
                        Showing {filteredItems.length} of {items.length} products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inventoryFiltersActive && (
                      <button
                        type="button"
                        onClick={clearInventoryFilters}
                        className="text-xs font-label-caps uppercase tracking-wider text-secondary hover:text-primary transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowInventoryFilters((prev) => !prev)}
                      className="text-xs font-label-caps uppercase tracking-wider border border-outline-variant px-3 py-2 hover:border-primary transition-colors"
                    >
                      {showInventoryFilters ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-1 focus:ring-primary py-3 px-10 text-sm rounded-full"
                    placeholder="Smart search: marble, #Seating, low stock, >5000000..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                </div>

                {showInventoryFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 pt-2 border-t border-outline-variant/20">
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="all">All categories</option>
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Stock</label>
                      <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="all">All stock</option>
                        <option value="in_stock">In stock</option>
                        <option value="low_stock">Low stock (&lt;5)</option>
                        <option value="out_of_stock">Out of stock</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Min price ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Max price ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Any"
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Sort by</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="price_desc">Price: high to low</option>
                        <option value="price_asc">Price: low to high</option>
                        <option value="name_asc">Name A to Z</option>
                        <option value="stock_asc">Stock: low to high</option>
                        <option value="stock_desc">Stock: high to low</option>
                      </select>
                    </div>
                  </div>
                )}

                {(categoryFilter !== 'all' || stockFilter !== 'all' || minPrice || maxPrice) && (
                  <div className="flex flex-wrap gap-2 text-[10px] font-label-caps uppercase tracking-wider">
                    {categoryFilter !== 'all' && (
                      <span className="px-2 py-1 bg-secondary-container/30 text-secondary">{categoryFilter}</span>
                    )}
                    {stockFilter !== 'all' && (
                      <span className="px-2 py-1 bg-secondary-container/30 text-secondary">{stockFilter.replace('_', ' ')}</span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="px-2 py-1 bg-secondary-container/30 text-secondary">
                        {formatUSD(minPrice || 0)} – {maxPrice ? formatUSD(maxPrice) : '∞'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-20 text-on-surface-variant font-light">
                  Retrieving inventory...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-outline-variant/60 text-on-surface-variant">
                  {inventoryFiltersActive ? 'No products match your search or filters.' : 'Your atelier catalog is empty. Create your first product to get started.'}
                </div>
              ) : (
                <section className="bento-card border border-outline-variant/30 overflow-hidden">
                  <div className="divide-y divide-outline-variant/20">
                    {filteredItems.map((item) => {
                      const rawDesc = item.description || '';
                      const baseDesc = rawDesc.split('\n\n---\n')[0];
                      const imageUrl =
                        resolveImageUrl(item.image) ||
                        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80';

                      return (
                        <div
                          key={item._id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-5 hover:bg-surface-container-lowest transition-colors"
                        >
                          <div className="w-full sm:w-24 md:w-28 h-24 md:h-28 flex-shrink-0 bg-surface-container-low overflow-hidden border border-outline-variant/20">
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-headline-md text-base text-primary font-medium truncate">
                                {item.name}
                              </h4>
                              <span className="font-label-caps text-[10px] px-2 py-0.5 uppercase tracking-wider bg-surface-container text-on-surface-variant rounded-sm">
                                {item.category || 'Uncategorized'}
                              </span>
                              <span
                                className={`font-label-caps text-[10px] px-2 py-0.5 uppercase font-bold rounded-sm ${
                                  item.quantity < 5
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                Qty: {item.quantity}
                              </span>
                            </div>
                            <p className="text-sm text-on-surface-variant font-light line-clamp-2">
                              {baseDesc || 'No product narrative available.'}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:min-w-[140px] sm:text-right border-t sm:border-t-0 border-outline-variant/20 pt-3 sm:pt-0">
                            <span className="font-bold text-lg text-primary whitespace-nowrap">
                              {formatUSD(item.price || 0)}
                            </span>
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Edit
                              </button>
                              <button
                                type="button"
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
                </section>
              )}
            </div>
          )}

          {/* VIEW: ORDERS */}
          {view === 'orders' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-wrap justify-between items-end gap-4">
                <div>
                  <h3 className="font-display-lg text-3xl font-light text-primary">Order Management</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Track and update orders from your catalog.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchOrders}
                  className="text-xs font-label-caps uppercase tracking-wider border border-outline-variant px-4 py-2 hover:border-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>

              <div className="bento-card border border-outline-variant/30 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">tune</span>
                    <div>
                      <p className="font-label-caps text-xs uppercase tracking-widest text-primary">Smart Filters</p>
                      <p className="text-xs text-on-surface-variant">
                        Showing {filteredOrders.length} of {orders.length} orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {orderFiltersActive && (
                      <button
                        type="button"
                        onClick={clearOrderFilters}
                        className="text-xs font-label-caps uppercase tracking-wider text-secondary hover:text-primary transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowOrderFilters((prev) => !prev)}
                      className="text-xs font-label-caps uppercase tracking-wider border border-outline-variant px-3 py-2 hover:border-primary transition-colors"
                    >
                      {showOrderFilters ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-1 focus:ring-primary py-3 px-10 text-sm rounded-full"
                    placeholder="Smart search: #9842, paid, shipped, marble, >500..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                </div>

                {showOrderFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 pt-2 border-t border-outline-variant/20">
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Order status</label>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary capitalize"
                      >
                        <option value="all">All statuses</option>
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Payment</label>
                      <select
                        value={orderPaymentFilter}
                        onChange={(e) => setOrderPaymentFilter(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary capitalize"
                      >
                        <option value="all">All payments</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Min amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={orderMinAmount}
                        onChange={(e) => setOrderMinAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Max amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={orderMaxAmount}
                        onChange={(e) => setOrderMaxAmount(e.target.value)}
                        placeholder="Any"
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Sort by</label>
                      <select
                        value={orderSortBy}
                        onChange={(e) => setOrderSortBy(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="amount_desc">Amount: high to low</option>
                        <option value="amount_asc">Amount: low to high</option>
                        <option value="customer_asc">Customer A to Z</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {ordersLoading ? (
                <div className="text-center py-20 text-on-surface-variant font-light">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-outline-variant/60 text-on-surface-variant">
                  {orders.length === 0 ? 'No orders yet.' : 'No orders match your search or filter.'}
                </div>
              ) : (
                <section className="bento-card border border-outline-variant/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/30">
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Order</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Customer</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Items</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Amount</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Payment</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {filteredOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-primary">#{order.orderCode}</p>
                              <p className="text-xs text-on-surface-variant mt-1">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium">{order.customer?.fullName || 'Unknown'}</p>
                              <p className="text-xs text-on-surface-variant">{order.customer?.email || '—'}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface-variant max-w-xs">
                              {formatOrderItems(order) || '—'}
                            </td>
                            <td className="px-6 py-4 font-bold text-primary whitespace-nowrap">
                              ${getStoreOrderTotal(order).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-label-caps text-[10px] px-2.5 py-1 uppercase font-bold rounded-sm inline-block ${
                                order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {order.paymentStatus || 'pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={order.status || 'pending'}
                                onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                                className="bg-surface-container-low border border-outline-variant/30 py-2 px-2 text-xs focus:outline-none focus:border-primary capitalize"
                              >
                                {ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => navigate(`/orders/${order._id}`)}
                                className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* VIEW: CUSTOMERS */}
          {view === 'customers' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-wrap justify-between items-end gap-4">
                <div>
                  <h3 className="font-display-lg text-3xl font-light text-primary">Customer Directory</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Customers who purchased from your store.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCustomers}
                  className="text-xs font-label-caps uppercase tracking-wider border border-outline-variant px-4 py-2 hover:border-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>

              <div className="bento-card border border-outline-variant/30 p-5">
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-1 focus:ring-primary py-3 px-10 text-sm rounded-full"
                    placeholder="Search customer name or email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-3">
                  Showing {filteredCustomers.length} of {customers.length} customers
                </p>
              </div>

              {customersLoading ? (
                <div className="text-center py-20 text-on-surface-variant font-light">Loading customers...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-outline-variant/60 text-on-surface-variant">
                  {customers.length === 0 ? 'No customers yet.' : 'No customers match your search.'}
                </div>
              ) : (
                <section className="bento-card border border-outline-variant/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[720px]">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/30">
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Customer</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Email</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Orders</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Total spent</th>
                          <th className="px-6 py-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Last order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {filteredCustomers.map((entry) => (
                          <tr key={entry.customer?._id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-6 py-4 font-medium text-primary">
                              {entry.customer?.fullName || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface-variant">
                              {entry.customer?.email || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-label-caps text-[10px] px-2.5 py-1 uppercase font-bold rounded-sm bg-surface-container text-on-surface-variant inline-block">
                                {entry.orderCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-primary">
                              ${Number(entry.totalSpent || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface-variant">
                              {entry.lastOrderAt ? new Date(entry.lastOrderAt).toLocaleDateString('vi-VN') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
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
                        <span className="font-label-caps text-xs text-secondary mb-1 block">Visuals &amp; 3D</span>
                        <h4 className="font-headline-md text-lg text-primary">Product Media &amp; AI 3D</h4>
                      </div>
                      <span className="font-label-caps text-[9px] text-on-surface-variant italic">Cloudinary &amp; Tripo3D Integration</span>
                    </div>
                    <div className="space-y-6">
                      {/* Upload block */}
                      <label className="aspect-[21/9] image-dropzone flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden bg-surface-container-low block border border-dashed border-outline-variant">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                        {image ? (
                          <img 
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" 
                            alt="Uploaded product preview" 
                            src={image}
                          />
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant group-hover:text-primary transition-colors">
                              {uploading ? 'sync' : 'upload_file'}
                            </span>
                            <p className="font-label-caps text-[10px] text-on-surface-variant">
                              {uploading ? 'Uploading image to Cloudinary...' : 'Upload product image (Cloudinary)'}
                            </p>
                          </>
                        )}
                      </label>

                      {/* AI 3D Generation Section */}
                      {image && (
                        <div className="bg-surface-container-low p-4 border border-outline-variant/30 space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm">AI Image-to-3D Generator</p>
                              <p className="text-[11px] text-on-surface-variant">Convert this photo into a 3D model (.glb)</p>
                            </div>
                            {model3d && (
                              <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                                3D Available
                              </span>
                            )}
                          </div>

                          {model3d && (
                            <div className="space-y-3">
                              {/* 3D Viewer container */}
                              <div className="w-full h-64 bg-[#eeeeea] border border-outline-variant/50 relative flex items-center justify-center overflow-hidden">
                                <model-viewer
                                  src={model3d}
                                  alt="Preview 3D model"
                                  camera-controls
                                  auto-rotate
                                  style={{ width: '100%', height: '100%' }}
                                />
                              </div>
                              <div className="text-xs text-on-surface-variant break-all bg-white p-3 border border-outline-variant/50 flex justify-between items-center">
                                <span className="truncate max-w-[250px]"><strong>File:</strong> {model3d}</span>
                                <a href={model3d} target="_blank" rel="noreferrer" className="text-secondary underline shrink-0">Open GLB</a>
                              </div>
                            </div>
                          )}

                          {/* Manual GLB URL input */}
                          <div className="relative pt-2">
                            <label className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant absolute -top-1 left-2 bg-[#f8f9fa] px-1 font-bold">Manual 3D GLB URL (Optional)</label>
                            <input 
                              type="text"
                              value={model3d}
                              onChange={(e) => setModel3d(e.target.value)}
                              placeholder="Paste a direct .glb model URL here (e.g. from Google Cloud, AWS, Tripo...)"
                              className="w-full bg-white border border-outline-variant/50 px-3 py-3 text-xs focus:ring-0 focus:border-primary placeholder:opacity-50"
                            />
                          </div>

                          {!editingId ? (
                            <p className="text-xs text-secondary italic">
                              * Please save this new product first before generating or syncing the 3D model.
                            </p>
                          ) : (
                            <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                              <button
                                type="button"
                                onClick={handleGenerate3D}
                                disabled={generating3d}
                                className="w-full bg-[#1a1c1a] text-white py-3 font-semibold uppercase tracking-widest text-[10px] hover:bg-[#006a50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <span className={`material-symbols-outlined text-[16px] ${generating3d ? 'animate-spin' : ''}`}>
                                  {generating3d ? 'sync' : 'view_in_ar'}
                                </span>
                                {generating3d ? 'AI is generating 3D model... (take up to 1m)' : 'GENERATE 3D MODEL FROM PHOTO'}
                              </button>

                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={syncTaskId}
                                  onChange={(e) => setSyncTaskId(e.target.value)}
                                  placeholder="Or paste Tripo Task ID (e.g. cf9b2346...)"
                                  className="flex-1 bg-white border border-outline-variant/50 px-3 text-xs focus:ring-0 placeholder:opacity-40"
                                />
                                <button
                                  type="button"
                                  onClick={handleSyncTripo}
                                  disabled={syncingTaskId}
                                  className="bg-secondary text-on-secondary px-4 text-[10px] font-semibold uppercase tracking-wider hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <span className={`material-symbols-outlined text-sm ${syncingTaskId ? 'animate-spin' : ''}`}>
                                    sync
                                  </span>
                                  {syncingTaskId ? 'Syncing...' : 'Sync'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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

          {/* VIEW: WALLET */}
          {view === 'wallet' && (
            <div className="space-y-10 animate-fade-in">
              <div className="flex items-end justify-between">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-2 block">Finance</span>
                  <h3 className="font-display-lg text-4xl text-primary font-light">Store Wallet</h3>
                </div>
              </div>

              {/* Balance Card + Withdraw Button */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="md:col-span-2 bento-card border border-outline-variant/30 p-8 flex flex-col justify-between" style={{background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'}}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label-caps text-[10px] text-white/40 uppercase tracking-widest block mb-1">Available Balance</span>
                      <span className="font-label-caps text-[10px] text-white/40 uppercase tracking-widest">Store Wallet</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white">account_balance_wallet</span>
                    </div>
                  </div>
                  {walletLoading ? (
                    <div className="text-white/50 text-sm mt-8">Loading balance...</div>
                  ) : (
                    <div className="mt-8">
                      <span className="font-display-lg text-5xl font-light text-white leading-none">
                        {formatUSD(walletBalance)}
                      </span>
                      <p className="text-white/40 text-xs mt-3 font-label-caps">USD available to withdraw</p>
                    </div>
                  )}
                </div>

                <div className="bento-card border border-outline-variant/30 p-8 flex flex-col justify-between">
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant block mb-2">Quick Actions</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Send a withdrawal request to your bank account. Admin will review within 1–3 business days.
                    </p>
                  </div>
                  <button
                    onClick={openWithdrawModal}
                    disabled={walletBalance <= 0}
                    className="w-full mt-6 bg-primary text-white font-label-caps text-xs uppercase tracking-widest py-4 hover:bg-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Withdraw
                  </button>
                  {walletBalance <= 0 && (
                    <p className="text-[10px] text-on-surface-variant text-center mt-2">Wallet balance is zero. Withdrawals are unavailable.</p>
                  )}
                </div>
              </div>

              {/* Withdrawal History Table */}
              <section className="bento-card border border-outline-variant/30 overflow-hidden">
                <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-white">
                  <h4 className="font-headline-md text-headline-md">Withdrawal History</h4>
                  <button onClick={fetchWallet} className="text-xs text-secondary hover:underline font-label-caps flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                  </button>
                </div>
                {walletLoading ? (
                  <div className="text-center py-12 text-on-surface-variant text-sm">Loading...</div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-12 text-on-surface-variant text-sm border border-dashed border-outline-variant/40 m-8">
                    <span className="material-symbols-outlined text-4xl mb-3 opacity-30 block">receipt_long</span>
                    No withdrawal requests yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Submitted</th>
                          <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Amount</th>
                          <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Bank</th>
                          <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Account</th>
                          <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {withdrawals.map((w) => (
                          <tr key={w._id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-8 py-5 text-sm text-on-surface-variant">{new Date(w.createdAt).toLocaleDateString('en-US')}</td>
                            <td className="px-8 py-5 font-bold text-primary">{formatUSD(w.amount)}</td>
                            <td className="px-8 py-5 text-sm">{w.bankName}</td>
                            <td className="px-8 py-5 text-sm font-mono">{w.accountNumber}</td>
                            <td className="px-8 py-5 text-right">
                              <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${
                                w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                w.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {w.status === 'pending' ? 'Pending' : w.status === 'accepted' ? 'Approved' : 'Rejected'}
                              </span>
                              {w.status === 'rejected' && w.note && (
                                <p className="text-[10px] text-red-500 mt-1 text-right">Reason: {w.note}</p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            {withdrawModalSuccess ? (
              <div className="max-w-md w-full p-10 text-center border-2 border-emerald-600 bg-emerald-50">
                <span className="material-symbols-outlined text-emerald-600 text-5xl mb-4 block">check_circle</span>
                <h3 className="font-headline-md text-lg text-emerald-900 font-bold mb-2">Request Submitted</h3>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Your withdrawal request was sent successfully. Admin will review it shortly.
                </p>
              </div>
            ) : (
            <form onSubmit={handleWithdrawSubmit} className="bg-white max-w-md w-full p-8 shadow-2xl border border-outline-variant/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-lg text-primary font-bold">Withdrawal Request</h3>
                <button type="button" onClick={closeWithdrawModal} className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mb-6 p-4 bg-surface-container-low border border-outline-variant/20">
                <span className="font-label-caps text-[10px] text-on-surface-variant block">Current balance</span>
                <span className="font-display-lg text-2xl text-primary font-light">{formatUSD(walletBalance)}</span>
              </div>

              {withdrawError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 text-xs">{withdrawError}</div>
              )}

              <div className="space-y-6">
                <div className="relative">
                  <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-white px-1">Amount (USD)</label>
                  <input
                    type="number"
                    min="1"
                    max={walletBalance}
                    step="0.01"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-4 font-headline-md text-xl text-primary"
                  />
                  {withdrawAmount && (
                    <span className="absolute right-0 bottom-4 text-xs text-on-surface-variant">
                      = {formatUSD(withdrawAmount || 0)}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-white px-1">Bank</label>
                  <select
                    required
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                    className="withdraw-bank-select w-full bg-transparent border-0 border-b border-outline-variant py-4 pr-8 text-sm text-primary cursor-pointer focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select bank</option>
                    <option value="Vietcombank">Vietcombank (VCB)</option>
                    <option value="BIDV">BIDV</option>
                    <option value="Agribank">Agribank</option>
                    <option value="VietinBank">VietinBank (CTG)</option>
                    <option value="Techcombank">Techcombank (TCB)</option>
                    <option value="MB Bank">MB Bank</option>
                    <option value="ACB">ACB</option>
                    <option value="Sacombank">Sacombank (STB)</option>
                    <option value="TPBank">TPBank</option>
                    <option value="VPBank">VPBank</option>
                    <option value="HDBank">HDBank</option>
                    <option value="OCB">OCB</option>
                    <option value="SHB">SHB</option>
                    <option value="SeABank">SeABank</option>
                    <option value="LienVietPostBank">LienVietPostBank</option>
                    <option value="MSB">MSB (Maritime Bank)</option>
                    <option value="Eximbank">Eximbank</option>
                    <option value="Nam A Bank">Nam A Bank</option>
                    <option value="Bac A Bank">Bac A Bank</option>
                    <option value="VIB">VIB</option>
                    <option value="Cake by VPBank">Cake by VPBank</option>
                    <option value="Timo by Ban Viet">Timo by Ban Viet</option>
                  </select>
                  <span className="absolute right-0 bottom-4 pointer-events-none text-on-surface-variant" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </div>

                <div className="relative">
                  <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-white px-1">Account number</label>
                  <input
                    type="text"
                    required
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder="Enter bank account number"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-4 text-sm text-primary font-mono"
                  />
                </div>

                <div className="relative">
                  <label className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant absolute -top-3 left-0 bg-white px-1">Account holder name</label>
                  <input
                    type="text"
                    required
                    value={withdrawHolder}
                    onChange={(e) => setWithdrawHolder(e.target.value)}
                    placeholder="Enter account holder name (uppercase)"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-4 text-sm text-primary uppercase"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={closeWithdrawModal}
                  className="flex-1 py-3 border border-outline-variant text-on-surface-variant font-label-caps text-xs uppercase hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawSubmitting}
                  className="flex-1 py-3 bg-primary text-white font-label-caps text-xs uppercase hover:bg-secondary transition-colors shadow disabled:opacity-60"
                >
                  {withdrawSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
            )}
          </div>
        )}

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
