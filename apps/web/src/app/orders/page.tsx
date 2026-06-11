'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProductImage {
  url: string;
}

interface Product {
  name: string;
  images: ProductImage[];
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  customizations: string | null;
  customSizing: string | null;
  product: Product;
}

interface RentalDetail {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  actualReturnDate: string | null;
  lateFeeCharged: number | null;
  damageFeeCharged: number | null;
  notes: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentReceiptUrl: string | null;
  createdAt: string;
  orderItems: OrderItem[];
  rentals: RentalDetail[];
  address: { sectorName: string; streetAddress: string };
}

export default function MyOrdersPage() {
  const router = useRouter();
  
  // Direct backend URL — hardcoded for production reliability
  const getApiUrl = (path: string = '') => `https://balochi-bazar-backend.vercel.app${path}`;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Authentication states
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const activeToken = localStorage.getItem('bazar_token');
    if (activeToken) {
      setToken(activeToken);
      fetchOrders(activeToken);
    } else {
      router.push('/login?redirect=/orders');
    }
  }, [router]);

  const fetchOrders = (activeToken: string) => {
    setLoading(true);
    fetch(getApiUrl('/api/orders/my-orders'), {
      headers: {
        'Authorization': `Bearer ${activeToken}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to retrieve orders.');
        return res.json();
      })
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch your orders. Make sure the local server is running.');
        setLoading(false);
      });
  };

  // Removed unused handleTestLogin handler

  const logout = () => {
    localStorage.removeItem('bazar_token');
    localStorage.removeItem('bazar_user');
    setToken(null);
    setOrders([]);
  };

  const handleConfirmReceived = async (orderId: string) => {
    if (!window.confirm('Are you sure you have received this order?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/receive`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Order marked as received successfully.');
        fetchOrders(token!);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update order.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to local server.');
    }
  };

  const handleRequestReturn = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to request a return/refund for this order?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/return`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Return request submitted. Our staff will inspect and pick up the garment shortly.');
        fetchOrders(token!);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to request return.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to local server.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'var(--warning)';
      case 'CONFIRMED': return 'var(--success)';
      case 'IN_EMBROIDERY': return 'var(--text-gold)';
      case 'IN_TAILORING': return '#60a5fa';
      case 'READY_FOR_DELIVERY': return '#c084fc';
      case 'OUT_FOR_DELIVERY': return '#38bdf8';
      case 'DELIVERED': case 'COMPLETED': return 'var(--success)';
      case 'CANCELLED': return 'var(--danger)';
      case 'RETURN_REQUESTED': return '#f43f5e';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
          Your <span style={{ color: 'var(--text-gold)' }}>Orders</span>
        </h1>
        {token && (
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            Logout Profile
          </button>
        )}
      </div>

      {error && <div style={{ padding: '1rem', background: 'var(--danger)', borderRadius: '6px', marginBottom: '2rem' }}>{error}</div>}

      {/* If not logged in, show a simple login portal */}
      {!token ? (
        <div style={{ textAlign: 'center', padding: '5rem' }} className="glass">
          <h3 style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>Redirecting to Login Portal...</h3>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            If you are not automatically redirected, please click <a href="/login?redirect=/orders" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>here</a>.
          </p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading your order history...</div>
      ) : orders.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          <h2>No orders found for this profile.</h2>
          <p style={{ marginTop: '0.75rem', marginBottom: '2rem' }}>Place your first customized Balochi Doch purchase or rental!</p>
          <a href="/catalog" className="btn btn-accent">Explore Catalog</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="glass" style={{ padding: '2rem', borderLeft: `4px solid ${getStatusColor(order.status)}`, textAlign: 'left' }}>
              
              {/* Order Header Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Number</span>
                  <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--text-dark)' }}>{order.orderNumber}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date Placed</span>
                  <span style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-dark)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: 'var(--primary)' }}>Rs. {order.totalAmount.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tailoring Status</span>
                  <span className="badge" style={{ display: 'block', marginTop: '0.2rem', background: getStatusColor(order.status), color: 'white', fontWeight: 'bold', padding: '4px 8px' }}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {order.orderItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '75px',
                      backgroundImage: `url(${item.product?.images?.[0]?.url || getApiUrl('/uploads/75d79d6b70bdd2a4c2fb90ae21faa29d.png')})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '4px'
                    }} />
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-dark)' }}>{item.product.name} (x{item.quantity})</strong>
                      {item.customizations && (
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          ✂️ Customizations: {JSON.parse(item.customizations).join(', ')}
                        </span>
                      )}
                      {item.customSizing && (
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          📐 Sizing: {
                            JSON.parse(item.customSizing).standardSize 
                              ? `Standard (${JSON.parse(item.customSizing).standardSize})`
                              : `Custom Measurements Applied`
                          }
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Address and Payment Methods Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>📍 Delivery Address (Gwadar Sector)</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                    Sector: <strong>{order.address.sectorName}</strong>, {order.address.streetAddress}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>💳 Payment Method</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'} ({order.paymentStatus})
                  </span>
                  {order.paymentReceiptUrl && (
                    <a href={getApiUrl(order.paymentReceiptUrl)} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 'bold' }}>
                      👁️ View Uploaded Receipt
                    </a>
                  )}
                </div>
              </div>

              {/* Rental Details Banner */}
              {order.rentals && order.rentals.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.04)', borderRadius: '4px', border: '1px dashed var(--primary)' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>📅 Active Clothing Rental Booking</strong>
                  {order.rentals.map((rental) => (
                    <div key={rental.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                      <span>Start: <strong>{new Date(rental.startDate).toLocaleDateString()}</strong></span>
                      <span>Return Due: <strong style={{ color: 'var(--primary)' }}>{new Date(rental.endDate).toLocaleDateString()}</strong></span>
                      <span>Rental Status: <strong style={{ textTransform: 'uppercase', color: rental.status === 'RETURN_REQUESTED' ? '#f43f5e' : 'var(--success)' }}>{rental.status}</strong></span>
                      {rental.actualReturnDate && (
                        <span>Returned On: <strong>{new Date(rental.actualReturnDate).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Order Actions */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                {['OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY', 'IN_TAILORING', 'CONFIRMED', 'PENDING'].includes(order.status) && (
                  <button
                    onClick={() => handleConfirmReceived(order.id)}
                    className="btn btn-accent"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', height: '38px' }}
                  >
                    🤝 Confirm Order Received
                  </button>
                )}
                {order.status === 'DELIVERED' && (
                  <button
                    onClick={() => handleRequestReturn(order.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', borderColor: '#f43f5e', color: '#f43f5e', height: '38px' }}
                  >
                    ↩️ Request Return / Refund
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
