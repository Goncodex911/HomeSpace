import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';

const sizeClasses = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-12 h-12',
};

const iconClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

const FavoriteButton = ({
  productId,
  size = 'md',
  className = '',
  showLabel = false,
  variant = 'overlay',
  onChange,
}) => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { isFavorite, toggleFavorite, isPending } = useContext(FavoritesContext);

  if (!productId) return null;

  const favored = isFavorite(productId);
  const pending = isPending(productId);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!token) {
      toast.error('Please log in to save favorites');
      navigate('/login');
      return;
    }

    try {
      const result = await toggleFavorite(productId);
      toast.success(
        result?.favored ? 'Added to favorites' : 'Removed from favorites'
      );
      onChange?.(result);
    } catch (err) {
      if (err.message === 'LOGIN_REQUIRED') {
        toast.error('Please log in to save favorites');
        navigate('/login');
        return;
      }
      toast.error(err.message || 'Failed to update favorites');
    }
  };

  const baseClasses =
    variant === 'outline'
      ? `border bg-transparent text-primary hover:border-primary ${favored ? 'border-primary' : 'border-outline-variant'}`
      : `border bg-transparent text-primary hover:border-primary backdrop-blur-[1px] ${favored ? 'border-primary' : 'border-outline-variant/60'}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favored ? 'Remove from favorites' : 'Add to favorites'}
      title={favored ? 'Remove from favorites' : 'Add to favorites'}
      className={`inline-flex items-center justify-center transition-all duration-200 disabled:opacity-60 ${showLabel ? 'px-8 py-4 rounded-none' : `rounded-full ${sizeClasses[size]}`} ${baseClasses} ${className}`}
    >
      <span
        className={`material-symbols-outlined ${iconClasses[size]} ${favored ? 'text-primary' : 'text-on-surface-variant'}`}
        style={favored ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        favorite
      </span>
      {showLabel && (
        <span className="ml-2 font-label-caps text-label-caps uppercase tracking-wider">
          {favored ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
