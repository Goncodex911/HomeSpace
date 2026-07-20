import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CartLink from './CartLink';
import FavoritesLink from './FavoritesLink';

const Navbar = ({ transparentOnScroll = false, showSearch = false, onSearchChange = null, searchValue = "", customActions = null }) => {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  const isStoreOrAdmin = user && (user.role === 'store' || user.role === 'admin');

  useEffect(() => {
    if (!transparentOnScroll) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparentOnScroll]);

  // Determine the header class based on scroll state and transparent prop
  const headerClass = !transparentOnScroll
    ? "fixed w-full top-0 z-50 bg-white/80 dark:bg-black/70 backdrop-blur-xl border-b border-outline-variant/30 py-4 transition-all duration-300"
    : `fixed w-full top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-surface-variant py-4 shadow-sm"
          : "bg-transparent py-6"
      }`;

  const isActive = (path) => location.pathname === path;

  return (
    <header className={headerClass} id="main-header">
      <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Left: Logo and Primary Links */}
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-2" to="/">
            <img
              alt="Lumina Logo"
              className="h-8 md:h-10 transition-transform duration-300 hover:scale-105"
              src="https://lh3.googleusercontent.com/aida/AP1WRLsWGZ4LJsyWWw0DXI5i0NfMxhuFuxInq7d6NcREsRQma6gs0mTrWB6h28qpRcABtk3We1-9DLnWO45-C-Nn9EWMy8_BTFIOFWiOu0OTPqs2VcARYqgQa7JT1IyHYAIc1dlp-oQg2GsrEiph-0tKESg5sjj6-1iliWwqoDiztHIVWJswFGI-0xZS1IWK_RMm-5k6whLqsFQLFIpCNa5SpGArlemsLQhRt1oD4t_By4EPNHvJnSg-SiW26vA"
            />
            <span className="font-display-lg text-headline-md tracking-tighter text-primary font-semibold hidden xs:block">Lumina</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`font-label-caps text-label-caps transition-colors duration-300 ${
                isActive('/') 
                  ? "text-primary border-b border-primary pb-1" 
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Home
            </Link>
            <Link
              to="/stores"
              className={`font-label-caps text-label-caps transition-colors duration-300 ${
                isActive('/stores') 
                  ? "text-primary border-b border-primary pb-1" 
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Curators
            </Link>
          </div>
        </div>

        {/* Center/Right: Search Bar & Auth actions */}
        <div className="flex items-center gap-4">
          {/* Optional Search Bar */}
          {showSearch && (
            <div className="hidden lg:flex items-center bg-surface-container/50 px-3 py-2 rounded-full transition-shadow hover:shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-xl">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-md p-0 w-36 focus:outline-none"
                placeholder="Search..."
                type="text"
                value={searchValue}
                onChange={onSearchChange}
              />
            </div>
          )}

          {token ? (
            <div className="flex items-center gap-4">
              {customActions}
              <span className="text-sm hidden sm:inline text-on-surface-variant">
                Hello, <strong>{user?.fullName}</strong>
              </span>
              <FavoritesLink />
              <CartLink />
              <Link to="/settings" className="flex items-center text-on-surface hover:text-primary hover:opacity-85 transition-all" title="Profile Settings">
                <span className="material-symbols-outlined text-2xl">person</span>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="bg-secondary text-on-secondary text-xs font-label-caps px-4 py-2 hover:bg-primary transition-colors uppercase tracking-wider mr-2">
                  Admin Panel
                </Link>
              )}
              {isStoreOrAdmin ? (
                <Link to="/store" className="bg-primary text-on-primary text-xs font-label-caps px-4 py-2 hover:bg-secondary transition-colors uppercase tracking-wider">
                  Store Manager
                </Link>
              ) : (
                <Link to="/vendor-register" className="border border-secondary text-secondary text-xs font-label-caps px-4 py-2 hover:bg-secondary hover:text-white transition-all uppercase tracking-wider">
                  Apply as Curator
                </Link>
              )}
              <button
                onClick={logout}
                className="font-label-caps text-label-caps border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-all uppercase"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="font-label-caps text-label-caps text-primary hover:opacity-75 uppercase">
                Sign In
              </Link>
              <Link to="/register" className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 hover:bg-secondary transition-colors uppercase">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
