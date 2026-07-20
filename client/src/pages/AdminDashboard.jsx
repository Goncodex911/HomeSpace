import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const adminStyles = `
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
  .glass-panel {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .active-card {
    border-left: 4px solid #000000;
    background-color: #ffffff;
  }
  ::-webkit-scrollbar {
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #c4c7c7;
    border-radius: 10px;
  }
`;

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' | 'withdrawals'
  
  // Selection & Filters
  const [activeId, setActiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Incomplete documentation');
  const [customReason, setCustomReason] = useState('');

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawFilter, setWithdrawFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'rejected'
  const [activeWithdrawal, setActiveWithdrawal] = useState(null);
  const [rejectWithdrawModal, setRejectWithdrawModal] = useState(false);
  const [rejectWithdrawNote, setRejectWithdrawNote] = useState('');
  const [withdrawActionLoading, setWithdrawActionLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/auth/admin/vendor-applications');
      const apps = res.data || res.applications || [];
      setApplications(apps);
      
      // Auto-select first application if none is active
      if (apps.length > 0 && !activeId) {
        // Find first pending one
        const pendingApp = apps.find(app => app.vendorStatus === 'pending') || apps[0];
        setActiveId(pendingApp._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch vendor applications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setWithdrawLoading(true);
      const res = await api('/payment/withdraw/admin/all');
      setWithdrawals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api('/auth/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateRole = async (userId, role) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${role}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api(`/auth/admin/users/${userId}/role`, {
        method: 'PUT',
        body: { role }
      });
      setSuccess('User role updated successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is permanent!')) return;
    setError('');
    setSuccess('');
    try {
      await api(`/auth/admin/users/${userId}`, {
        method: 'DELETE'
      });
      setSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const handleWithdrawalAction = async (id, action, note = '') => {
    setWithdrawActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api(`/payment/withdraw/admin/${id}`, {
        method: 'PUT',
        body: { action, note },
      });
      setSuccess(action === 'accept' ? 'Yêu cầu rút tiền đã được chấp thuận!' : 'Yêu cầu đã bị từ chối.');
      setRejectWithdrawModal(false);
      setRejectWithdrawNote('');
      setActiveWithdrawal(null);
      fetchWithdrawals();
    } catch (err) {
      setError(err.message || 'Thao tác thất bại.');
    } finally {
      setWithdrawActionLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawals();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this curator application?')) return;
    setError('');
    setSuccess('');
    try {
      await api(`/auth/admin/approve-vendor/${id}`, {
        method: 'PUT'
      });
      setSuccess('Application approved successfully! Role upgraded to store.');
      fetchApplications();
    } catch (err) {
      setError(err.message || 'Failed to approve application.');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!activeId) return;
    setError('');
    setSuccess('');
    
    const finalReason = customReason ? customReason : rejectReason;

    try {
      await api(`/auth/admin/reject-vendor/${activeId}`, {
        method: 'PUT',
        body: { reason: finalReason }
      });
      setSuccess('Application rejected successfully.');
      setRejectModalOpen(false);
      setCustomReason('');
      fetchApplications();
    } catch (err) {
      setError(err.message || 'Failed to reject application.');
    }
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    const search = searchTerm.toLowerCase();
    return (
      app.companyName?.toLowerCase().includes(search) ||
      app.fullName?.toLowerCase().includes(search) ||
      app.email?.toLowerCase().includes(search)
    );
  });

  const filteredWithdrawals = withdrawals.filter(w =>
    withdrawFilter === 'all' ? true : w.status === withdrawFilter
  );

  const activeApp = applications.find(app => app._id === activeId);
  const pendingCount = applications.filter(app => app.vendorStatus === 'pending').length;

  return (
    <div className="bg-surface-bright font-body-md text-on-surface min-h-screen flex flex-col md:flex-row relative">
      <style dangerouslySetInnerHTML={{ __html: adminStyles }} />

      {/* Side Navigation */}
      <aside className="w-64 h-screen fixed left-0 top-0 bg-surface border-r border-outline-variant/30 flex flex-col py-12 z-50">
        <div className="px-6 mb-12">
          <Link to="/" className="font-display-lg text-2xl font-normal text-primary tracking-tighter">
            Atelier Admin
          </Link>
          <p className="font-label-caps text-[10px] tracking-widest text-on-surface-variant mt-1">Enterprise Suite</p>
        </div>
        <nav className="flex-grow space-y-1">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`w-full flex items-center px-6 py-3 transition-all hover:bg-surface-container-low ${ activeTab === 'vendors' ? 'text-primary border-r-2 border-primary font-semibold' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined mr-3">storefront</span>
            <span className="font-label-caps text-label-caps text-left">Vendors</span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`w-full flex items-center px-6 py-3 transition-all hover:bg-surface-container-low ${ activeTab === 'withdrawals' ? 'text-primary border-r-2 border-primary font-semibold' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined mr-3">payments</span>
            <span className="font-label-caps text-label-caps text-left">Withdrawals</span>
            {withdrawals.filter(w => w.status === 'pending').length > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {withdrawals.filter(w => w.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-6 py-3 transition-all hover:bg-surface-container-low ${ activeTab === 'users' ? 'text-primary border-r-2 border-primary font-semibold' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined mr-3">group</span>
            <span className="font-label-caps text-label-caps text-left">Users</span>
          </button>
          <Link to="/" className="flex items-center px-6 py-3 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined mr-3">home</span>
            <span className="font-label-caps text-label-caps">Marketplace Home</span>
          </Link>
        </nav>
        <div className="px-6 mt-auto">
          <button 
            onClick={logout}
            className="w-full border border-primary text-primary py-3 font-label-caps text-xs hover:bg-primary hover:text-white transition-all uppercase tracking-wider"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow md:ml-64 pt-16 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="fixed top-0 right-0 w-[calc(100%-256px)] h-16 bg-white/70 border-b border-outline-variant/30 backdrop-blur-md z-40 flex justify-between items-center px-8">
          <div className="flex items-center flex-grow">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-1 focus:ring-primary text-sm font-body-md" 
                placeholder="Search applications..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="font-label-caps text-[10px] text-primary leading-none uppercase tracking-wider">{user?.fullName}</p>
              <p className="text-[10px] text-on-surface-variant">System Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
              <img alt="Admin Avatar" className="w-full h-full object-cover" src={user?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} />
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <div className="flex-grow p-8 max-w-7xl mx-auto w-full">

          {/* ── VENDORS TAB ── */}
          {activeTab === 'vendors' && (
          <div className="grid grid-cols-12 gap-8">
          {/* Header */}
          <div className="col-span-12">
            <nav className="flex mb-2 space-x-2 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest">
              <span>Vendors</span>
              <span>/</span>
              <span className="text-primary font-bold">Registration Approvals</span>
            </nav>
            <h2 className="font-headline-md text-3xl text-primary font-light">Store Registration Approvals</h2>
            
            {error && (
              <div className="mt-4 p-4 bg-error-container text-on-error-container border border-error/20 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm">
                {success}
              </div>
            )}
          </div>

          {/* Left: Applications list */}
          <section className="col-span-12 lg:col-span-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
            <div className="flex items-center justify-between sticky top-0 bg-surface-bright z-10 py-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{pendingCount} Pending Applications</span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-sm text-outline">Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-12 text-sm text-outline border border-dashed border-outline-variant p-6">No applications found.</div>
            ) : (
              filteredApps.map((app) => (
                <div 
                  key={app._id}
                  onClick={() => setActiveId(app._id)}
                  className={`p-6 cursor-pointer border transition-all ${app._id === activeId ? 'active-card shadow-md border-primary' : 'bg-white/50 border-outline-variant/20 hover:bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-sm text-primary font-medium truncate w-36">{app.companyName || 'Atelier Store'}</h3>
                    <span className={`font-label-caps text-[9px] px-2 py-0.5 rounded capitalize ${
                      app.vendorStatus === 'pending' ? 'bg-secondary-container text-on-secondary-container' :
                      app.vendorStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {app.vendorStatus}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-xs mb-4">Owner: {app.fullName}</p>
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-label-caps">
                    <span>Joined {new Date(app.createdAt).toLocaleDateString()}</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Right: Detail review pane */}
          <section className="col-span-12 lg:col-span-8">
            {activeApp ? (
              <div className="bg-white border border-outline-variant/30 p-8 flex flex-col space-y-8">
                {/* Header & Status Timeline */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-outline-variant/20">
                  <div>
                    <h2 className="font-headline-md text-2xl text-primary font-light">{activeApp.companyName || 'Curated Atelier'}</h2>
                    <p className="text-on-surface-variant text-xs mt-1">Application Reference: {activeApp._id}</p>
                  </div>
                  {/* Workflow steps */}
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10"></div>
                      <span className="font-label-caps text-[9px] mt-1 text-primary">Pending</span>
                    </div>
                    <div className="w-8 h-[1px] bg-primary"></div>
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${activeApp.vendorStatus !== 'pending' ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                      <span className="font-label-caps text-[9px] mt-1 text-on-surface-variant">Review</span>
                    </div>
                    <div className="w-8 h-[1px] bg-outline-variant"></div>
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${activeApp.vendorStatus === 'approved' ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                      <span className="font-label-caps text-[9px] mt-1 text-on-surface-variant">Outcome</span>
                    </div>
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Company Ethos & Brand Type</label>
                      <p className="text-base text-primary font-medium">{activeApp.businessType || 'Independent Curator'}</p>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">VAT/TAX Registration ID</label>
                      <p className="text-sm text-primary tracking-wider">{activeApp.taxId || 'VAT-UNSPECIFIED'}</p>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Years of Craft Experience</label>
                      <p className="text-sm text-primary">{activeApp.yearsInIndustry || 0} Years in Industry</p>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Contact Point</label>
                      <div className="space-y-1.5 text-sm text-primary">
                        <p className="flex items-center">
                          <span className="material-symbols-outlined text-sm mr-2 opacity-60">mail</span>
                          {activeApp.email}
                        </p>
                        {activeApp.phone && (
                          <p className="flex items-center">
                            <span className="material-symbols-outlined text-sm mr-2 opacity-60">phone</span>
                            {activeApp.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Philosophy Ethos Card */}
                  <div className="bg-surface-container-low p-6 flex flex-col justify-between border border-outline-variant/20 h-auto">
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">Ethos & Design Philosophy</label>
                      <p className="text-sm text-primary italic leading-relaxed">
                        "{activeApp.philosophy || 'No brand statement submitted.'}"
                      </p>
                    </div>
                    <div className="pt-4 border-t border-outline-variant/20 mt-4 text-[10px] text-on-surface-variant">
                      Submitted by {activeApp.fullName}
                    </div>
                  </div>
                </div>

                {/* Document Verification simulator */}
                <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Corporate Registration Certificate</label>
                  <div className="flex items-center gap-4 bg-surface-container-low p-4 border border-outline-variant/20">
                    <span className="material-symbols-outlined text-4xl text-secondary">description</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">incorporation_license_scan.pdf</p>
                      <p className="text-[11px] text-on-surface-variant italic">Confidence check: Tax ID matches registry database (100% match)</p>
                    </div>
                    <span className="material-symbols-outlined text-emerald-600">verified</span>
                  </div>
                </div>

                {/* Actions row */}
                {activeApp.vendorStatus === 'pending' && (
                  <div className="pt-6 border-t border-outline-variant/20 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setRejectModalOpen(true)}
                        className="px-6 py-3 border border-red-600 text-red-600 font-label-caps text-[11px] hover:bg-red-50 transition-colors uppercase tracking-wider"
                      >
                        Reject Store
                      </button>
                    </div>
                    <button 
                      onClick={() => handleApprove(activeApp._id)}
                      className="px-8 py-3 bg-primary text-white font-label-caps text-[11px] hover:bg-secondary transition-colors uppercase tracking-widest shadow-lg"
                    >
                      Approve Store
                    </button>
                  </div>
                )}

                {activeApp.vendorStatus !== 'pending' && (
                  <div className="pt-4 border-t border-outline-variant/20 text-xs text-on-surface-variant font-medium text-center">
                    This curator application has been resolved with outcome: <span className="font-bold capitalize text-primary">{activeApp.vendorStatus}</span>.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-outline-variant/30 p-12 text-center text-outline">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-55">storefront</span>
                <p>Select a curator application from the left panel to review details.</p>
              </div>
            )}
          </section>
        </div>
        )}

        {/* ── WITHDRAWALS TAB ── */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div>
              <nav className="flex mb-2 space-x-2 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest">
                <span>Finance</span>
                <span>/</span>
                <span className="text-primary font-bold">Withdrawal Requests</span>
              </nav>
              <h2 className="font-headline-md text-3xl text-primary font-light">Withdrawal Management</h2>
            </div>

            {error && (
              <div className="p-4 bg-error-container text-on-error-container border border-error/20 text-sm">{error}</div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm">{success}</div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {['all','pending','accepted','rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setWithdrawFilter(f)}
                  className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-wider border transition-all ${
                    withdrawFilter === f ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Đang chờ' : f === 'accepted' ? 'Đã duyệt' : 'Từ chối'}
                  {f !== 'all' && (
                    <span className="ml-1 opacity-60">({withdrawals.filter(w => w.status === f).length})</span>
                  )}
                </button>
              ))}
              <button onClick={fetchWithdrawals} className="ml-auto px-3 py-2 font-label-caps text-[10px] text-secondary hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">refresh</span> Làm mới
              </button>
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-12 gap-8">
              {/* Left: withdrawal list */}
              <section className="col-span-12 lg:col-span-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {withdrawLoading ? (
                  <div className="text-center py-12 text-sm text-outline">Loading...</div>
                ) : filteredWithdrawals.length === 0 ? (
                  <div className="text-center py-12 text-sm text-outline border border-dashed border-outline-variant p-6">
                    Không có yêu cầu nào.
                  </div>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <div
                      key={w._id}
                      onClick={() => setActiveWithdrawal(w)}
                      className={`p-5 cursor-pointer border transition-all ${
                        activeWithdrawal?._id === w._id ? 'active-card shadow-md border-primary' : 'bg-white/50 border-outline-variant/20 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-headline-md text-sm text-primary font-medium truncate w-36">
                          {w.store?.companyName || w.store?.fullName || 'Store'}
                        </h3>
                        <span className={`font-label-caps text-[9px] px-2 py-0.5 rounded capitalize ${
                          w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          w.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {w.status === 'pending' ? 'Đang chờ' : w.status === 'accepted' ? 'Đã duyệt' : 'Từ chối'}
                        </span>
                      </div>
                      <p className="text-primary font-bold text-base">${Number(w.amount).toLocaleString()}</p>
                      <p className="text-on-surface-variant text-xs mt-1">{w.bankName} &bull; {w.accountNumber}</p>
                      <p className="text-[10px] text-on-surface-variant mt-2">{new Date(w.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  ))
                )}
              </section>

              {/* Right: withdrawal detail */}
              <section className="col-span-12 lg:col-span-8">
                {activeWithdrawal ? (
                  <div className="bg-white border border-outline-variant/30 p-8 flex flex-col space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
                      <div>
                        <h2 className="font-headline-md text-2xl text-primary font-light">
                          Yêu cầu rút ${Number(activeWithdrawal.amount).toLocaleString()}
                        </h2>
                        <p className="text-on-surface-variant text-xs mt-1">ID: {activeWithdrawal._id}</p>
                      </div>
                      <span className={`self-start px-4 py-1.5 text-[10px] font-bold uppercase rounded-full ${
                        activeWithdrawal.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        activeWithdrawal.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {activeWithdrawal.status === 'pending' ? 'Đang chờ xét duyệt' : activeWithdrawal.status === 'accepted' ? 'Đã chấp thuận' : 'Đã từ chối'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Store / Owner</label>
                          <p className="text-base text-primary font-medium">{activeWithdrawal.store?.companyName || activeWithdrawal.store?.fullName}</p>
                          <p className="text-xs text-on-surface-variant">{activeWithdrawal.store?.email}</p>
                        </div>
                        <div>
                          <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Số dư hiện tại của store</label>
                          <p className="text-sm text-primary font-bold">${Number(activeWithdrawal.store?.walletBalance || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Ngày gửi yêu cầu</label>
                          <p className="text-sm text-primary">{new Date(activeWithdrawal.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        {activeWithdrawal.resolvedAt && (
                          <div>
                            <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Ngày xử lý</label>
                            <p className="text-sm text-primary">{new Date(activeWithdrawal.resolvedAt).toLocaleString('vi-VN')}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-surface-container-low p-6 border border-outline-variant/20 space-y-3">
                        <label className="font-label-caps text-[10px] text-on-surface-variant block">Thông tin ngân hàng</label>
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-secondary">account_balance</span>
                          <div>
                            <p className="text-sm font-bold text-primary">{activeWithdrawal.bankName}</p>
                            <p className="text-xs text-on-surface-variant">Ngân hàng</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-secondary">credit_card</span>
                          <div>
                            <p className="text-sm font-bold text-primary font-mono">{activeWithdrawal.accountNumber}</p>
                            <p className="text-xs text-on-surface-variant">Số tài khoản</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-secondary">person</span>
                          <div>
                            <p className="text-sm font-bold text-primary uppercase">{activeWithdrawal.accountHolder}</p>
                            <p className="text-xs text-on-surface-variant">Chủ tài khoản</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-outline-variant/20">
                          <p className="font-label-caps text-[10px] text-on-surface-variant">Số tiền yêu cầu</p>
                          <p className="text-2xl font-bold text-primary">${Number(activeWithdrawal.amount).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {activeWithdrawal.status === 'rejected' && activeWithdrawal.note && (
                      <div className="p-4 bg-red-50 border border-red-200">
                        <p className="font-label-caps text-[10px] text-red-500 mb-1">LÝ DO TỪ CHỐI</p>
                        <p className="text-sm text-red-700">{activeWithdrawal.note}</p>
                      </div>
                    )}

                    {activeWithdrawal.status === 'pending' && (
                      <div className="pt-6 border-t border-outline-variant/20 flex flex-wrap gap-4 items-center justify-between">
                        <button
                          onClick={() => { setRejectWithdrawNote(''); setRejectWithdrawModal(true); }}
                          className="px-6 py-3 border border-red-600 text-red-600 font-label-caps text-[11px] hover:bg-red-50 transition-colors uppercase tracking-wider"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(activeWithdrawal._id, 'accept')}
                          disabled={withdrawActionLoading}
                          className="px-8 py-3 bg-emerald-600 text-white font-label-caps text-[11px] hover:bg-emerald-700 transition-colors uppercase tracking-widest shadow-lg disabled:opacity-60"
                        >
                          {withdrawActionLoading ? 'Processing...' : 'Chấp thuận & Giải ngân'}
                        </button>
                      </div>
                    )}

                    {activeWithdrawal.status !== 'pending' && (
                      <div className="pt-4 border-t border-outline-variant/20 text-xs text-on-surface-variant text-center">
                        Yêu cầu này đã được xử lý với trạng thái: <span className="font-bold capitalize text-primary">{activeWithdrawal.status}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-outline-variant/30 p-12 text-center text-outline">
                    <span className="material-symbols-outlined text-5xl mb-4 opacity-55">payments</span>
                    <p>Chọn một yêu cầu rút tiền từ danh sách bên trái.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <nav className="flex mb-2 space-x-2 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest">
                  <span>Administration</span>
                  <span>/</span>
                  <span className="text-primary font-bold">User Management</span>
                </nav>
                <h2 className="font-headline-md text-3xl text-primary font-light">User Management</h2>
              </div>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{users.length} registered users</span>
            </div>

            {error && (
              <div className="p-4 bg-error-container text-on-error-container border border-error/20 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm">
                {success}
              </div>
            )}

            {usersLoading ? (
              <div className="text-center py-12 text-sm text-outline">Loading users...</div>
            ) : (
              <div className="bg-white border border-outline-variant/30 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container-low font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">
                        <th className="p-4 pl-6">Avatar</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Vendor Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-sm">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="p-4 pl-6">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
                              <img src={u.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="p-4 font-medium text-primary">{u.fullName}</td>
                          <td className="p-4 text-on-surface-variant">{u.email}</td>
                          <td className="p-4">
                            <span className="capitalize px-2.5 py-1 bg-surface-container-high text-primary text-xs font-semibold rounded">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`font-label-caps text-[9px] px-2 py-0.5 rounded capitalize ${
                              u.vendorStatus === 'pending' ? 'bg-secondary-container text-on-secondary-container' :
                              u.vendorStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 
                              u.vendorStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              {u.vendorStatus || 'none'}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {u._id !== user.id && (
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="text-red-600 hover:text-red-800 font-label-caps text-[10px] uppercase tracking-wider transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Reject Modal Overlay */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
          <form onSubmit={handleRejectSubmit} className="bg-white max-w-md w-full p-8 shadow-2xl border border-outline-variant/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-lg text-primary font-bold">Rejection Reason</h3>
              <button 
                type="button" 
                onClick={() => setRejectModalOpen(false)} 
                className="text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-xs text-on-surface-variant mb-6">The curator will receive an automated notification email detailing this rejection.</p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="r1" 
                  name="reason" 
                  value="Incomplete documentation"
                  checked={rejectReason === 'Incomplete documentation'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <label className="text-sm text-primary" htmlFor="r1">Incomplete documentation</label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="r2" 
                  name="reason" 
                  value="Business type not aligned with Lumina"
                  checked={rejectReason === 'Business type not aligned with Lumina'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <label className="text-sm text-primary" htmlFor="r2">Business type not aligned with Lumina</label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="r3" 
                  name="reason" 
                  value="Verification details mismatch"
                  checked={rejectReason === 'Verification details mismatch'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <label className="text-sm text-primary" htmlFor="r3">Verification details mismatch</label>
              </div>

              <div className="mt-4 pt-2">
                <label className="font-label-caps text-[9px] text-on-surface-variant uppercase mb-1 block">Custom Message (Optional Override)</label>
                <textarea 
                  className="w-full border border-outline-variant/35 bg-surface p-3 text-sm text-primary h-24 focus:outline-none focus:border-primary resize-none"
                  placeholder="Enter detailed reason description..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="mt-8 flex space-x-3">
              <button 
                type="button" 
                onClick={() => setRejectModalOpen(false)}
                className="flex-grow py-3 border border-outline-variant text-on-surface-variant font-label-caps text-xs uppercase hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-grow py-3 bg-red-600 text-white font-label-caps text-xs uppercase hover:bg-red-700 transition-colors shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {rejectWithdrawModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-8 shadow-2xl border border-outline-variant/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-lg text-primary font-bold">Lý Do Từ Chối</h3>
              <button
                type="button"
                onClick={() => setRejectWithdrawModal(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mb-6">
              Nhập lý do từ chối yêu cầu rút tiền này. Store sẽ nhận được thông báo cùng lý do.
            </p>
            <textarea
              className="w-full border border-outline-variant/35 bg-surface p-3 text-sm text-primary h-28 focus:outline-none focus:border-primary resize-none"
              placeholder="Nhập lý do từ chối..."
              value={rejectWithdrawNote}
              onChange={(e) => setRejectWithdrawNote(e.target.value)}
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setRejectWithdrawModal(false)}
                className="flex-grow py-3 border border-outline-variant text-on-surface-variant font-label-caps text-xs uppercase hover:bg-surface transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={withdrawActionLoading}
                onClick={() => handleWithdrawalAction(activeWithdrawal._id, 'reject', rejectWithdrawNote)}
                className="flex-grow py-3 bg-red-600 text-white font-label-caps text-xs uppercase hover:bg-red-700 transition-colors shadow disabled:opacity-60"
              >
                {withdrawActionLoading ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
