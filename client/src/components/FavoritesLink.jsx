import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FavoritesContext } from '../context/FavoritesContext';

const CountBadge = ({ count, className = '' }) => {
  if (!count) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const favoritesTarget = { pathname: '/settings', state: { activeTab: 'favorites' } };

const FavoritesLink = ({ variant = 'icon', className = '', title = 'Favorites' }) => {
  const { favoriteCount } = useContext(FavoritesContext);

  if (variant === 'text') {
    return (
      <Link
        to={favoritesTarget}
        className={`font-label-caps text-label-caps tracking-widest text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-2 ${className}`}
      >
        Favorites
        <CountBadge count={favoriteCount} className="bg-primary text-on-primary" />
      </Link>
    );
  }

  if (variant === 'catalog') {
    return (
      <Link
        to={favoritesTarget}
        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-70 transition-opacity flex items-center gap-2 ${className}`}
      >
        Favorites
        <CountBadge count={favoriteCount} className="bg-[#1a1c1a] text-white" />
        <span
          className="material-symbols-outlined text-sm"
          style={favoriteCount ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          favorite
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={favoritesTarget}
      className={`flex items-center text-on-surface hover:text-primary hover:opacity-85 transition-all relative ${className}`}
      title={title}
    >
      <span
        className="material-symbols-outlined text-2xl"
        style={favoriteCount ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        favorite
      </span>
      <span className="absolute -top-1.5 -right-1.5">
        <CountBadge count={favoriteCount} className="bg-primary text-on-primary" />
      </span>
    </Link>
  );
};

export default FavoritesLink;
