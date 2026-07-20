import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/api';
import { AuthContext } from './AuthContext';

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [pendingIds, setPendingIds] = useState(new Set());

  const refreshFavorites = useCallback(async () => {
    if (!token) {
      setFavoriteIds([]);
      return;
    }

    try {
      const res = await api('/favorites/ids');
      setFavoriteIds(res.ids || []);
    } catch {
      setFavoriteIds([]);
    }
  }, [token]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (productId) => favoriteIds.includes(String(productId)),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (productId) => {
      const id = String(productId);
      if (!token) {
        throw new Error('LOGIN_REQUIRED');
      }

      setPendingIds((prev) => new Set(prev).add(id));

      try {
        if (isFavorite(id)) {
          const res = await api(`/favorites/${id}`, { method: 'DELETE' });
          setFavoriteIds(res.ids || []);
          return { favored: false, message: res.message };
        }

        const res = await api(`/favorites/${id}`, { method: 'POST' });
        setFavoriteIds(res.ids || []);
        return { favored: true, message: res.message };
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [token, isFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteCount: favoriteIds.length,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
        isPending: (productId) => pendingIds.has(String(productId)),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
