import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api('/cart');
      const validItems = (res.items || []).filter(item => item && item.item);
      setCartItems(validItems);
    } catch (err) {
      setError('Failed to fetch cart items.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const res = await api(`/cart/${itemId}`, {
        method: 'PUT',
        body: { quantity: newQuantity }
      });
      const validItems = (res.items || []).filter(item => item && item.item);
      setCartItems(validItems);
    } catch (err) {
      toast.error('Failed to update quantity');
      fetchCart();
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const res = await api(`/cart/${itemId}`, { method: 'DELETE' });
      const validItems = (res.items || []).filter(item => item && item.item);
      setCartItems(validItems);
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  const subtotal = cartItems.reduce((total, cartItem) => {
    return total + (cartItem.item.price * cartItem.quantity);
  }, 0);

  const shippingEstimate = cartItems.length > 0 ? 150 : 0;
  const tax = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + shippingEstimate + tax;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bright">
        <p className="font-label-caps tracking-widest uppercase text-on-surface">Loading Cart...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-bright text-on-surface font-body-md min-h-screen flex flex-col">
      {/* Top Navigation Shell */}
      <header className="w-full sticky top-0 z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-xl border-b border-outline-variant/30 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-headline-md text-headline-md tracking-widest text-on-background">Lumina</Link>
            <nav className="hidden md:flex gap-6">
              <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" to="/">Dashboard</Link>
              <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" to="/">Inventory</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/cart" className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-70 transition-opacity">shopping_cart</Link>
            <Link to="/settings" className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-70 transition-opacity">settings</Link>
            <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant flex items-center justify-center text-sm font-bold">
              {user ? user.fullName?.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
        <div className="mb-12">
          <h2 className="font-headline-lg text-headline-lg mb-2">Shopping Cart</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Review your selection of architectural pieces.</p>
        </div>

        {error && <p className="text-error mb-4">{error}</p>}

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16 items-start">
          {/* Cart Items Section */}
          <div className="lg:col-span-8 w-full space-y-12">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low">
                <p className="font-headline-md mb-6">Your cart is currently empty.</p>
                <Link to="/" className="bg-primary text-on-primary py-3 px-8 font-label-caps uppercase tracking-widest hover:bg-secondary transition-colors">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              cartItems.map((cartItem) => (
                <div key={cartItem.item._id} className="group flex flex-col sm:flex-row gap-8 pb-8 border-b border-outline-variant/30 transition-all duration-300">
                  <div className="w-full sm:w-48 aspect-square bg-surface-container-low overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={cartItem.item.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl1GXaqF0bq-4NtcLTvEhVfImrFCJvko7FVsjzt8jR5Dx9S07fyuJAFrtZdK3_MADw_dUc6Yc_kAUgdm99HtevAWWm2GjlWobDveKoORvwc281pxGo64mT7brXyQ5cNRvtnIpMfPexGxBgDGXHjcgJHnyu80MDejSci63tlQwjHRBZT32XhBHNwk6UFXJHHc5xevPS03CflIiBy-Vn3fR8vSekKYXFKLi4DFREwRCmFt-15RykOuatjvVjr_cPZaa1cW-fnGkS9WeL'}
                      alt={cartItem.item.name}
                    />
                  </div>
                  <div className="flex-grow flex flex-col justify-between py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-headline-md text-headline-md mb-1 tracking-tight">{cartItem.item.name}</h3>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">{cartItem.item.category || 'Product'}</p>
                      </div>
                      <p className="font-headline-md text-headline-md">{cartItem.item.price.toLocaleString()} đ</p>
                    </div>
                    <div className="flex justify-between items-center mt-6 sm:mt-0">
                      <div className="flex items-center border border-outline-variant px-4 py-2 gap-6 bg-surface-container-lowest">
                        <button
                          className="hover:text-secondary transition-colors text-lg"
                          onClick={() => handleUpdateQuantity(cartItem.item._id, cartItem.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="font-label-caps text-label-caps w-4 text-center">{cartItem.quantity}</span>
                        <button
                          className="hover:text-secondary transition-colors text-lg"
                          onClick={() => handleUpdateQuantity(cartItem.item._id, cartItem.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
                        onClick={() => handleRemove(cartItem.item._id)}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        <span className="font-label-caps text-label-caps uppercase">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Sidebar */}
          {cartItems.length > 0 && (
            <aside className="lg:col-span-4 w-full sticky top-32">
              <div className="bg-surface-container-low p-8 lg:p-10 flex flex-col space-y-10">
                <h3 className="font-headline-md text-headline-md border-b border-outline-variant pb-6">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between font-body-md text-body-md">
                    <span className="text-on-surface-variant">Subtotal</span>
                    <span>{subtotal.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between font-body-md text-body-md">
                    <span className="text-on-surface-variant">Shipping Estimate</span>
                    <span>{shippingEstimate.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between font-body-md text-body-md">
                    <span className="text-on-surface-variant">Tax</span>
                    <span>{tax.toLocaleString()} đ</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant">
                  <div className="flex justify-between items-baseline mb-8">
                    <span className="font-label-caps text-label-caps text-on-surface">GRAND TOTAL</span>
                    <span className="font-headline-lg text-headline-lg">{grandTotal.toLocaleString()} đ</span>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <label className="font-label-caps text-label-caps block mb-2">PROMO CODE</label>
                      <div className="flex bg-surface-container-low border border-outline-variant/30 p-1">
                        <input className="bg-transparent border-none focus:ring-0 text-body-md flex-grow px-3 uppercase outline-none" placeholder="Enter code" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                        <button className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors" onClick={() => toast.success('Promo code applied!')}>APPLY</button>
                      </div>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-primary text-on-primary py-5 font-label-caps text-label-caps tracking-widest hover:bg-secondary transition-all duration-300 active:scale-[0.98] font-semibold"
                    >
                      PROCEED TO CHECKOUT
                    </button>
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <span className="material-symbols-outlined">payments</span>
                    <span className="material-symbols-outlined">lock</span>
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 border border-outline-variant flex items-center gap-4 cursor-pointer hover:bg-surface-container-lowest transition-colors group">
                <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">help</span>
                <div>
                  <p className="font-label-caps text-label-caps">NEED ASSISTANCE?</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">Contact our concierge team</p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Recommended Products Section */}
      <section className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-20">
        <div className="mb-12">
          <h2 className="font-headline-md text-headline-md mb-2 tracking-widest uppercase text-sm">Architectural Pairings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-secondary font-semibold">Curated additions for your space.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group cursor-pointer">
            <div className="aspect-square bg-surface-container-low overflow-hidden mb-4">
              <img alt="Aura Floor Lamp" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida/AP1WRLvQj2xYFfDrJxlkhbG1ZbMtFAhixaFi-l5sV_jr-Cw_7-CbGA9z46DXDODoKT-R7wXWLHz3eHWVENaiCIiPHGcIcxEL6kuwXckA2ogKf_vwj2g2DmPA2q7N8yvNV1cTTW34UbnwbZFSYa0ialhx51N1u5UGwIGqDClwBllTPI54FUdlz7pqAgIWJushZk5d5_K8lIPIUahvHytiqgq7F4d2QNwtEtJK5LGzg2B2vrHmU1huHBtWn5fRPBlW" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-label-caps text-label-caps mb-1">Aura Floor Lamp</h4>
                <p className="font-label-caps text-label-caps text-on-surface-variant">LIGHTING</p>
              </div>
              <p className="font-body-md text-secondary font-semibold">$850.00</p>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="aspect-square bg-surface-container-low overflow-hidden mb-4">
              <img alt="Executive Zenith Chair" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida/AP1WRLuntKoR50sZ5jRweXpEWaGWFD6nFJw2RYj4er8-rE_QWGZOKlLpKkb1L3VJpKe5z0ulgnI9GN1e49miEPw3vbpl8gZ1w5b45uUkfYY_CZAOpDDHN3YEMlZT74e3sYb4TQgVZqqltqX3eTJqepyNVo7PmZ3iLF0gu8P5KPoMjE8VThKr82Uz8CA_lCACdyNEpBt2lbpabnSIJ_iikJ2nv3QzfjUX0KZ0CQu1Sgn32kCy1wTJf3_kfW56rPUr" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-label-caps text-label-caps mb-1">Zenith Chair</h4>
                <p className="font-label-caps text-label-caps text-on-surface-variant">OFFICE</p>
              </div>
              <p className="font-body-md text-secondary font-semibold">$1,800.00</p>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="aspect-square bg-surface-container-low overflow-hidden mb-4">
              <img alt="Lunar Lounge" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI_gX5g5jnW6cj3bx65pkU3tUmOYydUmEf1mdRixqTYylhPwYxydGprPcFzignbkD2DMrT14Y_M4jQ_dKnhnUQ7_JarKqC9RpjnL4WC2u_SuvhqmI9cJu_hawjn5wlPZng6Fzy9bqm8lVo4868x4VFU55DqnBbhcRV4bQdl7ZsthTfrUOpmVeQCNrch5LXXzLGDYMG0nGei6V26VKivwBxkT53UR2GtTVxcbNyRH-llgVwvQdNfj4ZyLW8FXYIrsiJ6Nnfn4-O4Gjp" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-label-caps text-label-caps mb-1">Lunar Ottoman</h4>
                <p className="font-label-caps text-label-caps text-on-surface-variant">LIVING</p>
              </div>
              <p className="font-body-md text-secondary font-semibold">$450.00</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Shell */}
      <footer className="w-full mt-auto bg-surface border-t border-outline-variant transition-opacity duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-12 w-full max-w-container-max mx-auto">
          <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Lumina</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">© 2024 Lumina Atelier. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-8">
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Shipping Info</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Cart;
