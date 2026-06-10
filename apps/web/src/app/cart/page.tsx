'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  isRental: boolean;
  rentalDays: number | null;
  customizations: string[];
  customSizing: any;
  pricePerUnit: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('bazar_cart') || '[]');
    setCartItems(items);
  }, []);

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    setCartItems(updated);
    localStorage.setItem('bazar_cart', JSON.stringify(updated));
  };

  const removeItem = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
    localStorage.setItem('bazar_cart', JSON.stringify(updated));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
  };

  const proceedToCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2.5rem' }}>
        Your Shopping <span style={{ color: 'var(--primary)' }}>Bag</span>
      </h1>

      {cartItems.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          <h2>Your bag is currently empty.</h2>
          <p style={{ marginTop: '0.75rem', marginBottom: '2rem' }}>Browse our traditional Balochi Doch garments to add items.</p>
          <a href="/catalog" className="btn btn-accent">Explore Catalog</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {cartItems.map((item, index) => (
              <div key={index} className="glass" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', position: 'relative', textAlign: 'left' }}>
                <div style={{
                  width: '100px',
                  height: '130px',
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0
                }} />
                
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.5rem', paddingRight: '1.5rem' }}>{item.name}</h3>
                  
                  {/* Order Type Tag */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    {item.isRental ? (
                      <span className="badge badge-accent" style={{ fontSize: '10px' }}>
                        Rental ({item.rentalDays} Days)
                      </span>
                    ) : (
                      <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                        Purchase
                      </span>
                    )}
                  </div>

                  {/* Customizations details */}
                  {item.customizations && item.customizations.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      🎨 Custom: {item.customizations.join(', ')}
                    </div>
                  )}

                  {/* Sizing Details */}
                  {item.customSizing && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      📏 Size: {item.customSizing.standardSize ? (
                        `Standard (${item.customSizing.standardSize})`
                      ) : (
                        `Custom (H:${item.customSizing.height}cm, C:${item.customSizing.chest}", W:${item.customSizing.waist}")`
                      )}
                    </div>
                  )}

                  {/* Qty and Price Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '2px', height: '32px' }}>
                      <button onClick={() => updateQuantity(index, item.quantity - 1)} className="qty-btn">-</button>
                      <span className="qty-display">{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, item.quantity + 1)} className="qty-btn">+</button>
                    </div>
                    
                    <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>
                      Rs. {(item.pricePerUnit * item.quantity).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(index)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.2rem'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary Panel */}
          <div className="glass" style={{ padding: '2rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Order Summary
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <span>Items Total</span>
              <span>Rs. {calculateTotal().toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <span>Delivery (Gwadar)</span>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>FREE</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.5rem',
              marginBottom: '2rem'
            }}>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>Total Amount</strong>
              <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                Rs. {calculateTotal().toLocaleString()}
              </strong>
            </div>

            <button
              onClick={proceedToCheckout}
              className="btn btn-primary"
              style={{ width: '100%', fontWeight: 'bold', height: '45px' }}
            >
              Proceed to Local Checkout
            </button>
            
            <a href="/catalog" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem', textAlign: 'center', display: 'block', textDecoration: 'none' }}>
              Continue Shopping
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
