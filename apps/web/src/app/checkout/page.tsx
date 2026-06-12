'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  isRental: boolean;
  rentalDays: number | null;
  customizations: string[];
  customSizing: any;
  pricePerUnit: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  
  // Direct backend URL — hardcoded for production reliability
  const getApiUrl = (path: string = '') => `https://balochi-bazar-backend.vercel.app${path}`;
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sectorName, setSectorName] = useState('Mulla Band');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}`;
    } else {
      formatted = cleaned;
    }
    setPhoneNumber(formatted);
  };

  useEffect(() => {
    // Load cart
    const items = JSON.parse(localStorage.getItem('bazar_cart') || '[]');
    setCartItems(items);
    
    // Check if user is logged in
    const token = localStorage.getItem('bazar_token');
    const user = JSON.parse(localStorage.getItem('bazar_user') || 'null');
    if (token && user) {
      setAuthToken(token);
      setName(user.name);
      setPhoneNumber(user.phoneNumber);
    } else {
      // Enforce email OTP verification by redirecting guests to register/login first
      window.location.href = '/login?redirect=/checkout';
    }
  }, []);

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // Format validation: Phone (XXXX-XXXXXXX)
    const phoneRegex = /^\d{4}-\d{7}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid Gwadar phone number in XXXX-XXXXXXX format (e.g. 0332-7579515).');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      let activeToken = authToken;

      // 1. If not logged in, auto-register/login the customer on the fly
      if (!activeToken) {
        const authRes = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber,
            password: 'localpassword123', // Hardcoded standard testing password
            name,
            sectorName,
            streetAddress,
            landmark
          })
        });

        const authData = await authRes.json();
        
        if (!authRes.ok) {
          // If already registered, try to login
          if (authData.error && authData.error.includes('already registered')) {
            const loginRes = await fetch(getApiUrl('/api/auth/login'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber, password: 'localpassword123' })
            });
            const loginData = await loginRes.json();
            if (!loginRes.ok) throw new Error(loginData.error || 'Failed to authenticate user');
            
            activeToken = loginData.token;
            localStorage.setItem('bazar_token', loginData.token);
            localStorage.setItem('bazar_user', JSON.stringify(loginData.user));
          } else {
            throw new Error(authData.error || 'Failed to register account');
          }
        } else {
          activeToken = authData.token;
          localStorage.setItem('bazar_token', authData.token);
          localStorage.setItem('bazar_user', JSON.stringify(authData.user));
        }
      }

      // 2. Add delivery address to profile
      const addressRes = await fetch(getApiUrl('/api/auth/address'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ sectorName, streetAddress, landmark, isDefault: true })
      });
      const addressData = await addressRes.json();
      if (!addressRes.ok) throw new Error(addressData.error || 'Failed to register delivery address');

      // 3. Create checkout order payload
      const orderPayload = {
        addressId: addressData.id,
        paymentMethod,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          customizations: item.customizations,
          customSizing: item.customSizing,
          isRental: item.isRental,
          rentalDays: item.rentalDays
        }))
      };

      const orderRes = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(orderPayload)
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Checkout transaction failed');

      // 4. If Bank Transfer chosen, upload receipt screenshot file
      if (paymentMethod === 'BANK_TRANSFER' && receiptFile) {
        const formData = new FormData();
        formData.append('receipt', receiptFile);

        const receiptRes = await fetch(getApiUrl(`/api/orders/${orderData.id}/receipt`), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeToken}`
          },
          body: formData
        });
        const receiptData = await receiptRes.json();
        if (!receiptRes.ok) throw new Error(receiptData.error || 'Receipt image upload failed');
      }

      // Success: Clear cart & redirect
      localStorage.removeItem('bazar_cart');
      alert(`Order successfully placed! Order Number: ${orderData.orderNumber}`);
      router.push('/orders');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  };

  const gwadarSectors = [
    'Mulla Band',
    'Sabiya',
    'Shahi Chaman',
    'Pishukan',
    'Old Town',
    'New Town Phase 1',
    'New Town Phase 2',
    'Singhar',
    'Kohan'
  ];

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2.5rem' }}>
        Checkout & <span style={{ color: 'var(--primary)' }}>Delivery</span>
      </h1>

      {error && <div style={{ padding: '1rem', background: 'var(--danger)', color: 'white', borderRadius: '6px', marginBottom: '2rem' }}>{error}</div>}

      <form onSubmit={handleCheckoutSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Side: Delivery Details Form */}
        <div className="glass" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Customer & Delivery Info
          </h3>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              placeholder="Enter name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!authToken}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gwadar Mobile Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. 0332-7579515 (format: XXXX-XXXXXXX)"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={!!authToken}
            />
            {!authToken && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                * A temporary password will be auto-created for local testing login.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Gwadar Sector</label>
            <select
              className="form-input"
              value={sectorName}
              onChange={(e) => setSectorName(e.target.value)}
            >
              {gwadarSectors.map(sect => (
                <option key={sect} value={sect}>{sect}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              required
              placeholder="House #, Street name, Sector details"
              className="form-input"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Famous Landmark (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Near Port gate, School, Masjid"
              className="form-input"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side: Payment & Totals */}
        <div className="glass" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Payment Method
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: 'var(--text-dark)' }}>Cash on Delivery (COD)</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pay cash to our delivery staff upon receiving the package.</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'BANK_TRANSFER'}
                onChange={() => setPaymentMethod('BANK_TRANSFER')}
              />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: 'var(--text-dark)' }}>Local Bank / Wallet Transfer</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transfer locally & upload receipt screenshot below.</span>
              </div>
            </label>
          </div>

          {/* Local bank account details */}
          {paymentMethod === 'BANK_TRANSFER' && (
            <div style={{ padding: '1.25rem', marginBottom: '2rem', backgroundColor: 'rgba(212, 175, 55, 0.04)', border: '1px dashed var(--primary)', borderRadius: '4px', textAlign: 'left' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-dark)', display: 'block', marginBottom: '0.5rem' }}>Transfer Details:</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span>🏦 <strong>Bank:</strong> Habib Bank Limited (HBL) - Gwadar Branch</span>
                <span>📋 <strong>Account Number:</strong> 1234-567890-001</span>
                <span>👤 <strong>Account Title:</strong> Balochi Bazzar</span>
                <span>📱 <strong>EasyPaisa / JazzCash:</strong> 0300-1234567</span>
              </div>
              
              <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-dark)' }}>Upload Receipt Screenshot</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  className="form-input"
                  style={{ background: 'none', border: 'none', padding: 0, height: 'auto' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* Totals panel */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              <span>Total Price</span>
              <span>Rs. {calculateTotal().toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              <span>Delivery Charges</span>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <strong>Grand Total</strong>
              <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Rs. {calculateTotal().toLocaleString()}</strong>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: '100%', fontSize: '1.05rem', padding: '0.9rem', fontWeight: 'bold', height: '45px' }}
            disabled={loading || cartItems.length === 0}
          >
            {loading ? 'Processing Order...' : 'Confirm Order'}
          </button>
        </div>

      </form>
    </div>
  );
}
