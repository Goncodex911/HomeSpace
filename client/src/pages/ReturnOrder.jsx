import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ReturnOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [method, setMethod] = useState('courier');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await api(`/orders/${id}`);
      if (data.status !== 'delivered') {
        setError('Only delivered orders can be returned.');
      } else if (data.returnRequest?.isRequested) {
        setError('A return request has already been submitted for this order.');
      }
      setOrder(data);
      // Pre-select all items by default for convenience
      if (data.items) {
        setSelectedItems(data.items.map(item => item._id));
      }
    } catch (err) {
      setError('Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (orderItemId) => {
    setSelectedItems(prev =>
      prev.includes(orderItemId)
        ? prev.filter(id => id !== orderItemId)
        : [...prev, orderItemId]
    );
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return.');
      return;
    }
    if (!reason) {
      toast.error('Please select a reason for return.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find original item IDs corresponding to selected orderItems
      const itemsToReturnIds = order.items
        .filter(orderItem => selectedItems.includes(orderItem._id))
        .map(orderItem => orderItem.item._id);

      await api(`/orders/${id}/return`, {
        method: 'PUT',
        body: {
          reason,
          comments,
          method,
          itemsToReturn: itemsToReturnIds
        }
      });
      navigate('/settings', { state: { activeTab: 'orders' } });
    } catch (err) {
      setError(err.message || 'Failed to submit return request.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-cream font-label-caps uppercase tracking-widest text-on-surface-variant">
        Loading Return Request...
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

  // Calculate return summary based on selected items
  const selectedOrderItems = order.items.filter(item => selectedItems.includes(item._id));
  const estimatedRefund = selectedOrderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const selectedItemCount = selectedOrderItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="bg-surface-cream text-on-surface font-body-md selection:bg-primary selection:text-white min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/70 border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto">
          <Link to="/" className="font-display-lg text-display-lg text-primary tracking-widest uppercase">Lumina</Link>
          <div className="flex items-center space-x-6">
            <Link to="/settings" className="material-symbols-outlined cursor-pointer hover:opacity-80 transition-opacity">person</Link>
          </div>
        </div>
      </header>

      <div className="flex max-w-container-max mx-auto pt-24 min-h-screen w-full">
        {/* Main Canvas */}
        <main className="flex-1 px-margin-mobile md:px-margin-desktop py-margin-desktop bg-surface-cream w-full">
          {/* Header section */}
          <div className="mb-12">
            <div className="flex items-center text-on-surface-variant mb-4 hover:text-primary cursor-pointer transition-colors" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined text-[18px] mr-2">arrow_back</span>
              <span className="font-label-caps text-label-caps uppercase">Back to Order #{order._id.slice(-6).toUpperCase()}</span>
            </div>
            <h1 className="font-display-lg text-display-lg text-primary">Return Request</h1>
          </div>

          <form onSubmit={handleSubmitReturn} className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Steps Form */}
            <div className="lg:col-span-7 space-y-12">

              {/* Step 1: Select Item */}
              <section className="p-8 bg-surface-container-lowest border border-outline-variant/30 relative transition-colors hover:border-primary">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-label-caps text-label-caps text-primary uppercase">01 Select Item(s) to return</h3>
                  <span className="text-success-green font-label-caps text-[10px]">VERIFIED DELIVERY</span>
                </div>

                <div className="space-y-6">
                  {order.items.map((orderItem) => (
                    <div key={orderItem._id} className="flex gap-6 items-start pb-6 border-b border-outline-variant/20 last:border-0 last:pb-0">
                      <div className="w-24 h-32 bg-surface-container-low flex-shrink-0">
                        <img
                          src={orderItem.item?.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80'}
                          alt={orderItem.item?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between h-full py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-headline-md text-base">{orderItem.item?.name || 'Unknown Item'}</h4>
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(orderItem._id)}
                              onChange={() => handleToggleItem(orderItem._id)}
                              className="w-5 h-5 border-outline rounded-none text-primary focus:ring-primary cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-body-md text-on-surface-variant">Qty: {orderItem.quantity}</span>
                          <span className="font-headline-md text-base">${orderItem.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Step 2: Reason */}
              <section className="p-8 bg-surface-container-lowest border border-outline-variant/30 transition-colors hover:border-primary">
                <h3 className="font-label-caps text-label-caps text-primary mb-6 uppercase">02 Reason for Return</h3>
                <div className="relative">
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full appearance-none bg-surface-container-low border-none p-4 font-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option disabled value="">Select a reason...</option>
                    <option value="damaged">Damaged upon arrival</option>
                    <option value="not-fit">Doesn't fit space</option>
                    <option value="style">Style not as expected</option>
                    <option value="other">Other (Please specify)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full mt-4 bg-surface-container-low border-none p-4 font-body-md text-on-surface min-h-[120px] focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Additional comments (Optional)"
                ></textarea>
              </section>

              {/* Step 3: Photo Upload */}
              <section className="p-8 bg-surface-container-lowest border border-outline-variant/30 transition-colors hover:border-primary">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-label-caps text-label-caps text-primary uppercase">03 Upload Photo (Optional)</h3>
                  <span className="text-on-surface-variant opacity-70 font-label-caps text-[10px]">JPG, PNG UP TO 10MB</span>
                </div>
                <div className="border-2 border-dashed border-outline-variant/50 p-12 text-center hover:border-primary transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary transition-colors mb-4">add_a_photo</span>
                  <p className="font-body-md text-on-surface-variant group-hover:text-primary transition-colors">Drag and drop images here or click to browse</p>
                </div>
              </section>

              {/* Step 4: Return Method */}
              <section className="p-8 bg-surface-container-lowest border border-outline-variant/30 transition-colors hover:border-primary">
                <h3 className="font-label-caps text-label-caps text-primary mb-6 uppercase">04 Select Return Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-center p-6 border cursor-pointer transition-colors group ${method === 'courier' ? 'border-primary bg-surface-container-low' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}>
                    <input
                      type="radio"
                      name="method"
                      value="courier"
                      checked={method === 'courier'}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-4 h-4 border-outline text-primary focus:ring-primary"
                    />
                    <div className="ml-4">
                      <p className="font-body-md font-bold">Courier Pickup</p>
                      <p className="text-on-surface-variant text-[12px]">Free white-glove collection</p>
                    </div>
                  </label>
                  <label className={`flex items-center p-6 border cursor-pointer transition-colors group ${method === 'self' ? 'border-primary bg-surface-container-low' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}>
                    <input
                      type="radio"
                      name="method"
                      value="self"
                      checked={method === 'self'}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-4 h-4 border-outline text-primary focus:ring-primary"
                    />
                    <div className="ml-4">
                      <p className="font-body-md font-bold">Self-Return</p>
                      <p className="text-on-surface-variant text-[12px]">Drop off at local showroom</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Submit Action */}
              <div className="flex justify-end pt-8 pb-16">
                <button
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="bg-primary text-on-primary px-12 py-4 font-label-caps text-label-caps tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'SUBMITTING...' : 'SUBMIT RETURN REQUEST'}
                </button>
              </div>
            </div>

            {/* Summary Sticky Sidebar */}
            <div className="lg:col-span-5">
              <div className="sticky top-32 bg-white/70 backdrop-blur-xl border border-outline-variant/30 p-8 shadow-sm">
                <h3 className="font-label-caps text-label-caps text-primary mb-8 border-b border-outline-variant/30 pb-4 uppercase">Request Summary</h3>
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Selected Items ({selectedItemCount})</span>
                    <span className="font-bold">${estimatedRefund.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Return Fee</span>
                    <span className="text-success-green font-bold">Complimentary</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Estimated Refund</span>
                    <span className="font-bold text-primary">${estimatedRefund.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/30">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="material-symbols-outlined text-on-surface-variant">info</span>
                      <p className="text-on-surface-variant text-[12px] leading-relaxed">
                        Refunds are processed within 5-7 business days after the item is received and inspected at our atelier. Original shipping fees are non-refundable.
                      </p>
                    </div>
                  </div>

                  {method === 'courier' && (
                    <div className="bg-surface-container p-6 text-on-surface">
                      <h4 className="font-label-caps text-[10px] mb-2 tracking-widest text-on-surface-variant uppercase">COLLECTION ADDRESS</h4>
                      <p className="text-body-md">{order.shippingAddress?.streetAddress}</p>
                      <p className="text-body-md">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                      <p className="text-body-md">{order.shippingAddress?.zipCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default ReturnOrder;
