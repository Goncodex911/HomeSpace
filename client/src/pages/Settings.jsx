import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { vietnamAddressData } from '../services/vietnamAddressData';
import api from '../api/api';

const Settings = () => {
  const { user, logout, updateProfile, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'profile');

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    occupation: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Order History State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // 2. Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 1,
      name: 'Alexander Vance',
      phone: '+84 912 345 678',
      streetAddress: '742 Nguyễn Huệ, Phường Bến Nghé',
      city: 'Quận 1',
      state: 'Hồ Chí Minh',
      zipCode: '700000',
      isDefault: true,
    },
    {
      id: 2,
      name: 'Alexander Vance (Studio Office)',
      phone: '+84 903 888 999',
      streetAddress: 'Căn hộ 402, Tòa nhà Artisan, Đường Cầu Giấy',
      city: 'Quận Cầu Giấy',
      state: 'Hà Nội',
      zipCode: '100000',
      isDefault: false,
    }
  ]);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  // 3. Notifications State
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    securityAlerts: true,
  });

  const [notifSuccess, setNotifSuccess] = useState(false);

  // Protect route: redirect to login if not logged in
  useEffect(() => {
    if (!token && !localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Sync state when user context is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        occupation: user.occupation || '',
        streetAddress: user.streetAddress || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders' && token) {
      fetchOrders();
    }
  }, [activeTab, token]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api('/orders');
      const formattedOrders = res.map(o => ({
        id: o._id,
        date: new Date(o.createdAt).toLocaleDateString(),
        status: o.status,
        statusColor: o.status === 'Pending' ? 'bg-yellow-500' : (o.status === 'Cancelled' ? 'bg-red-500' : 'bg-emerald-500'),
        total: o.totalAmount,
        items: o.items.map(i => ({
          name: i.item.name || 'Unknown Item',
          price: i.price,
          quantity: i.quantity,
          image: i.item.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80'
        }))
      }));
      setOrders(formattedOrders);
    } catch (err) {
      setOrdersError('Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: '',
    }));
  };

  const provinces = Object.keys(vietnamAddressData);
  const districts = formData.state ? vietnamAddressData[formData.state] || [] : [];

  // Vietnam Dropdowns for "Add Address Form"
  const formDistricts = addressForm.state ? vietnamAddressData[addressForm.state] || [] : [];

  const handleDiscard = () => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        occupation: user.occupation || '',
        streetAddress: user.streetAddress || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
      setSuccessMsg('');
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await updateProfile(formData);
      setIsSaving(false);
      setIsSaved(true);
      setSuccessMsg(res.message || 'Profile updated successfully.');
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      setIsSaving(false);
      setErrorMsg(err.message || 'Failed to update profile.');
    }
  };

  // Saved Address management
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.phone || !addressForm.streetAddress || !addressForm.state || !addressForm.city) {
      return;
    }
    const newAddress = {
      id: Date.now(),
      ...addressForm,
    };

    if (addressForm.isDefault) {
      setSavedAddresses((prev) =>
        prev.map((addr) => ({ ...addr, isDefault: false })).concat(newAddress)
      );
    } else {
      setSavedAddresses((prev) => prev.concat(newAddress));
    }

    setAddressForm({
      name: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false,
    });
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id) => {
    setSavedAddresses((prev) => prev.filter((addr) => addr.id !== id));
  };

  const handleSetDefaultAddress = (id) => {
    setSavedAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };



  // Notifications save
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    setNotifSuccess(true);
    setTimeout(() => {
      setNotifSuccess(false);
    }, 3000);
  };

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
              <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps cursor-pointer">Living Room</Link>
              <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps cursor-pointer">Bedroom</Link>
              <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps cursor-pointer">Kitchen</Link>
              <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps cursor-pointer">Office</Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-surface-container px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-body-md p-0 w-48 focus:outline-none" placeholder="Search collection..." type="text" />
            </div>

            {token ? (
              <div className="flex items-center gap-4">
                <span className="text-sm hidden sm:inline text-on-surface-variant">Hello, <strong>{user?.fullName}</strong></span>
                <Link to="/settings" className="flex items-center text-primary font-bold transition-opacity" title="Profile Settings">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="bg-secondary text-on-secondary text-xs font-label-caps px-4 py-2 hover:bg-primary transition-colors uppercase tracking-wider mr-2">
                    Admin Panel
                  </Link>
                )}
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

      {/* Main Settings Content */}
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24">
        <div className="flex flex-col md:flex-row gap-16">

          {/* Side Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-2">
                <h1 className="font-headline-md text-headline-md text-on-surface">Account Settings</h1>
                <p className="font-body-md text-on-surface-variant opacity-70">Manage your profile and preferences.</p>
              </div>

              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-4 py-3 text-left transition-all duration-200 group pl-4 border-l-4 ${activeTab === 'profile' ? 'text-primary font-bold border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">person</span>
                  <span className="font-label-caps text-label-caps">Profile Information</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-4 py-3 text-left transition-all duration-200 group pl-4 border-l-4 ${activeTab === 'orders' ? 'text-primary font-bold border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">shopping_bag</span>
                  <span className="font-label-caps text-label-caps">Order History</span>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-4 py-3 text-left transition-all duration-200 group pl-4 border-l-4 ${activeTab === 'addresses' ? 'text-primary font-bold border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">location_on</span>
                  <span className="font-label-caps text-label-caps">Saved Addresses</span>
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center gap-4 py-3 text-left transition-all duration-200 group pl-4 border-l-4 ${activeTab === 'notifications' ? 'text-primary font-bold border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">notifications_active</span>
                  <span className="font-label-caps text-label-caps">Notifications</span>
                </button>

                {user?.role === 'customer' && (
                  <button
                    onClick={() => setActiveTab('curator')}
                    className={`flex items-center gap-4 py-3 text-left transition-all duration-200 group pl-4 border-l-4 ${activeTab === 'curator' ? 'text-primary font-bold border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                  >
                    <span className="material-symbols-outlined">workspace_premium</span>
                    <span className="font-label-caps text-label-caps">Become a Curator</span>
                  </button>
                )}
              </nav>

              <div className="pt-10 border-t border-outline-variant/30 flex flex-col gap-4">
                <button onClick={logout} className="flex items-center gap-4 py-2 text-on-surface-variant pl-5 hover:text-error transition-colors">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-label-caps text-label-caps">Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <section className="flex-grow max-w-3xl">

            {/* Tab 1: Profile Information */}
            {activeTab === 'profile' && (
              <div className="space-y-12">
                {/* Profile Header Block */}
                <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-lg shadow-[0px_10px_30px_rgba(0,0,0,0.04)] border border-surface-variant/20">
                  <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-surface-variant">
                      <img
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDf8Y2YMjKNpq7_6wEW8rITB7ya93v-jWc_NSAp2zQkzdKcJxn3ZVucYxKSpmqaOzBqWNI-z4Qb-llBOxAjnqlvuu3J7V4kS8YPRdcphOxld2Duy_1QD6BSdpqBSK033x0YoYxiTLDCAm_VkHNC64XancrLlP-SqA8cfXw2VgpRGmSrp_M5GaUvwtimJJoOHie72PfTUAvZSVkj-5DgHp5D0GtasfHqa1DloP2keyPb8KgRl7Lc3UzoP6LmaAMaWAvNsbD_uABo8gsD"
                      />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-primary mb-2">Profile Photo</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-4">Upload a high-resolution image. Recommended size 400x400px.</p>
                    <div className="flex gap-4">
                      <button className="px-6 py-2 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:bg-secondary transition-colors duration-300">Upload New</button>
                      <button className="px-6 py-2 border border-outline-variant text-primary font-label-caps text-label-caps uppercase tracking-wider hover:bg-surface-container-low transition-colors duration-300">Remove</button>
                    </div>
                  </div>
                </div>

                {/* Status Notifications */}
                {errorMsg && (
                  <div className="bg-error-container text-on-error-container p-4 rounded border border-error/20 font-body-md">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-secondary-container text-on-secondary-container p-4 rounded border border-secondary/20 font-body-md">
                    {successMsg}
                  </div>
                )}

                {/* Personal Details Form */}
                <form onSubmit={handleSubmit} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">Full Name</label>
                      <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                        type="text"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">Email Address</label>
                      <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                        type="email"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">Phone Number</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                        type="tel"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">Occupation</label>
                      <input
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                        type="text"
                      />
                    </div>

                  </div>

                  <div className="space-y-8">
                    <h2 className="font-headline-md text-headline-md text-primary pt-8 border-t border-surface-variant">Default Shipping Address</h2>

                    <div className="grid grid-cols-1 gap-8">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">Street Address</label>
                        <input
                          name="streetAddress"
                          value={formData.streetAddress}
                          onChange={handleChange}
                          className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                          type="text"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">Tỉnh / Thành phố</label>
                          <select
                            name="state"
                            value={formData.state}
                            onChange={handleStateChange}
                            className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none w-full cursor-pointer"
                          >
                            <option value="" className="text-on-surface-variant">-- Chọn Tỉnh / TP --</option>
                            {provinces.map((prov) => (
                              <option key={prov} value={prov} className="text-primary">{prov}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">Quận / Huyện</label>
                          <select
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            disabled={!formData.state}
                            className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none w-full cursor-pointer disabled:opacity-50"
                          >
                            <option value="" className="text-on-surface-variant">-- Chọn Quận / Huyện --</option>
                            {districts.map((dist) => (
                              <option key={dist} value={dist} className="text-primary">{dist}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.15em]">ZIP Code</label>
                          <input
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-lg text-body-lg focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                            type="text"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-6 pt-12">
                    <button
                      onClick={handleDiscard}
                      className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest hover:text-primary transition-colors focus:outline-none"
                      type="button"
                    >
                      Discard Changes
                    </button>
                    <button
                      disabled={isSaving}
                      className={`bg-primary text-on-primary px-12 py-4 font-label-caps text-label-caps uppercase tracking-widest transition-all duration-300 shadow-xl hover:shadow-2xl focus:outline-none ${isSaving ? 'opacity-70 cursor-not-allowed' : ''} ${isSaved ? 'bg-secondary' : 'bg-primary'}`}
                      type="submit"
                    >
                      {isSaving ? 'SAVING...' : isSaved ? 'PROFILE UPDATED' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Order History */}
            {activeTab === 'orders' && (
              <div className="space-y-10">
                <div className="border-b border-surface-variant pb-6">
                  <h2 className="font-headline-md text-headline-md text-primary mb-2">Order History</h2>
                  <p className="font-body-md text-on-surface-variant">Review your seasonal orders and delivery updates.</p>
                </div>

                <div className="space-y-8">
                  {ordersLoading ? (
                    <p className="text-on-surface-variant font-label-caps uppercase tracking-widest">Loading Orders...</p>
                  ) : ordersError ? (
                    <p className="text-error mb-4">{ordersError}</p>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-10 bg-surface-container-low border border-surface-variant/20 rounded-lg">
                      <p className="font-headline-md mb-2">No orders yet.</p>
                      <Link to="/" className="text-primary font-label-caps uppercase tracking-widest hover:underline">Start Shopping</Link>
                    </div>
                  ) : orders.map((order) => (
                    <div key={order.id} className="bg-white border border-surface-variant/20 rounded-lg p-6 md:p-8 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-surface-variant/30 pb-4 gap-4">
                        <div>
                          <span className="font-label-caps text-xs text-on-surface-variant block mb-1">Mã đơn hàng</span>
                          <span className="font-headline-md text-base text-primary font-bold">{order.id}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-xs text-on-surface-variant block mb-1">Ngày đặt</span>
                          <span className="text-body-md font-semibold text-primary">{order.date}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-xs text-on-surface-variant block mb-1">Trạng thái</span>
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className={`w-2 h-2 rounded-full ${order.statusColor}`}></span>
                            {order.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-label-caps text-xs text-on-surface-variant block mb-1">Tổng tiền</span>
                          <span className="text-body-md font-bold text-primary">${order.total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="divide-y divide-surface-variant/30">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-6 py-4 first:pt-0 last:pb-0">
                            <div className="w-20 h-20 bg-surface-container flex-shrink-0 overflow-hidden border border-surface-variant/30">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow flex flex-col justify-center">
                              <h4 className="font-headline-md text-base text-primary mb-1">{item.name}</h4>
                              <p className="text-on-surface-variant text-sm">Số lượng: {item.quantity} &nbsp;&bull;&nbsp; Giá: ${item.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-surface-variant/30 justify-end">
                        <Link
                          to={`/orders/${order.id}`}
                          className="px-6 py-2.5 border border-outline-variant text-primary font-label-caps text-xs uppercase hover:bg-surface-container-low transition-colors tracking-wider flex items-center justify-center"
                        >
                          Xem chi tiết đơn hàng
                        </Link>
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <Link
                            to={`/orders/${order.id}/cancel`}
                            className="px-6 py-2.5 border border-error text-error font-label-caps text-xs uppercase hover:bg-error-container transition-colors tracking-wider"
                          >
                            Hủy đơn hàng
                          </Link>
                        )}
                        {order.status === 'delivered' && !order.returnRequest?.isRequested && (
                          <Link
                            to={`/orders/${order.id}/return`}
                            className="px-6 py-2.5 border border-primary text-primary font-label-caps text-xs uppercase hover:bg-surface-container-low transition-colors tracking-wider"
                          >
                            Hoàn trả hàng
                          </Link>
                        )}
                        {order.returnRequest?.isRequested && (
                          <span className="px-6 py-2.5 border border-outline-variant text-on-surface-variant font-label-caps text-xs uppercase tracking-wider bg-surface-container-lowest opacity-70">
                            Đã yêu cầu hoàn trả
                          </span>
                        )}
                        <button className="px-6 py-2.5 bg-primary text-on-primary font-label-caps text-xs uppercase hover:bg-secondary transition-colors tracking-wider">
                          Mua lại
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="space-y-10">
                <div className="border-b border-surface-variant pb-6 flex justify-between items-end gap-4">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary mb-2">Saved Addresses</h2>
                    <p className="font-body-md text-on-surface-variant">Manage your alternate delivery points in Vietnam.</p>
                  </div>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-primary text-on-primary px-6 py-3 font-label-caps text-xs uppercase tracking-wider hover:bg-secondary transition-colors"
                    >
                      Thêm địa chỉ mới
                    </button>
                  )}
                </div>

                {/* Add Address Form Inline */}
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="bg-white border border-surface-variant/20 rounded-lg p-6 md:p-8 shadow-[0px_10px_30px_rgba(0,0,0,0.03)] space-y-8">
                    <h3 className="font-headline-md text-lg text-primary">Địa chỉ giao hàng mới</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.1em]">Họ và tên người nhận</label>
                        <input
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          className="bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                          type="text"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.1em]">Số điện thoại</label>
                        <input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                          type="tel"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.1em]">Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã)</label>
                      <input
                        value={addressForm.streetAddress}
                        onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                        className="bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                        type="text"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.1em]">Tỉnh / Thành phố</label>
                        <select
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value, city: '' })}
                          className="bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md focus:border-primary transition-colors focus:ring-0 focus:outline-none cursor-pointer w-full"
                          required
                        >
                          <option value="">-- Chọn Tỉnh / TP --</option>
                          {provinces.map((prov) => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.1em]">Quận / Huyện</label>
                        <select
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          disabled={!addressForm.state}
                          className="bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md focus:border-primary transition-colors focus:ring-0 focus:outline-none cursor-pointer w-full disabled:opacity-50"
                          required
                        >
                          <option value="">-- Chọn Quận / Huyện --</option>
                          {formDistricts.map((dist) => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-label-caps text-primary uppercase tracking-[0.1em]">ZIP Code (Mã bưu điện)</label>
                        <input
                          value={addressForm.zipCode}
                          onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                          className="bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md focus:border-primary transition-colors focus:ring-0 focus:outline-none"
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        id="isDefault"
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="rounded border-outline-variant text-primary focus:ring-0"
                      />
                      <label htmlFor="isDefault" className="font-body-md text-sm text-primary select-none cursor-pointer">Đặt làm địa chỉ giao hàng mặc định</label>
                    </div>

                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-on-surface-variant font-label-caps text-xs uppercase tracking-widest hover:text-primary transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="bg-primary text-on-primary px-8 py-3 font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-colors"
                      >
                        Lưu địa chỉ
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedAddresses.map((addr) => (
                    <div key={addr.id} className={`bg-white border rounded-lg p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between ${addr.isDefault ? 'border-primary' : 'border-surface-variant/20'}`}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <span className="font-headline-md text-base text-primary font-bold">{addr.name}</span>
                          {addr.isDefault && (
                            <span className="bg-primary text-on-primary px-2.5 py-1 text-[9px] font-label-caps uppercase tracking-wider">Mặc định</span>
                          )}
                        </div>
                        <div className="space-y-1 font-body-md text-on-surface-variant text-sm">
                          <p>SĐT: {addr.phone}</p>
                          <p>{addr.streetAddress}</p>
                          <p>{addr.city}, {addr.state}</p>
                          {addr.zipCode && <p>Mã bưu điện: {addr.zipCode}</p>}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t border-surface-variant/20 mt-6 justify-end items-center">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs font-label-caps uppercase tracking-wider text-on-surface-variant hover:text-primary"
                          >
                            Đặt mặc định
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs font-label-caps uppercase tracking-wider text-error hover:opacity-80"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-10">
                <div className="border-b border-surface-variant pb-6">
                  <h2 className="font-headline-md text-headline-md text-primary mb-2">Notifications</h2>
                  <p className="font-body-md text-on-surface-variant">Select how and when you want to receive notifications.</p>
                </div>

                {notifSuccess && (
                  <div className="bg-secondary-container text-on-secondary-container p-4 rounded border border-secondary/20 font-body-md">
                    Cấu hình thông báo đã được lưu thành công.
                  </div>
                )}

                <form onSubmit={handleSaveNotifications} className="space-y-8 bg-white border border-surface-variant/20 rounded-lg p-6 md:p-8 shadow-[0px_10px_30px_rgba(0,0,0,0.02)]">
                  <div className="divide-y divide-surface-variant/30 space-y-6">

                    <div className="flex justify-between items-center py-4 first:pt-0">
                      <div className="max-w-md pr-6">
                        <h4 className="text-body-md font-bold text-primary mb-1">Cập nhật đơn hàng</h4>
                        <p className="text-sm text-on-surface-variant opacity-70">Nhận thông báo qua email về tình trạng đơn hàng, vận chuyển và giao nhận hàng.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notificationSettings.orderUpdates}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, orderUpdates: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex justify-between items-center py-6">
                      <div className="max-w-md pr-6">
                        <h4 className="text-body-md font-bold text-primary mb-1">Thông tin khuyến mãi</h4>
                        <p className="text-sm text-on-surface-variant opacity-70">Nhận email thông báo về bộ sưu tập mới, đợt giảm giá theo mùa và sự kiện đặc biệt.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notificationSettings.promotions}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, promotions: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex justify-between items-center py-6">
                      <div className="max-w-md pr-6">
                        <h4 className="text-body-md font-bold text-primary mb-1">Bản tin định kỳ (Newsletter)</h4>
                        <p className="text-sm text-on-surface-variant opacity-70">Nhận bản tin hàng tháng chia sẻ các ý tưởng thiết kế nội thất và câu chuyện của thợ thủ công.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notificationSettings.newsletter}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, newsletter: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex justify-between items-center py-6 last:pb-0">
                      <div className="max-w-md pr-6">
                        <h4 className="text-body-md font-bold text-primary mb-1">Bảo mật tài khoản</h4>
                        <p className="text-sm text-on-surface-variant opacity-70">Nhận cảnh báo về hoạt động đăng nhập lạ và các thay đổi quan trọng trên tài khoản của bạn.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notificationSettings.securityAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, securityAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                  </div>

                  <div className="flex justify-end pt-6 border-t border-surface-variant/30">
                    <button
                      type="submit"
                      className="bg-primary text-on-primary px-12 py-4 font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-colors shadow-lg hover:shadow-xl"
                    >
                      Lưu cấu hình
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'curator' && user?.role === 'customer' && (
              <div className="space-y-10">
                <div className="border-b border-surface-variant pb-6">
                  <h2 className="font-headline-md text-headline-md text-primary mb-2">Curator Application</h2>
                  <p className="font-body-md text-on-surface-variant">Join our exclusive artisan network and manage your own collection.</p>
                </div>

                {user.vendorStatus === 'pending' ? (
                  <div className="bg-white border border-surface-variant/20 rounded-lg p-8 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] text-center space-y-6">
                    <span className="material-symbols-outlined text-secondary text-6xl animate-pulse">hourglass_empty</span>
                    <h3 className="font-headline-md text-xl text-primary font-light">Application Status: Pending Review</h3>
                    <p className="font-body-md text-on-surface-variant max-w-lg mx-auto">
                      Your application for <strong>{user.companyName || 'your atelier'}</strong> is currently being reviewed by our design curators. We will email you at <strong>{user.email}</strong> once a decision is made.
                    </p>
                    <div className="pt-2">
                      <button onClick={() => setActiveTab('profile')} className="inline-block border border-primary text-primary px-6 py-3 font-label-caps text-xs uppercase hover:bg-primary hover:text-on-primary transition-all tracking-wider">
                        Back to Profile
                      </button>
                    </div>
                  </div>
                ) : user.vendorStatus === 'rejected' ? (
                  <div className="bg-white border border-surface-variant/20 rounded-lg p-8 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] space-y-6">
                    <div className="text-center space-y-4">
                      <span className="material-symbols-outlined text-error text-6xl">cancel</span>
                      <h3 className="font-headline-md text-xl text-primary font-light">Application Status: Rejected</h3>
                      <p className="font-body-md text-on-surface-variant max-w-lg mx-auto">
                        Unfortunately, your previous application did not meet our curation criteria. However, you are welcome to revise your brand philosophy and submit a new application.
                      </p>
                    </div>
                    <div className="flex justify-center pt-4 border-t border-surface-variant/20">
                      <Link to="/vendor-register" className="bg-primary text-on-primary px-8 py-3.5 font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                        Re-Apply Now
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-surface-variant/20 rounded-lg p-8 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-headline-md text-xl text-primary font-light">Partner with Lumina</h3>
                      <p className="font-body-md text-on-surface-variant leading-relaxed">
                        Become a Lumina Curator to showcase and sell your high-end minimalist furniture designs. As a partner, you'll gain access to the <strong>Store Manager</strong> portal where you can configure products, manage inventory, and connect with design collectors worldwide.
                      </p>
                      <ul className="space-y-2 pt-2 text-sm text-on-surface-variant">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                          List architectural objects and custom furniture.
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                          Access our unified merchant dashboard.
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                          Curate designs with direct customer communication.
                        </li>
                      </ul>
                    </div>
                    <div className="pt-6 border-t border-surface-variant/20 flex justify-end">
                      <Link to="/vendor-register" className="bg-primary text-on-primary px-8 py-3.5 font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
                        Start Application
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface dark:bg-background border-t border-surface-variant dark:border-outline-variant mt-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-20 max-w-container-max mx-auto">
          <div className="md:col-span-1">
            <div className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary dark:text-primary-fixed mb-6 uppercase">Lumina Atelier</div>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container max-w-xs">Elevating spaces through architectural precision and artisanal mastery.</p>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps text-primary dark:text-primary-fixed uppercase tracking-widest mb-6">Explore</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-300">Collection</Link></li>
              <li><Link to="/" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-300">Showrooms</Link></li>
              <li><Link to="/" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-300">Artisans</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps text-primary dark:text-primary-fixed uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-300">Shipping</Link></li>
              <li><Link to="/" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-300">Privacy</Link></li>
              <li><Link to="/" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-300">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps text-primary dark:text-primary-fixed uppercase tracking-widest mb-6">Newsletter</h4>
            <div className="flex border-b border-outline-variant py-2">
              <input className="bg-transparent border-none focus:ring-0 font-body-md text-body-md w-full focus:outline-none" placeholder="Email Address" type="email" />
              <button className="material-symbols-outlined text-primary">arrow_forward</button>
            </div>
          </div>
        </div>
        <div className="px-margin-mobile md:px-margin-desktop py-8 border-t border-surface-variant dark:border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-body-md text-body-md tracking-tight text-on-surface-variant">© 2024 LUMINA MARKETPLACE. REFINED LIVING.</span>
          <div className="flex gap-8">
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">share</span>
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">language</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Settings;
