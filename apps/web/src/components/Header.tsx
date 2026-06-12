'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Search input state
  const [searchInput, setSearchInput] = useState('');
  
  // Cart items count state
  const [cartCount, setCartCount] = useState(0);

  // User state
  const [user, setUser] = useState<{ name: string; phoneNumber: string } | null>(null);

  // Sync state from URL query parameters
  const currentCategory = searchParams.get('category') || 'ALL';
  const currentSortBy = searchParams.get('sortBy') || 'DEFAULT';
  const currentPriceBracket = searchParams.get('priceBracket') || 'ALL';
  const currentRent = searchParams.get('rent') || 'ALL';
  const currentSearch = searchParams.get('search') || '';

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Read cart items count from localStorage & sync user auth state
  useEffect(() => {
    const syncStates = () => {
      const cart = JSON.parse(localStorage.getItem('bazar_cart') || '[]');
      setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));

      const stored = localStorage.getItem('bazar_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    syncStates();
    
    // Listen to localstorage updates (e.g. from other pages or custom events)
    window.addEventListener('storage', syncStates);
    const interval = setInterval(syncStates, 1000); // Poll as fallback

    return () => {
      window.removeEventListener('storage', syncStates);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bazar_token');
    localStorage.removeItem('bazar_user');
    setUser(null);
    router.push('/');
    window.location.href = '/';
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === 'ALL' || value === 'DEFAULT' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // Always reset to page 1 if page pagination exists
    params.delete('page');
    
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`/catalog${query}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', searchInput);
  };

  // Direct backend URL — hardcoded for production reliability
  const getApiUrl = (path: string = '') => `https://balochi-bazar-backend.vercel.app${path}`;

  const categories = [
    { label: '👗 Complete Balochi Sets', id: 'Complete Balochi Sets' },
    { label: '🧣 Sareeg', id: 'Sareeg' },
    { label: '🧣 Chaddar Tikk / Border', id: 'Chaddar Tikk / Border' },
    { label: '👚 Pashko / Shalwar', id: 'Pashko / Shalwar' },
    { label: '🪡 Neem Doch', id: 'Neem Doch' },
    { label: '🪡 Pitt Doch', id: 'Pitt Doch' },
    { label: '🎨 Do-Rangi', id: 'Do-Rangi' },
    { label: '👗 Patt Dhamman', id: 'Patt Dhamman' },
    { label: '💎 Baroo Tikk', id: 'Baroo Tikk' },
    { label: '✨ Boon Chera Daig', id: 'Boon Chera Daig' },
    { label: '🌸 Rad Baro', id: 'Rad Baro' },
    { label: '⚙️ Machine made', id: 'Machine made' }
  ];

  return (
    <>
      <style>{`
        .header-dropdown-wrapper {
          position: relative;
          display: inline-block;
        }
        .header-dropdown-menu {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          background: #ffffff;
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          border-radius: 4px;
          min-width: 170px;
          z-index: 1000;
          list-style: none;
          padding: 8px 0;
          margin: 0;
          border: 1px solid #e0e0e0;
          text-align: left;
        }
        .header-dropdown-wrapper:hover .header-dropdown-menu {
          display: block;
        }
        .header-dropdown-menu li {
          width: 100%;
        }
        .header-dropdown-menu a, .header-dropdown-menu button {
          display: block;
          width: 100%;
          padding: 10px 16px;
          text-align: left;
          font-size: 13px;
          color: #333333;
          text-decoration: none;
          border: none;
          background: none;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .header-dropdown-menu a:hover, .header-dropdown-menu button:hover {
          background: #f5f5f5;
          color: #F85606;
        }
      `}</style>

      {/* Top Utility Bar */}
      <div className="top-bar">
        <div className="container" style={{ display: 'flex', width: '100%' }}>
          <ul className="top-bar-links">
            <li><a href="#" className="top-bar-link">SAVE MORE ON APP</a></li>
            <li><a href="/admin-link" className="top-bar-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>SELL ON BALOCHI BAZZAR (ADMIN)</a></li>
            <li><a href="#" className="top-bar-link">CUSTOMER CARE</a></li>
            <li><a href="/orders" className="top-bar-link">TRACK MY ORDER</a></li>
            {user ? (
              <li className="header-dropdown-wrapper" style={{ cursor: 'pointer' }}>
                <span className="top-bar-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                  👤 HELLO, {user.name.toUpperCase()} ▾
                </span>
                <ul className="header-dropdown-menu">
                  <li><a href="/orders">My Account / Profile</a></li>
                  <li><a href="/orders">My Orders</a></li>
                  <li><button onClick={handleLogout}>Logout / Sign Out</button></li>
                </ul>
              </li>
            ) : (
              <li><a href="/login" className="top-bar-link">SIGNUP / LOGIN</a></li>
            )}
          </ul>
        </div>
      </div>

      {/* Main Header */}
      <header>
        <div className="container header-main">
          <a href="/" className="logo">
            BALOCHI<span>BAZZAR</span>
          </a>
          
          {/* Search Bar */}
          {!pathname?.startsWith('/orders') ? (
            <form onSubmit={handleSearchSubmit} className="search-form">
              <input
                type="text"
                placeholder="Search in Balochi Bazzar (e.g. Bala Morag, Neem Doch, Chaddar)..."
                className="search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="search-btn">
                🔍
              </button>
            </form>
          ) : (
            <div style={{ flexGrow: 1 }} />
          )}

          {/* Cart & Login Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <a href="/cart" className="cart-btn">
              🛒
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </a>

            {user ? (
              <div className="header-dropdown-wrapper" style={{ cursor: 'pointer' }}>
                <div className="btn btn-primary" style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👤</span> {user.name.split(' ')[0]} ▾
                </div>
                <ul className="header-dropdown-menu">
                  <li><a href="/orders">My Account / Profile</a></li>
                  <li><a href="/orders">My Orders</a></li>
                  <li><button onClick={handleLogout}>Logout / Sign Out</button></li>
                </ul>
              </div>
            ) : (
              <a href="/login" className="btn btn-primary" style={{ height: '40px' }}>
                Sign In
              </a>
            )}
          </div>
        </div>

        {/* Global Sub-Header Dropdown Filters */}
        {!pathname?.startsWith('/orders') && (
          <div className="header-filters-bar">
            <div className="container filters-container">
              {/* Category Dropdown */}
              <div className="filter-select-wrapper">
                <span className="filter-select-label">Category</span>
                <select
                  className="header-filter-select"
                  value={currentCategory}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="ALL">All Garment Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Dropdown */}
              <div className="filter-select-wrapper">
                <span className="filter-select-label">Sort By</span>
                <select
                  className="header-filter-select"
                  value={currentSortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="DEFAULT">Best Match</option>
                  <option value="LOW_HIGH">Price: Low to High</option>
                  <option value="HIGH_LOW">Price: High to Low</option>
                </select>
              </div>

              {/* Price Bracket Dropdown */}
              <div className="filter-select-wrapper">
                <span className="filter-select-label">Price Range</span>
                <select
                  className="header-filter-select"
                  value={currentPriceBracket}
                  onChange={(e) => handleFilterChange('priceBracket', e.target.value)}
                >
                  <option value="ALL">All Prices</option>
                  <option value="UNDER_5K">Under Rs. 5,000 (Budget)</option>
                  <option value="5K_10K">Rs. 5,000 - Rs. 10,000 (Mid-Range)</option>
                  <option value="10K_20K">Rs. 10,000 - Rs. 20,000 (Premium)</option>
                  <option value="ABOVE_20K">Above Rs. 20,000 (Luxury)</option>
                </select>
              </div>

              {/* Service Type Dropdown */}
              <div className="filter-select-wrapper">
                <span className="filter-select-label">Service Type</span>
                <select
                  className="header-filter-select"
                  value={currentRent}
                  onChange={(e) => handleFilterChange('rent', e.target.value)}
                >
                  <option value="ALL">All Services</option>
                  <option value="BUY">Buy Outright</option>
                  <option value="RENT">Rentals Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
