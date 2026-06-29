import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';

const CancelOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [confirmPolicy, setConfirmPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await api(`/orders/${id}`);
      if (data.status !== 'pending' && data.status !== 'processing') {
        setError('This order cannot be cancelled at this stage.');
      }
      setOrder(data);
    } catch (err) {
      setError('Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!reason || !confirmPolicy) return;

    setIsSubmitting(true);
    try {
      await api(`/orders/${id}/cancel`, {
        method: 'PUT',
        body: { reason, details }
      });
      navigate('/settings', { state: { activeTab: 'orders' } });
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-cream font-label-caps uppercase tracking-widest text-on-surface-variant">
        Loading...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-cream">
        <p className="text-error mb-4 font-body-md">{error || 'Order not found'}</p>
        <button onClick={() => navigate(-1)} className="text-primary font-label-caps uppercase hover:underline">Go Back</button>
      </div>
    );
  }

  const shippingCost = 150; // Mocked, similar to checkout
  const subtotal = order.totalAmount;
  const totalRefund = subtotal + shippingCost + (subtotal * 0.08); // Include shipping and tax

  return (
    <div className="bg-surface-cream text-on-background font-body-md min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-glass-bg border-b border-outline-variant/30 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto transition-all duration-300 ease-in-out">
        <Link to="/" className="font-display-lg text-display-lg text-primary tracking-widest uppercase">Lumina</Link>
        <div className="flex items-center gap-6">
          <Link to="/settings" className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity">person</Link>
        </div>
      </header>

      <div className="flex pt-24 min-h-screen">
        {/* Main Content Area */}
        <main className="flex-1 px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-on-surface-variant mb-4">
              <Link to="/settings" state={{ activeTab: 'orders' }} className="hover:text-primary transition-colors font-label-caps uppercase">Orders</Link>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary font-semibold font-label-caps uppercase">Cancel Order</span>
            </div>
            <h1 className="font-display-lg text-display-lg text-primary">Cancel Order</h1>
            <p className="text-on-surface-variant mt-2 max-w-2xl">We're sorry to hear you'd like to cancel. Please provide a reason below so we can improve our atelier service.</p>
          </div>

          {/* Bento Grid Layout for Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

            {/* Order Summary Card */}
            <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 p-8 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-label-caps text-label-caps text-[#5d4037] uppercase tracking-widest">Order Details</span>
                  <h3 className="font-headline-md text-headline-md mt-1">#{order._id.slice(-6).toUpperCase()}</h3>
                </div>
                <div className="text-right">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Placed On</span>
                  <p className="font-body-md">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="divide-y divide-outline-variant/20 border-y border-outline-variant/20">
                {order.items.map((orderItem) => (
                  <div key={orderItem._id} className="flex gap-6 items-center py-6">
                    <div className="w-24 h-24 bg-surface-container overflow-hidden flex-shrink-0">
                      <img
                        src={orderItem.item?.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80'}
                        alt={orderItem.item?.name}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline-md text-[16px]">{orderItem.item?.name || 'Unknown Item'}</h4>
                      <p className="text-on-surface-variant text-body-md mt-1">Qty: {orderItem.quantity}</p>
                      <p className="mt-2 font-semibold text-primary">${orderItem.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Shipping + Tax</span>
                  <span>${(shippingCost + (subtotal * 0.08)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-body-md font-bold pt-3 border-t border-outline-variant/20">
                  <span>Total Refund</span>
                  <span className="text-[#5d4037]">${totalRefund.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Cancellation Form */}
            <div className="lg:col-span-7 space-y-8">
              <form onSubmit={handleCancelOrder} className="space-y-8 bg-surface-container-low/30 p-8 border border-outline-variant/30">

                {/* Reason Dropdown */}
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps uppercase tracking-widest text-primary block" htmlFor="reason">Reason for Cancellation</label>
                  <div className="relative">
                    <select
                      id="reason"
                      name="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 px-4 py-4 appearance-none focus:ring-1 focus:ring-primary focus:border-primary font-body-md outline-none transition-all"
                    >
                      <option disabled value="">Select a reason...</option>
                      <option value="better_price">Found a better price</option>
                      <option value="mistake">Ordered by mistake</option>
                      <option value="shipping_delay">Shipping delay</option>
                      <option value="changed_mind">Changed my mind</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps uppercase tracking-widest text-primary block" htmlFor="details">Additional Details (Optional)</label>
                  <textarea
                    id="details"
                    name="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tell us more about your experience..."
                    rows="6"
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 px-4 py-4 focus:ring-1 focus:ring-primary focus:border-primary font-body-md outline-none resize-none transition-all"
                  ></textarea>
                </div>

                {/* Checkbox Confirmation */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      id="confirm_policy"
                      name="confirm_policy"
                      required
                      type="checkbox"
                      checked={confirmPolicy}
                      onChange={(e) => setConfirmPolicy(e.target.checked)}
                      className="h-4 w-4 rounded-none border-outline-variant text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="text-body-md text-on-surface-variant">
                    <label className="cursor-pointer" htmlFor="confirm_policy">I understand that this action is irreversible and the refund will be processed within 5-10 business days to my original payment method.</label>
                  </div>
                </div>

                {/* Buttons Cluster */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-on-primary font-label-caps text-label-caps uppercase py-5 px-8 hover:bg-[#474646] transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                  <Link
                    to="/settings"
                    state={{ activeTab: 'orders' }}
                    className="flex-1 flex items-center justify-center bg-transparent border border-primary text-primary font-label-caps text-label-caps uppercase py-5 px-8 hover:bg-surface-container-high transition-all duration-300"
                  >
                    Keep My Order
                  </Link>
                </div>
              </form>

              {/* Info Box */}
              <div className="bg-white p-6 border-l-4 border-[#5d4037] flex gap-4 shadow-sm">
                <span className="material-symbols-outlined text-[#5d4037]">info</span>
                <div>
                  <h5 className="font-bold text-body-md">Need immediate assistance?</h5>
                  <p className="text-body-md text-on-surface-variant mt-1">Our concierge team is available 24/7 to help with complex requests or modifications to existing orders. <a className="text-[#5d4037] underline font-semibold" href="#">Chat with an expert</a>.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CancelOrder;
