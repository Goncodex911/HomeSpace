import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const CartBadge = ({ count, className = '' }) => {
  if (!count) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const CartLink = ({ variant = 'icon', className = '', title = 'Cart' }) => {
  const { cartCount } = useContext(CartContext);

  if (variant === 'text') {
    return (
      <Link
        to="/cart"
        className={`font-label-caps text-label-caps tracking-widest text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-2 ${className}`}
      >
        Cart
        <CartBadge count={cartCount} className="bg-primary text-on-primary" />
      </Link>
    );
  }

  if (variant === 'catalog') {
    return (
      <Link
        to="/cart"
        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-70 transition-opacity flex items-center gap-2 ${className}`}
      >
        Giỏ Hàng
        <CartBadge count={cartCount} className="bg-[#1a1c1a] text-white" />
        <span className="material-symbols-outlined text-sm">shopping_cart</span>
      </Link>
    );
  }

  return (
    <Link
      to="/cart"
      className={`flex items-center text-on-surface hover:text-primary hover:opacity-85 transition-all relative ${className}`}
      title={title}
    >
      <span className="material-symbols-outlined text-2xl">shopping_cart</span>
      <span className="absolute -top-1.5 -right-1.5">
        <CartBadge count={cartCount} className="bg-primary text-on-primary" />
      </span>
    </Link>
  );
};

export default CartLink;
