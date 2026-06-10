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

  // Sync state from URL query parameters
  const currentCategory = searchParams.get('category') || 'ALL';
  const currentSortBy = searchParams.get('sortBy') || 'DEFAULT';
  const currentPriceBracket = searchParams.get('priceBracket') || 'ALL';
  const currentRent = searchParams.get('rent') || 'ALL';
  const currentSearch = searchParams.get('search') || '';

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Read cart items count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('bazar_cart') || '[]');
      setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
    };

    updateCartCount();
    
    // Listen to localstorage updates (e.g. from other pages or custom events)
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 1000); // Poll as fallback

    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

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

  const getApiUrl = (path: string = '') => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:5000${path}`;
  };

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
      {/* Top Utility Bar */}
      <div className="top-bar">
        <div className="container" style={{ display: 'flex', width: '100%' }}>
          <ul className="top-bar-links">
            <li><a href="#" className="top-bar-link">SAVE MORE ON APP</a></li>
            <li><a href="/admin-link" className="top-bar-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>SELL ON BALOCHI BAZZAR (ADMIN)</a></li>
            <li><a href="#" className="top-bar-link">CUSTOMER CARE</a></li>
            <li><a href="/orders" className="top-bar-link">TRACK MY ORDER</a></li>
            <li><a href="/orders" className="top-bar-link">SIGNUP / LOGIN</a></li>
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

            <a href="/orders" className="btn btn-primary" style={{ height: '40px' }}>
              Sign In
            </a>
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
