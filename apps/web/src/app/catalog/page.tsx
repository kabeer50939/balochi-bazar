'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  isRentable: boolean;
  rentPerDay?: number | null;
  depositFee?: number | null;
  allowsCustomEmbroidery: boolean;
  stockQuantity?: number | null;
  images: { id: string; url: string; isPrimary: boolean }[];
}

function CatalogPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  

  
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialRentParam = searchParams.get('rent') || 'ALL';
  const initialRent = initialRentParam === 'true' ? 'RENT' : initialRentParam === 'false' ? 'BUY' : 'ALL';
  const initialSortBy = searchParams.get('sortBy') || 'DEFAULT';
  const initialPriceBracket = searchParams.get('priceBracket') || 'ALL';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Sorting States
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [filterRentable, setFilterRentable] = useState(initialRent); // 'ALL', 'BUY', 'RENT'
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSortBy); // 'DEFAULT', 'LOW_HIGH', 'HIGH_LOW'
  const [priceBracket, setPriceBracket] = useState(initialPriceBracket); // 'ALL', 'UNDER_5K', '5K_10K', '10K_20K', 'ABOVE_20K'

  // Synchronize state with URL parameters
  useEffect(() => {
    const category = searchParams.get('category') || 'ALL';
    const search = searchParams.get('search') || '';
    const rentParam = searchParams.get('rent') || 'ALL';
    const rent = rentParam === 'true' ? 'RENT' : rentParam === 'false' ? 'BUY' : 'ALL';
    const sort = searchParams.get('sortBy') || 'DEFAULT';
    const price = searchParams.get('priceBracket') || 'ALL';

    setSelectedCategory(category);
    setSearchQuery(search);
    setFilterRentable(rent);
    setSortBy(sort);
    setPriceBracket(price);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = () => {
    setLoading(true);
    let url = getApiUrl('/api/products');
    const params = new URLSearchParams();

    if (selectedCategory !== 'ALL') {
      params.append('category', selectedCategory);
    }
    
    if (searchQuery) {
      params.append('search', searchQuery);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('API server offline.');
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not retrieve product list from local server.');
        setLoading(false);
      });
  };

  // Apply client-side sorting and additional price bracket filters dynamically
  useEffect(() => {
    let result = [...products];

    // 1. Buy/Rent filter
    if (filterRentable === 'RENT') {
      result = result.filter(p => p.isRentable);
    } else if (filterRentable === 'BUY') {
      result = result.filter(p => !p.isRentable || (p.stockQuantity && p.stockQuantity > 0));
    }

    // 3. Price Brackets filter
    if (priceBracket === 'UNDER_5K') {
      result = result.filter(p => p.basePrice < 5000);
    } else if (priceBracket === '5K_10K') {
      result = result.filter(p => p.basePrice >= 5000 && p.basePrice <= 10000);
    } else if (priceBracket === '10K_20K') {
      result = result.filter(p => p.basePrice >= 10000 && p.basePrice <= 20000);
    } else if (priceBracket === 'ABOVE_20K') {
      result = result.filter(p => p.basePrice > 20000);
    }

    // 5. Sorting options
    if (sortBy === 'LOW_HIGH') {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'HIGH_LOW') {
      result.sort((a, b) => b.basePrice - a.basePrice);
    }

    setFilteredProducts(result);
  }, [products, filterRentable, priceBracket, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('ALL');
    setFilterRentable('ALL');
    setSearchQuery('');
    setSortBy('DEFAULT');
    setPriceBracket('ALL');
    router.push('/catalog');
  };
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      
      {/* Full Width Main Layout */}
      <div style={{ width: '100%' }}>

        {/* MAIN PRODUCTS GRID */}
        <div>
          {error && <div style={{ padding: '1rem', background: 'var(--danger)', color: 'white', borderRadius: '4px', marginBottom: '2rem' }}>{error}</div>}
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <h3>No designs match your filters.</h3>
              <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Try modifying your price boundaries or sorting filters.</p>
              <button onClick={clearAllFilters} className="btn btn-primary">Clear Filters</button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="daraz-card">
                  <div className="card-img-container" style={{ paddingTop: '100%' }}>
                    <img 
                      src={prod.images && prod.images.length > 0 ? prod.images.find(img => img.isPrimary)?.url || prod.images[0].url : getApiUrl('/uploads/75d79d6b70bdd2a4c2fb90ae21faa29d.png')} 
                      className="card-img" 
                      alt={prod.name} 
                    />
                    {prod.isRentable && (
                      <span className="badge badge-accent" style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px' }}>
                        Rent
                      </span>
                    )}
                    {prod.allowsCustomEmbroidery && (
                      <span className="badge badge-primary" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px' }}>
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="card-details">
                    <h4 className="card-title">{prod.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="card-price">Rs. {prod.basePrice.toLocaleString()}</span>
                    </div>

                    <div className="card-ratings">
                      ⭐ ⭐ ⭐ ⭐ ⭐ <span style={{ color: '#757575', fontSize: '10px' }}>(5)</span>
                    </div>
                    
                    {prod.isRentable && prod.rentPerDay && (
                      <span style={{ fontSize: '11px', color: '#137333', marginTop: '4px', fontWeight: '500' }}>
                        👗 Rent: Rs. {prod.rentPerDay.toLocaleString()}/day
                      </span>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '10px' }}>
                      <a href={`/product/${prod.id}`} className="btn btn-primary" style={{ width: '100%', fontSize: '12px', padding: '5px', fontWeight: 'bold' }}>
                        Configure & Order
                      </a>
                    </div>

                    <div className="card-location">
                      Gwadar
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '2rem' }}>Loading catalog...</div>}>
      <CatalogPageContent />
    </Suspense>
  );
}
