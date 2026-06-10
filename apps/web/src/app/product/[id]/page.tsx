'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface CustomizationOption {
  id: string;
  sectionName: string;
  optionName: string;
  priceMarkup: number;
}

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
  images: ProductImage[];
  customizationOptions: CustomizationOption[];
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const getApiUrl = (path: string = '') => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:5000${path}`;
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Customization & Ordering States
  const [isRental, setIsRental] = useState(false);
  const [rentalDays, setRentalDays] = useState(3);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [sizeType, setSizeType] = useState<'STANDARD' | 'CUSTOM'>('STANDARD');
  const [standardSize, setStandardSize] = useState('M');
  const [customSizing, setCustomSizing] = useState({
    height: '',
    chest: '',
    waist: '',
    sleeves: '',
    notes: ''
  });
  
  // Interactive States
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isVoucherCollected, setIsVoucherCollected] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetch(getApiUrl(`/api/products/${id}`))
      .then(res => {
        if (!res.ok) throw new Error('Product not found or local backend offline.');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load product.');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading design specifications...</div>;
  if (error || !product) return <div className="container" style={{ padding: '5rem' }}><div className="glass" style={{ padding: '2rem', background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>{error || 'Product not found'}</div></div>;

  // Group customization options by section name
  const sections: { [key: string]: CustomizationOption[] } = {};
  product.customizationOptions.forEach(opt => {
    if (!sections[opt.sectionName]) {
      sections[opt.sectionName] = [];
    }
    sections[opt.sectionName].push(opt);
  });

  // Calculate pricing dynamically
  const calculatePrice = () => {
    let price = 0;
    if (isRental) {
      const baseRent = product.rentPerDay || (product.basePrice * 0.1);
      const deposit = product.depositFee || (product.basePrice * 0.3);
      price = (baseRent * rentalDays) + deposit;
    } else {
      let total = product.basePrice;
      selectedCustomizations.forEach(optName => {
        const option = product.customizationOptions.find(o => o.optionName === optName);
        if (option) {
          total += option.priceMarkup;
        }
      });
      price = total;
    }

    // Apply Collected Voucher discount (Rs. 500 off)
    if (isVoucherCollected) {
      price = Math.max(0, price - 500);
    }

    return price;
  };

  const handleCustomizationToggle = (optionName: string) => {
    setSelectedCustomizations(prev =>
      prev.includes(optionName)
        ? prev.filter(name => name !== optionName)
        : [...prev, optionName]
    );
  };

  const handleCustomSizeChange = (field: string, value: string) => {
    setCustomSizing(prev => ({ ...prev, [field]: value }));
  };

  const addToCart = () => {
    const cartItem = {
      productId: product.id,
      name: product.name,
      image: product.images[activeImageIdx]?.url || product.images[0]?.url,
      quantity,
      isRental,
      rentalDays: isRental ? rentalDays : null,
      customizations: selectedCustomizations,
      customSizing: sizeType === 'CUSTOM' ? customSizing : { standardSize },
      pricePerUnit: calculatePrice(),
    };

    // Save to local storage cart
    const existingCart = JSON.parse(localStorage.getItem('bazar_cart') || '[]');
    existingCart.push(cartItem);
    localStorage.setItem('bazar_cart', JSON.stringify(existingCart));

    setAddedToCart(true);
    setTimeout(() => {
      router.push('/cart');
    }, 1200);
  };

  // Mock Reviews
  const reviewsData = [
    { name: 'Fatima S.', sector: 'Sabiya Sector', rating: 5, date: '2026-05-12', text: 'The hand embroidery on the borders is extremely neat. It matched the Baloch Doch PDF style exactly. Highly recommend!' },
    { name: 'Zainab B.', sector: 'Mulla Band Sector', rating: 5, date: '2026-05-04', text: 'Rented this dress for a family wedding in Gwadar. The dress arrived dry-cleaned and fit perfectly using the custom measurements. Will rent again!' },
    { name: 'Maryam K.', sector: 'Pishukan Sector', rating: 4, date: '2026-04-28', text: 'Gorgeous machine made suit. The colors are very vibrant and delivery was fast.' }
  ];

  // Mock Q&As
  const qaData = [
    { q: 'How many days does custom tailoring take?', a: 'Custom hand-embroidery (Doch/Koreshi) usually takes 7-14 days depending on design complexity. Ready-made items are shipped within 24 hours.' },
    { q: 'Do you deliver outside Gwadar?', a: 'Currently, our delivery and rental returns are optimized only for Gwadar city sectors (Mulla Band, Sabiya, Pishukan, etc.) to ensure quick setup.' },
    { q: 'How is the rental security deposit refunded?', a: 'The security deposit is paid at delivery/pickup and refunded instantly in cash when the dress is returned in good condition.' }
  ];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      
      {/* 3-Column Daraz Product Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 0.9fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMN 1: PRODUCT IMAGES */}
        <div>
          {/* Main image Zoom Container */}
          <div className="zoom-container" style={{
            borderRadius: '4px',
            border: '1px solid #e2e2e2',
            backgroundColor: '#fff',
            marginBottom: '10px',
            paddingTop: '100%',
            position: 'relative'
          }}>
            <img 
              src={product.images[activeImageIdx]?.url || product.images[0]?.url} 
              className="zoom-image"
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
              alt={product.name}
            />
          </div>
          
          {/* Thumbnails list (Correct HTML tags instead of TouchableOpacity) */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.images.map((img, idx) => (
                <button 
                  key={img.id} 
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '2px',
                    border: activeImageIdx === idx ? '2px solid var(--primary)' : '1px solid #e2e2e2',
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                  }}
                >
                  <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="thumbnail" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLUMN 2: PRODUCT TITLE & CONFIGURATOR */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #ebebeb' }}>
          
          {/* Rating & Action Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="badge badge-primary">
              {product.category}
            </span>
            <button 
              onClick={() => setIsWishlisted(!isWishlisted)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
              title="Add to Wishlist"
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '8px', textAlign: 'left' }}>{product.name}</h1>
          
          {/* Rating bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#757575', marginBottom: '15px', borderBottom: '1px solid #f1f1f1', paddingBottom: '12px' }}>
            <span style={{ color: '#ffc107' }}>⭐ ⭐ ⭐ ⭐ ⭐</span>
            <span>4.9 / 5 Ratings</span>
            <span>|</span>
            <span style={{ color: '#00bcd4' }}>3 Customer Reviews</span>
          </div>

          <p style={{ color: '#757575', fontSize: '13px', marginBottom: '20px', textAlign: 'left' }}>
            {product.description}
          </p>

          {/* Sell vs Rental Selector */}
          {product.isRentable && (
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <span className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>SELECT ORDER TYPE</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsRental(false)}
                  style={{
                    flex: 1,
                    backgroundColor: !isRental ? 'var(--primary-light)' : '#fafafa',
                    color: !isRental ? 'var(--primary)' : '#333',
                    border: !isRental ? '1px solid var(--primary)' : '1px solid #e2e2e2',
                  }}
                >
                  Buy Outright
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsRental(true)}
                  style={{
                    flex: 1,
                    backgroundColor: isRental ? 'var(--primary-light)' : '#fafafa',
                    color: isRental ? 'var(--primary)' : '#333',
                    border: isRental ? '1px solid var(--primary)' : '1px solid #e2e2e2',
                  }}
                >
                  Rent Outfit
                </button>
              </div>
            </div>
          )}

          {/* Rental Duration Settings */}
          {isRental && (
            <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#fff8f5', border: '1px solid #fbeed5', borderRadius: '4px', textAlign: 'left' }}>
              <span className="form-label" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}>RENTAL SPECIFICATIONS (GWADAR ONLY)</span>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Rental Duration</label>
                <select
                  className="form-input"
                  value={rentalDays}
                  onChange={(e) => setRentalDays(parseInt(e.target.value))}
                  style={{ height: '35px', padding: '5px' }}
                >
                  <option value={3}>3 Days (Standard Rent)</option>
                  <option value={7}>7 Days (Weekly Booking)</option>
                  <option value={14}>14 Days (Extended Rent)</option>
                </select>
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                * Refundable security deposit of <strong>Rs. {product.depositFee?.toLocaleString()}</strong> is included, and will be returned upon outfit handback.
              </div>
            </div>
          )}

          {/* Custom Embroidery Options */}
          {product.allowsCustomEmbroidery && !isRental && Object.keys(sections).length > 0 && (
            <div style={{ marginBottom: '20px', borderTop: '1px solid #f1f1f1', paddingTop: '15px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '10px' }}>
                CUSTOM EMBROIDERY COMPONENTS (PDF SEED)
              </h3>
              {Object.entries(sections).map(([sectName, options]) => (
                <div key={sectName} style={{ marginBottom: '12px' }}>
                  <strong style={{ fontSize: '12px', color: '#333', display: 'block', marginBottom: '6px' }}>{sectName}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                    {options.map((opt) => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#fafafa', border: '1px solid #eee', borderRadius: '2px', cursor: 'pointer', fontSize: '12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={selectedCustomizations.includes(opt.optionName)}
                            onChange={() => handleCustomizationToggle(opt.optionName)}
                          />
                          {opt.optionName}
                        </span>
                        {opt.priceMarkup > 0 && (
                          <span style={{ color: 'var(--text-orange)', fontWeight: 'bold' }}>+ Rs. {opt.priceMarkup.toLocaleString()}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sizing & Tailoring */}
          {!isRental && (
            <div style={{ marginBottom: '20px', borderTop: '1px solid #f1f1f1', paddingTop: '15px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '10px' }}>
                TAILORING MEASUREMENTS
              </h3>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    checked={sizeType === 'STANDARD'}
                    onChange={() => setSizeType('STANDARD')}
                  />
                  Standard Sizes
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    checked={sizeType === 'CUSTOM'}
                    onChange={() => setSizeType('CUSTOM')}
                  />
                  Custom Stitching
                </label>
              </div>

              {sizeType === 'STANDARD' ? (
                <div className="form-group">
                  <select
                    className="form-input"
                    value={standardSize}
                    onChange={(e) => setStandardSize(e.target.value)}
                    style={{ height: '35px', padding: '5px' }}
                  >
                    <option value="S">Small (S) - Chest: 36"</option>
                    <option value="M">Medium (M) - Chest: 39"</option>
                    <option value="L">Large (L) - Chest: 42"</option>
                    <option value="XL">Extra Large (XL) - Chest: 45"</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#fafafa', padding: '10px', borderRadius: '2px', border: '1px solid #eee' }}>
                  <input type="number" placeholder="Height (cm)" className="form-input" style={{ height: '35px' }} value={customSizing.height} onChange={(e) => handleCustomSizeChange('height', e.target.value)} />
                  <input type="number" placeholder="Chest (inches)" className="form-input" style={{ height: '35px' }} value={customSizing.chest} onChange={(e) => handleCustomSizeChange('chest', e.target.value)} />
                  <input type="number" placeholder="Waist (inches)" className="form-input" style={{ height: '35px' }} value={customSizing.waist} onChange={(e) => handleCustomSizeChange('waist', e.target.value)} />
                  <input type="number" placeholder="Sleeves (inches)" className="form-input" style={{ height: '35px' }} value={customSizing.sleeves} onChange={(e) => handleCustomSizeChange('sleeves', e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* Pricing Overview and Action buttons */}
          <div style={{ borderTop: '1px solid #f1f1f1', paddingTop: '15px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
              <span style={{ fontSize: '13px', color: '#757575' }}>Price:</span>
              <div>
                {isVoucherCollected && (
                  <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#9e9e9e', marginRight: '8px' }}>
                    Rs. {(calculatePrice() + 500).toLocaleString()}
                  </span>
                )}
                <strong style={{ fontSize: '24px', color: 'var(--primary)' }}>
                  Rs. {calculatePrice().toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Qty row and Add to Cart */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '2px', height: '40px' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="qty-btn">-</button>
                <span className="qty-display">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="qty-btn">+</button>
              </div>
              
              <button
                onClick={addToCart}
                className="btn btn-primary"
                style={{ flexGrow: 1, height: '40px', fontWeight: 'bold' }}
                disabled={addedToCart}
              >
                {addedToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
            </div>
          </div>

        </div>

        {/* COLUMN 3: DELIVERY OPTIONS & SERVICE PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Local Vouchers Section (Daraz Style) */}
          <div className="glass">
            <span style={{ fontSize: '11px', color: '#9e9e9e', fontWeight: 'bold', display: 'block', marginBottom: '8px', textAlign: 'left' }}>PROMO VOUCHER</span>
            
            <div className="voucher-card">
              <div className="voucher-left">
                <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>Rs. 500 Off</strong>
                <span style={{ fontSize: '10px', color: '#757575' }}>Min. spend Rs. 5,000</span>
              </div>
              <div className="voucher-right">
                <button
                  type="button"
                  onClick={() => setIsVoucherCollected(!isVoucherCollected)}
                  className="btn"
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    height: '24px',
                    backgroundColor: isVoucherCollected ? '#e6f4ea' : 'var(--primary)',
                    color: isVoucherCollected ? '#137333' : 'white',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  {isVoucherCollected ? 'Collected' : 'Collect'}
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Details Card */}
          <div className="glass" style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: '#9e9e9e', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>DELIVERY OPTIONS</span>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
              <span style={{ fontSize: '16px' }}>📍</span>
              <div>
                <strong>Gwadar Sector Delivery</strong>
                <span style={{ display: 'block', fontSize: '10px', color: '#757575' }}>Choose sector (Mulla Band, Sabiya) at Checkout.</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '12px', borderTop: '1px solid #f1f1f1', paddingTop: '10px' }}>
              <span style={{ fontSize: '16px' }}>🚚</span>
              <div>
                <strong>Standard Delivery</strong>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', marginLeft: '4px' }}>FREE</span>
                <span style={{ display: 'block', fontSize: '10px', color: '#757575' }}>Fulfillment in 2-4 days (tailoring takes extra).</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', borderTop: '1px solid #f1f1f1', paddingTop: '10px' }}>
              <span style={{ fontSize: '16px' }}>💵</span>
              <div>
                <strong>Cash on Delivery Available</strong>
                <span style={{ display: 'block', fontSize: '10px', color: '#757575' }}>Pay cash to driver upon handoff.</span>
              </div>
            </div>
          </div>

          {/* Service Policies Card */}
          <div className="glass" style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: '#9e9e9e', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>STORE SERVICES</span>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
              <span style={{ fontSize: '16px' }}>↩</span>
              <div>
                <strong>7 Days Return Policy</strong>
                <span style={{ display: 'block', fontSize: '10px', color: '#757575' }}>Easy return if embroidery has defects.</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', borderTop: '1px solid #f1f1f1', paddingTop: '10px' }}>
              <span style={{ fontSize: '16px' }}>🛡️</span>
              <div>
                <strong>Artisan Handcraft Warranty</strong>
                <span style={{ display: 'block', fontSize: '10px', color: '#757575' }}>100% genuine local stitching.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Ratings & Customer Reviews Section (Daraz Style) */}
      <section className="glass" style={{ marginTop: '2.5rem', textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#212121', marginBottom: '20px' }}>Ratings & Reviews</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' }}>
          {/* Average Stars score */}
          <div style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0', paddingRight: '20px' }}>
            <h4 style={{ fontSize: '42px', color: 'var(--primary)', fontWeight: 'bold' }}>4.9</h4>
            <span style={{ color: '#ffc107', fontSize: '18px' }}>★ ★ ★ ★ ★</span>
            <span style={{ display: 'block', fontSize: '12px', color: '#757575', marginTop: '6px' }}>3 Ratings</span>
          </div>
          
          {/* Percentages bars */}
          <div>
            <div className="review-row">
              <span style={{ width: '40px' }}>5 Star</span>
              <div className="bar-bg"><div className="bar-fill" style={{ width: '90%' }}></div></div>
              <span style={{ width: '30px', textAlign: 'right' }}>90%</span>
            </div>
            <div className="review-row">
              <span style={{ width: '40px' }}>4 Star</span>
              <div className="bar-bg"><div className="bar-fill" style={{ width: '10%' }}></div></div>
              <span style={{ width: '30px', textAlign: 'right' }}>10%</span>
            </div>
            <div className="review-row">
              <span style={{ width: '40px' }}>3 Star</span>
              <div className="bar-bg"><div className="bar-fill" style={{ width: '0%' }}></div></div>
              <span style={{ width: '30px', textAlign: 'right' }}>0%</span>
            </div>
            <div className="review-row">
              <span style={{ width: '40px' }}>2 Star</span>
              <div className="bar-bg"><div className="bar-fill" style={{ width: '0%' }}></div></div>
              <span style={{ width: '30px', textAlign: 'right' }}>0%</span>
            </div>
            <div className="review-row">
              <span style={{ width: '40px' }}>1 Star</span>
              <div className="bar-bg"><div className="bar-fill" style={{ width: '0%' }}></div></div>
              <span style={{ width: '30px', textAlign: 'right' }}>0%</span>
            </div>
          </div>
        </div>

        {/* Customer testimonial reviews */}
        <div>
          {reviewsData.map((rev, rIdx) => (
            <div key={rIdx} style={{ padding: '15px 0', borderBottom: rIdx < reviewsData.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#ffc107', fontSize: '12px' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                <span style={{ fontSize: '11px', color: '#9e9e9e' }}>{rev.date}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#212121', marginBottom: '6px' }}>{rev.text}</p>
              <span style={{ fontSize: '11px', color: '#9e9e9e' }}>by {rev.name} | Verified Buyer in {rev.sector}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Q&A Section (Daraz Style) */}
      <section className="glass" style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#212121', marginBottom: '20px' }}>Questions About This Product</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {qaData.map((qa, qIdx) => (
            <div key={qIdx} style={{ paddingBottom: '12px', borderBottom: qIdx < qaData.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '4px' }}>
                <span style={{ color: 'var(--primary)' }}>Q:</span>
                <span>{qa.q}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
                <span style={{ color: '#00bcd4', fontWeight: 'bold' }}>A:</span>
                <span>{qa.a}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
