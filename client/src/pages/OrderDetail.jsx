import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await api(`/orders/${id}`);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-cream text-on-surface-variant font-label-caps uppercase tracking-widest">
        Loading Order Details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-cream">
        <p className="text-error mb-4 font-body-md">{error || 'Order not found'}</p>
        <button onClick={() => navigate('/settings')} className="text-primary font-label-caps uppercase hover:underline">Back to Orders</button>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate timeline progress
  const getTimelineProgress = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 50;
      case 'shipped': return 75;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const isCancelled = order.status === 'cancelled';
  const progressWidth = isCancelled ? 0 : getTimelineProgress(order.status);

  // Status flags
  const isConfirmed = ['processing', 'shipped', 'delivered'].includes(order.status);
  const isProcessing = ['processing', 'shipped', 'delivered'].includes(order.status);
  const isShipped = ['shipped', 'delivered'].includes(order.status);
  const isDelivered = order.status === 'delivered';

  return (
    <div className="bg-surface-cream text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary selection:text-white">
      <style>{`
        .glass-effect {
          backdrop-filter: blur(20px);
          background-color: rgba(255, 255, 255, 0.7);
        }
        .canvas-card {
          background-color: #ffffff;
          border: 1px solid rgba(196, 199, 199, 0.3);
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .canvas-card:hover {
          border-color: rgba(0, 0, 0, 0.4);
          transform: translateY(-2px);
        }
      `}</style>

      {/* TopNavBar (Fixed/Glass) */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto">
          <Link to="/" className="font-display-lg text-display-lg text-primary tracking-widest uppercase">Lumina</Link>
          <nav className="hidden md:flex items-center space-x-12">
            <Link to="/" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors">Collections</Link>
            <Link to="/" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors">Designers</Link>
            <Link to="/" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors">Showrooms</Link>
          </nav>
          <div className="flex items-center space-x-6">
            <button className="hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">search</span>
            </button>
            <Link to="/settings" className="hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">person</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Layout Wrapper */}
      <div className="flex pt-24 max-w-container-max mx-auto min-h-screen w-full">
        {/* SideNavBar (Sticky) */}
        <aside className="w-64 h-screen sticky top-24 py-margin-desktop flex flex-col space-y-2 border-r border-outline-variant/30 hidden md:flex flex-shrink-0">
          <div className="px-8 mb-8">
            <h2 className="font-headline-md text-headline-md text-primary">Account Settings</h2>
            <p className="font-body-md text-body-md text-on-surface-variant opacity-70">Manage your atelier preferences</p>
          </div>
          <nav className="flex flex-col">
            <Link to="/settings" className="flex items-center px-8 py-4 text-on-surface-variant hover:bg-surface-container-lowest transition-all">
              <span className="material-symbols-outlined mr-4">person</span>
              <span>Profile</span>
            </Link>
            <Link to="/settings" className="flex items-center px-8 py-4 text-primary font-bold border-r-2 border-primary bg-surface-container-low transition-all">
              <span className="material-symbols-outlined mr-4">shopping_bag</span>
              <span>Orders</span>
            </Link>
            <Link to="/settings" className="flex items-center px-8 py-4 text-on-surface-variant hover:bg-surface-container-lowest transition-all">
              <span className="material-symbols-outlined mr-4">location_on</span>
              <span>Addresses</span>
            </Link>
            <Link to="/settings" className="flex items-center px-8 py-4 text-on-surface-variant hover:bg-surface-container-lowest transition-all">
              <span className="material-symbols-outlined mr-4">notifications_active</span>
              <span>Notifications</span>
            </Link>
            <button onClick={logout} className="flex items-center px-8 py-4 text-on-surface-variant hover:bg-surface-container-lowest transition-all text-left">
              <span className="material-symbols-outlined mr-4">logout</span>
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-margin-mobile md:px-margin-desktop py-margin-desktop pb-32">
          {/* Breadcrumb */}
          <nav className="mb-12">
            <ul className="flex flex-wrap items-center space-x-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
              <li><Link to="/settings" className="hover:text-primary transition-colors">Account</Link></li>
              <li className="opacity-30">/</li>
              <li><Link to="/settings" className="hover:text-primary transition-colors">Order History</Link></li>
              <li className="opacity-30">/</li>
              <li className="text-primary">Order #{order._id.slice(-6).toUpperCase()}</li>
            </ul>
          </nav>

          {/* Order Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <h1 className="font-display-lg text-display-lg text-primary mb-2">Order #{order._id.slice(-6).toUpperCase()}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Placed on {orderDate}</p>
            </div>
            <div className={`inline-flex items-center px-6 py-2 text-white font-label-caps text-label-caps uppercase ${isCancelled ? 'bg-error' : 'bg-primary'}`}>
              {order.status}
            </div>
          </header>

          {/* Tracking Timeline */}
          {!isCancelled && (
            <section className="mb-24 overflow-x-auto pb-4">
              <div className="relative flex justify-between min-w-[600px]">
                {/* Connector Line */}
                <div className="absolute top-4 left-0 w-full h-[1px] bg-outline-variant/30 z-0"></div>
                <div className="absolute top-4 left-0 h-[1px] bg-primary z-0 transition-all duration-1000" style={{ width: `${progressWidth}%` }}></div>

                {/* Steps */}
                <div className="relative z-10 flex flex-col items-center group">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mb-4">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'wght' 600" }}>check</span>
                  </div>
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary">Order Placed</span>
                  <span className="text-[10px] text-on-surface-variant mt-1">{orderDate}</span>
                </div>

                <div className={`relative z-10 flex flex-col items-center group ${isConfirmed ? '' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-4 ${isConfirmed ? 'bg-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {isConfirmed ? (
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'wght' 600" }}>check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">pending</span>
                    )}
                  </div>
                  <span className={`font-label-caps text-label-caps uppercase tracking-wider ${isConfirmed ? 'text-primary' : ''}`}>Confirmed</span>
                </div>

                <div className={`relative z-10 flex flex-col items-center group ${isProcessing ? '' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-4 ${isProcessing ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {order.status === 'processing' ? (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    ) : isProcessing ? (
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'wght' 600" }}>check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">pending_actions</span>
                    )}
                  </div>
                  <span className={`font-label-caps text-label-caps uppercase tracking-wider ${isProcessing ? 'text-primary' : ''}`}>Processing</span>
                  {order.status === 'processing' && <span className="text-[10px] text-on-surface-variant mt-1">Estimated: 3-5 days</span>}
                </div>

                <div className={`relative z-10 flex flex-col items-center group ${isShipped ? '' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-4 ${isShipped ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {isDelivered ? (
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'wght' 600" }}>check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    )}
                  </div>
                  <span className={`font-label-caps text-label-caps uppercase tracking-wider ${isShipped ? 'text-primary' : ''}`}>Shipped</span>
                </div>

                <div className={`relative z-10 flex flex-col items-center group ${isDelivered ? '' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-4 ${isDelivered ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[16px]">home</span>
                  </div>
                  <span className={`font-label-caps text-label-caps uppercase tracking-wider ${isDelivered ? 'text-primary' : ''}`}>Delivered</span>
                </div>
              </div>
            </section>
          )}

          {/* Bento Grid Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            {/* Left: Items List (2 cols) */}
            <div className="lg:col-span-2 space-y-gutter">
              <h3 className="font-label-caps text-label-caps uppercase tracking-[0.2em] mb-4 text-on-surface-variant">Order Items</h3>

              {order.items.map((orderItem) => (
                <div key={orderItem._id} className="canvas-card p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-48 h-48 bg-surface-container-low overflow-hidden flex-shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src={orderItem.item?.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80'}
                      alt={orderItem.item?.name}
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-2">
                      <div>
                        <h4 className="font-headline-md text-headline-md text-primary">{orderItem.item?.name}</h4>
                        {orderItem.item?.store && <p className="text-on-surface-variant text-sm mt-1">Sold by Store</p>}
                      </div>
                      <p className="font-body-lg text-body-lg text-primary font-semibold">{orderItem.price.toLocaleString()} đ</p>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant pt-4 border-t border-outline-variant/30">
                      <span className="font-label-caps text-label-caps uppercase">Qty: {orderItem.quantity}</span>
                      <span className="font-label-caps text-label-caps uppercase">Subtotal: {(orderItem.price * orderItem.quantity).toLocaleString()} đ</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Shipping & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mt-12">
                <div className="canvas-card p-8 flex flex-col h-full">
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant mb-6">Shipping Address</h3>
                  <p className="text-primary leading-relaxed flex-1">
                    {order.customer?.fullName || 'Customer'}<br />
                    {order.shippingAddress?.streetAddress}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                    Vietnam
                  </p>
                  <div className="mt-8 pt-8 border-t border-outline-variant/30">
                    <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">Shipping Method</h4>
                    <p className="text-primary font-bold">Standard Delivery</p>
                  </div>
                </div>

                <div className="canvas-card p-8 flex flex-col h-full">
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant mb-6">Payment Method</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-8 bg-surface-container-high rounded-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">credit_card</span>
                    </div>
                    <p className="text-primary">Visa ending in •••• 4821</p>
                  </div>
                  <p className="text-on-surface-variant">Billing matches shipping address</p>
                </div>
              </div>
            </div>

            {/* Right: Summary & Actions (1 col) */}
            <div className="space-y-gutter">
              <h3 className="font-label-caps text-label-caps uppercase tracking-[0.2em] mb-4 text-on-surface-variant">Order Summary</h3>

              {/* Financial Breakdown */}
              <div className="canvas-card p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Subtotal</span>
                    <span className="text-primary">{order.totalAmount.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Shipping</span>
                    <span className="text-primary">0 đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Estimated Tax (0%)</span>
                    <span className="text-primary">0 đ</span>
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-primary flex justify-between items-baseline">
                  <span className="font-headline-md text-headline-md text-primary uppercase">Total</span>
                  <span className="font-display-lg text-display-lg text-primary">{order.totalAmount.toLocaleString()} đ</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => toast.success('Invoice downloading...')}
                  className="w-full bg-primary text-white py-5 font-label-caps text-label-caps uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined mr-3 text-sm">download</span>
                  Download Invoice
                </button>
                <button
                  onClick={() => toast.success('Concierge team has been notified.')}
                  className="w-full border border-primary text-primary py-5 font-label-caps text-label-caps uppercase tracking-[0.2em] hover:bg-surface-container-low transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined mr-3 text-sm">support_agent</span>
                  Contact Concierge
                </button>
                {order.status === 'delivered' && !order.returnRequest?.isRequested && (
                  <Link
                    to={`/orders/${order._id}/return`}
                    className="w-full block text-center text-on-surface-variant py-4 font-label-caps text-label-caps uppercase tracking-[0.2em] hover:underline transition-all"
                  >
                    Return Request
                  </Link>
                )}
                {order.returnRequest?.isRequested && (
                  <div className="w-full text-center text-on-surface-variant py-4 font-label-caps text-label-caps uppercase tracking-[0.2em]">
                    Return Requested
                  </div>
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <Link
                    to={`/orders/${order._id}/cancel`}
                    className="w-full block text-center text-error py-4 font-label-caps text-label-caps uppercase tracking-[0.2em] hover:underline transition-all"
                  >
                    Cancel Order
                  </Link>
                )}
              </div>

              {/* Help Section */}
              <div className="canvas-card p-8 bg-surface-container-low border-none">
                <h4 className="font-label-caps text-label-caps uppercase text-primary mb-4">Concierge Support</h4>
                <p className="text-on-surface-variant mb-6 text-sm">Our dedicated atelier team is available for custom installation scheduling and white glove logistics.</p>
                <button onClick={() => toast.success('Connecting to advisor...')} className="text-primary font-bold inline-flex items-center group">
                  Speak with an Advisor
                  <span className="material-symbols-outlined ml-2 transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full py-16 bg-surface-container-lowest border-t border-outline-variant/30 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex flex-col space-y-6">
            <div className="font-label-caps text-label-caps text-primary tracking-[0.3em] uppercase">Lumina Atelier</div>
            <p className="text-on-surface-variant max-w-xs text-sm">Curating essential architectural pieces for the modern interior.</p>
            <p className="text-on-surface-variant opacity-50 text-xs">© 2024 Lumina Atelier. All rights reserved.</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col space-y-4">
              <h5 className="font-label-caps text-label-caps text-primary uppercase mb-2">Shop</h5>
              <Link to="/" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Collections</Link>
              <Link to="/" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Designers</Link>
              <Link to="/" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Showrooms</Link>
            </div>
            <div className="flex flex-col space-y-4">
              <h5 className="font-label-caps text-label-caps text-primary uppercase mb-2">Service</h5>
              <Link to="/" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Support</Link>
              <Link to="/" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Concierge</Link>
              <Link to="/" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Care Guide</Link>
            </div>
          </div>
          <div className="flex flex-col space-y-6">
            <h5 className="font-label-caps text-label-caps text-primary uppercase">Newsletter</h5>
            <p className="text-on-surface-variant text-sm">Join our atelier circle for early access and design insights.</p>
            <form className="flex border-b border-primary pb-2" onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed'); }}>
              <input className="bg-transparent border-none focus:ring-0 w-full placeholder:text-on-surface-variant/40 text-sm outline-none" placeholder="email@address.com" type="email" required />
              <button type="submit" className="material-symbols-outlined text-primary">east</button>
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrderDetail;
