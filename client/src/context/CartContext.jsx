import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const getCartCount = (cart) =>
  (cart?.items || [])
    .filter((entry) => entry?.item)
    .reduce((sum, entry) => sum + (entry.quantity || 0), 0);

export const CartProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [cartCount, setCartCount] = useState(0);

  const applyCart = useCallback((cart) => {
    setCartCount(getCartCount(cart));
  }, []);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const cart = await api('/cart');
      applyCart(cart);
    } catch {
      setCartCount(0);
    }
  }, [token, applyCart]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart, applyCart }}>
      {children}
    </CartContext.Provider>
  );
};
