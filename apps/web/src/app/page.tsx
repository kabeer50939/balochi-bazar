'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';

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
  images: { id: string; url: string; isPrimary: boolean }[];
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real active Flash Sale countdown timer ticking down
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 12, seconds: 44 });
  
  // Active Hero Slide index
  const [activeSlide, setActiveSlide] = useState(0);



  const heroSlides = [
    {
      title: 'Premium Handcrafted Balochi Doch',
      subtitle: 'Directly from Gwadar artisans. Customize borders, Kureshi stitches, or book outfits on rent.',
      image: getApiUrl('/uploads/75d79d6b70bdd2a4c2fb90ae21faa29d.png'),
      tag: 'LOCAL TRADITIONS'
    },
    {
      title: 'Elegant Silk Sareeg Collection',
      subtitle: 'Exquisite headscarfs detailed with traditional Pikko, Koreshi, and Pith border lines.',
      image: getApiUrl('/uploads/8decb73422eb0f3e899d810211a5a4e6.png'),
      tag: 'ELEGANT STITCHES'
    },
    {
      title: 'Custom Chaddar Tikk & Borders',
      subtitle: 'Traditional wide sheet panels with customized Bala Morag and Irani Morag embroidery.',
      image: getApiUrl('/uploads/IMG-20260607-WA0006.jpg'),
      tag: 'GWADAR EXCLUSIVES'
    }
  ];

  useEffect(() => {
    // 1. Timer ticking down
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timerInterval);
          return prev;
        }
      });
    }, 1000);

    // 2. Banner slide interval (4 seconds)
    const slideInterval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 4000);

    // 3. Fetch products
    fetch(getApiUrl('/api/products'))
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
        setError('Could not retrieve products. Ensure backend is running.');
        setLoading(false);
      });

    return () => {
      clearInterval(timerInterval);
      clearInterval(slideInterval);
    };
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  // Categories list with nested structures for hover drawers (Daraz.pk effect)
  const categoriesData = [
    {
      name: 'Complete Balochi Sets',
      id: 'Complete Balochi Sets',
      icon: '👗',
      sections: [
        { title: 'Embroidery Type', items: ['Balochi Doch', 'Poll'] },
        { title: 'Inclusions', items: ['Pashk', 'Shalwar', 'Chaddar (Dupatta)'] }
      ]
    },
    {
      name: 'Sareeg',
      id: 'Sareeg',
      icon: '🧣',
      sections: [
        { title: 'Sareeg Borders', items: ['Koreshi', 'Pikko', 'Pith'] },
        { title: 'Stitch Styles', items: ['Doch', 'Poll'] }
      ]
    },
    {
      name: 'Chaddar Tikk / Border',
      id: 'Chaddar Tikk / Border',
      icon: '🧣',
      sections: [
        { title: 'Main Panels', items: ['Border', 'Tikk'] },
        { title: 'Kureshi Stitches', items: ['Bala Morag', 'Irani Morag', 'Pakistani Morag', 'Bandeek', 'Dhoor'] },
        { title: 'English Colour', items: ['Kasne Morag', 'Mazne Morag'] },
        { title: 'Zai Components', items: ['Zai Wala Poor', 'Chinok Tanab'] }
      ]
    },
    {
      name: 'Pashko / Shalwar',
      id: 'Pashko / Shalwar',
      icon: '👚',
      sections: [
        { title: 'Neem Doch Neck', items: ['Sarfag', 'Zai', 'Chinok', 'Tanab', 'Chilako', 'Sya Spait'] },
        { title: 'Trouser Details', items: ['Talooki Pitt', 'Chiloki Pitt', 'Pitt'] }
      ]
    },
    {
      name: 'Neem Doch',
      id: 'Neem Doch',
      icon: '🪡',
      sections: [
        { title: 'Embroideries', items: ['Sarfag', 'Zai', 'Chinok', 'Tanab'] },
        { title: 'Motifs', items: ['Chilako', 'Sya Spait', 'Pitt', 'Talooki Pitt', 'Chiloki Pitt'] }
      ]
    },
    {
      name: 'Pitt Doch',
      id: 'Pitt Doch',
      icon: '🪡',
      sections: [
        { title: 'Main Components', items: ['Taloki Pitt', 'Sya Spait', 'Sarfag', 'Tanab', 'Poor', 'Chango Hanook'] }
      ]
    },
    {
      name: 'Do-Rangi',
      id: 'Do-Rangi',
      icon: '🎨',
      sections: [
        { title: 'Double Color Stitches', items: ['Taloki Pitt', 'Sya Spait', 'Sarfag', 'Kanch (Mirror)', 'Poor', 'Chango Hanook'] }
      ]
    },
    {
      name: 'Patt Dhamman',
      id: 'Patt Dhamman',
      icon: '👗',
      sections: [
        { title: 'Broad Border Outfits', items: ['Patt Dhamman Suits', 'Rental Outfits'] }
      ]
    },
    {
      name: 'Baroo Tikk',
      id: 'Baroo Tikk',
      icon: '💎',
      sections: [
        { title: 'Motif Borders', items: ['Baroo Tikk Panels', 'Neck Embroideries'] }
      ]
    },
    {
      name: 'Boon Chera Daig',
      id: 'Boon Chera Daig',
      icon: '✨',
      sections: [
        { title: 'Luxury Bridal', items: ['Bridal Sets', 'Heavy Handcraft Sets'] }
      ]
    },
    {
      name: 'Rad Baro',
      id: 'Rad Baro',
      icon: '🌸',
      sections: [
        { title: 'Regional Stitches', items: ['Rad Baro Suits', 'Gwadar Special Stitches'] }
      ]
    },
    {
      name: 'Machine made',
      id: 'Machine made',
      icon: '⚙️',
      sections: [
        { title: 'Ready To Wear', items: ['Machine Embroidered Suits', 'Casual Prints'] }
      ]
    }
  ];

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      
      {/* 1. Main Banner Grid: Hero Banner Slider */}
      <section className="home-banner-section">
        {/* Right Slider / Interactive Carousel */}
        <div className="hero-slider">
          <div className="slider-container">
            {heroSlides.map((slide, index) => (
              <div
                key={index}
                className={`slider-slide ${activeSlide === index ? 'active' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.65)), url("${slide.image}")`
                }}
              >
                <div>
                  <span style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '2px',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}>
                    {slide.tag}
                  </span>
                  <h2 style={{
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textShadow: '1px 1px 4px rgba(0,0,0,0.6)'
                  }}>
                    {slide.title}
                  </h2>
                  <p style={{
                    color: 'white',
                    fontSize: '14px',
                    maxWidth: '550px',
                    textShadow: '1px 1px 4px rgba(0,0,0,0.6)',
                    opacity: 0.9,
                    marginBottom: '5px'
                  }}>
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Slider Dot Controls */}
            <div className="slider-dots">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`slider-dot ${activeSlide === index ? 'active' : ''}`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 1.5. Responsive Horizontal Category Scroll (Daraz mobile style) */}
      <div className="mobile-categories-scroll">
        {categoriesData.map((cat) => (
          <a href={`/catalog?category=${cat.id}`} key={cat.id} className="mobile-category-pill">
            <span className="category-pill-icon">{cat.icon}</span>
            <span className="category-pill-name">{cat.name.replace(/Balochi|made|Tikk|\/ Border/g, '').trim()}</span>
          </a>
        ))}
      </div>

      {/* 2. Highlight Icons Row */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '24px' }}>🚚</span>
          <div>
            <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-dark)' }}>Free Local Delivery</strong>
            <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Across all Gwadar sectors</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '24px' }}>💵</span>
          <div>
            <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-dark)' }}>Cash on Delivery</strong>
            <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Pay at your doorstep</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '24px' }}>🪡</span>
          <div>
            <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-dark)' }}>Custom Tailoring</strong>
            <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Define sizing details & embroidery</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-dark)' }}>Secure Dress Rentals</strong>
            <span style={{ fontSize: '11px', color: '#9e9e9e' }}>Refundable deposit returned in cash</span>
          </div>
        </div>
      </section>

      {/* 3. Flash Sale Section */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem', border: '1px solid var(--border-color)' }}>
        <div className="section-title-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '15px' }}>
          <div className="flash-sale-header">
            <span className="flash-sale-title" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>On Sale Now</span>
            <div className="countdown-box">
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '6px' }}>Ending in</span>
              <span className="time-bubble">{formatTime(timeLeft.hours)}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>:</span>
              <span className="time-bubble">{formatTime(timeLeft.minutes)}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>:</span>
              <span className="time-bubble">{formatTime(timeLeft.seconds)}</span>
            </div>
          </div>
          <a href="/catalog" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>SHOP ALL ➔</a>
        </div>

        {error && <div style={{ color: 'var(--primary)', fontSize: '14px', padding: '10px' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#757575' }}>Loading flash items...</div>
        ) : (
          <div className="responsive-product-grid">
            {products.slice(0, 6).map(prod => (
              <a href={`/product/${prod.id}`} key={prod.id} className="daraz-card">
                <div className="card-img-container">
                  <img src={prod.images?.[0]?.url || getApiUrl('/uploads/75d79d6b70bdd2a4c2fb90ae21faa29d.png')} className="card-img" alt={prod.name} />
                </div>
                <div className="card-details">
                  <h4 className="card-title">{prod.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '16px', color: 'var(--primary)', fontWeight: 'bold' }}>Rs. {(prod.basePrice * 0.9).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="card-price-original">Rs. {prod.basePrice.toLocaleString()}</span>
                    <span className="card-discount-badge">-10%</span>
                  </div>
                  
                  {/* Stock progress sold status (Daraz style) */}
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ height: '5px', backgroundColor: 'rgba(0, 0, 0, 0.08)', borderRadius: '3px', flexGrow: 1, marginRight: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '65%', backgroundColor: 'var(--primary)' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: '#757575', fontWeight: 'bold' }}>65% Sold</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* 4. Just For You Section */}
      <section>
        <div className="section-title-bar" style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 400, color: 'var(--text-dark)' }}>Just For You</h2>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#757575' }}>Loading custom catalog feed...</div>
        ) : (
          <div className="responsive-product-grid">
            {products.map(prod => (
              <a href={`/product/${prod.id}`} key={prod.id} className="daraz-card">
                <div className="card-img-container">
                  <img src={prod.images?.[0]?.url || getApiUrl('/uploads/75d79d6b70bdd2a4c2fb90ae21faa29d.png')} className="card-img" alt={prod.name} />
                </div>
                <div className="card-details">
                  <h4 className="card-title">{prod.name}</h4>
                  <div className="card-price">Rs. {prod.basePrice.toLocaleString()}</div>
                  
                  {/* Rating Stars Mock */}
                  <div className="card-ratings">
                    ⭐ ⭐ ⭐ ⭐ ⭐ <span style={{ color: '#757575', fontSize: '10px', marginLeft: '2px' }}>(5)</span>
                  </div>

                  {prod.isRentable && (
                    <span style={{ fontSize: '11px', color: '#137333', marginTop: '4px', fontWeight: '500' }}>
                      👗 Rental: Rs. {prod.rentPerDay?.toLocaleString()}/day
                    </span>
                  )}

                  <div className="card-location">
                    Gwadar
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
