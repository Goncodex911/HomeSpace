import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  // Shipping form state
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    streetAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    fetchCart();
    if (user) {
      setEmail(user.email || '');
      setShippingAddress({
        streetAddress: user.streetAddress || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || ''
      });
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api('/cart');
      if (!res.items || res.items.length === 0) {
        navigate('/cart'); // Redirect to cart if empty
        return;
      }
      setCartItems(res.items);
    } catch (err) {
      setError('Failed to fetch cart items.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.state) {
      toast.error('Please fill out the complete shipping address.');
      return;
    }

    setPlacingOrder(true);
    try {
      const itemsToOrder = cartItems.map(cartItem => ({
        item: cartItem.item._id,
        quantity: cartItem.quantity
      }));

      await api('/orders', {
        method: 'POST',
        body: {
          items: itemsToOrder,
          shippingAddress
        }
      });

      // Navigate to orders history
      navigate('/settings', { state: { activeTab: 'orders' } });
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
      setPlacingOrder(false);
    }
  };

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const subtotal = cartItems.reduce((total, cartItem) => {
    return total + (cartItem.item.price * cartItem.quantity);
  }, 0);

  const shippingEstimate = 150;
  const tax = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + shippingEstimate + tax;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-cream text-on-surface-variant font-label-caps uppercase tracking-widest">
        Loading Checkout...
      </div>
    );
  }

  return (
    <div className="bg-surface-cream text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
      {/* Header Navigation (TopAppBar) */}
      <header className="docked full-width top-0 sticky z-50 bg-white/70 backdrop-blur-xl border-b border-outline-variant/30 px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center w-full max-w-container-max mx-auto">
        <Link to="/" className="font-display-lg text-display-lg font-light tracking-tighter text-primary">
          LUMINA
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/cart" className="material-symbols-outlined text-primary cursor-pointer hover:opacity-70 transition-opacity">shopping_bag</Link>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center font-bold text-sm">
            {user ? user.fullName?.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 lg:flex lg:gap-gutter">
        {/* Left Column: Checkout Form */}
        <div className="lg:w-2/3">
          {/* Progress Header */}
          <nav className="flex items-center space-x-4 mb-12 font-label-caps text-label-caps uppercase tracking-widest overflow-x-auto whitespace-nowrap">
            <div className="flex items-center text-primary">
              <span className="mr-2">1. Information & Shipping</span>
            </div>
          </nav>

          <form className="space-y-12" onSubmit={handlePlaceOrder}>
            {/* Contact Section */}
            <section>
              <h2 className="font-headline-md text-headline-md mb-6 uppercase tracking-wider">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase mb-2" htmlFor="email">Email Address</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 px-4 py-3 font-body-md text-on-surface focus:border-primary transition-colors focus:ring-0 outline-none"
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </section>

            {/* Shipping Address Section */}
            <section className="mb-12">
              <h2 className="font-headline-md text-headline-md mb-6 uppercase tracking-wider">Select from Saved Addresses</h2>

              {user?.streetAddress ? (
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {/* Saved Address Card */}
                  <label className="relative flex flex-col p-6 border border-primary bg-surface-container-lowest cursor-pointer transition-colors group">
                    <input
                      checked
                      readOnly
                      className="absolute top-4 right-4 w-5 h-5 border-outline-variant text-primary focus:ring-0"
                      name="saved_address"
                      type="radio"
                    />
                    <div className="pr-8">
                      <span className="text-[10px] font-label-caps text-on-surface-variant/50 uppercase mb-2 block">Default Shipping</span>
                      <p className="font-semibold text-primary mb-2">{user.fullName}</p>
                      <div className="text-body-md text-on-surface-variant space-y-1">
                        <p>{user.streetAddress}</p>
                        <p>{user.city}, {user.state}</p>
                        <p>{user.zipCode}</p>
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="bg-error-container text-on-error-container p-4 rounded border border-error/20 font-body-md">
                  You do not have a saved shipping address. Please go to <Link to="/settings" className="underline font-bold">Settings</Link> to add your address before proceeding.
                </div>
              )}
            </section>

            {error && <p className="text-error-red mb-4">{error}</p>}

            {/* CTA Button */}
            <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <Link className="text-secondary flex items-center font-label-caps text-label-caps uppercase group" to="/cart">
                <span className="material-symbols-outlined mr-2 text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                Return to Cart
              </Link>
              <button
                className="bg-primary text-on-primary px-10 py-5 font-label-caps text-label-caps uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                type="submit"
                disabled={placingOrder || !user?.streetAddress}
              >
                {placingOrder ? 'PLACING ORDER...' : 'PLACE ORDER'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div className="lg:w-1/3 mt-16 lg:mt-0">
          <aside className="sticky top-28 space-y-8 bg-surface-container-low border border-outline-variant/20 p-8">
            <h2 className="font-headline-md text-headline-md uppercase tracking-wider border-b border-outline-variant/30 pb-4">Order Summary</h2>

            {/* Item List */}
            <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {cartItems.map((cartItem) => (
                <div key={cartItem.item._id} className="flex gap-4">
                  <div className="relative w-20 h-24 bg-surface-container flex-shrink-0">
                    <img className="w-full h-full object-cover" src={cartItem.item.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80'} alt={cartItem.item.name} />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-on-primary text-[10px] flex items-center justify-center rounded-full font-bold">{cartItem.quantity}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <p className="font-label-caps text-label-caps uppercase text-primary">{cartItem.item.name}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase mt-1">Qty: {cartItem.quantity}</p>
                    </div>
                    <p className="font-body-md text-primary">${cartItem.item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div className="space-y-3 pt-6 border-t border-outline-variant/30">
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Shipping</span>
                <span>${shippingEstimate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Estimated Tax</span>
                <span>${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-4 mt-4 border-t border-primary/10">
                <span className="font-headline-md text-headline-md uppercase">Total</span>
                <div className="text-right">
                  <p className="text-[10px] text-on-surface-variant uppercase mb-1">USD</p>
                  <p className="font-headline-md text-headline-md">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-surface-cream border-t border-outline-variant/30 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto gap-8">
          <div className="font-label-caps text-label-caps font-semibold uppercase">LUMINA</div>
          <div className="flex gap-8 font-body-md text-body-md text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Shipping & Returns</a>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-60">
            © 2024 Lumina Architectural Furniture. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
