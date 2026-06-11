import React, { useState, useEffect } from 'react';

// Interfaces
interface ProductImage { url: string }
interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  stockQuantity: number;
  isRentable: boolean;
  rentPerDay?: number | null;
  depositFee?: number | null;
  images?: ProductImage[];
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
  notes?: string | null;
  order?: {
    orderNumber: string;
    user: { name: string; phoneNumber: string };
  };
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
  user: { name: string; phoneNumber: string };
  address: { sectorName: string; streetAddress: string };
  orderItems: OrderItem[];
  rentals: RentalDetail[];
}
interface Stats {
  totalSales: number;
  pendingTailoringCount: number;
  activeRentalsCount: number;
  totalOrdersCount: number;
  totalProductsCount: number;
}

// Custom Inline SVG Icons
const IconDashboard = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
);
const IconProduct = () => (
  <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);
const IconOrder = () => (
  <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);
const IconReturn = () => (
  <svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
);
const IconRental = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v1c-2 0-3.5 1-4 3h14c-.5-2-2-3-4-3V5a3 3 0 0 0-3-3z"/><path d="M2 17l10-10 10 10H2z"/><circle cx="12" cy="19" r="1"/></svg>
);

// Sparkline Component
const Sparkline = ({ points, color = 'var(--primary)' }: { points: number[]; color?: string }) => {
  const width = 120;
  const height = 25;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const path = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg className="sparkline-svg" style={{ width: `${width}px`, height: `${height}px`, stroke: color }}>
      <path d={path} />
    </svg>
  );
};

export default function App() {
  const getApiUrl = (path: string = '') => {
    if (import.meta.env.VITE_API_URL) {
      return `${import.meta.env.VITE_API_URL}${path}`;
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:5000${path}`;
    }
    return `https://balochi-bazar-backend.vercel.app${path}`;
  };

  const getProductImageUrl = (product: any) => {
    const imgUrl = product?.images?.[0]?.url;
    if (!imgUrl) {
      return product?.isRentable 
        ? "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=150&q=80" 
        : "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=150&q=80";
    }
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(imgUrl);
        if (urlObj.pathname.startsWith('/uploads')) {
          return getApiUrl(urlObj.pathname);
        }
      } catch (e) {}
      return imgUrl;
    }
    return getApiUrl(imgUrl);
  };

  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Login form state
  const [phoneNumber, setPhoneNumber] = useState('03001234567');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Active panel state
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ORDERS' | 'RENTALS' | 'INVENTORY'>('DASHBOARD');

  // Business Advisor Metrics Filter State
  const [metricsTimeFilter, setMetricsTimeFilter] = useState<'REALTIME' | 'YESTERDAY' | '7DAYS' | '30DAYS'>('REALTIME');

  // Dashboard stats
  const [stats, setStats] = useState<Stats | null>(null);

  // Lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<RentalDetail[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Sidebar Accordion states
  const [expandedGroups, setExpandedGroups] = useState({
    analytics: true,
    orders: true,
    catalog: true,
  });

  const toggleGroup = (group: 'analytics' | 'orders' | 'catalog') => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // Product page tab filter (All, Online, Out of Stock, Offline)
  const [productTabFilter, setProductTabFilter] = useState<'ALL' | 'ONLINE' | 'OUT_OF_STOCK' | 'OFFLINE'>('ALL');
  const [productSearch, setProductSearch] = useState('');

  // Order list filters
  const [ordersFilter, setOrdersFilter] = useState<'PENDING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'RETURNED' | 'CANCELLED' | 'ALL'>('PENDING');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [orderNumberFilter, setOrderNumberFilter] = useState('');
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  // Multi-Selection Checkbox states (For bulk printing/processing)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Inline Stock Editing state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<string>('');

  // Product online/offline toggle maps
  const [onlineProducts, setOnlineProducts] = useState<Record<string, boolean>>({});

  // Document Print Preview Modal state
  const [printModalData, setPrintModalData] = useState<{ type: 'LABEL' | 'INVOICE'; orderIds: string[] } | null>(null);

  // Receipt modal viewer state
  const [receiptModalImage, setReceiptModalImage] = useState<string | null>(null);

  // Return processing state
  const [activeRentalReturn, setActiveRentalReturn] = useState<RentalDetail | null>(null);
  const [returnStatus, setReturnStatus] = useState('RETURNED_GOOD');
  const [lateFee, setLateFee] = useState('0');
  const [damageFee, setDamageFee] = useState('0');
  const [returnNotes, setReturnNotes] = useState('');

  // Inventory creation states
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('COMPLETE_SET');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('5');
  const [isNewRentable, setIsNewRentable] = useState(false);
  const [newRentPrice, setNewRentPrice] = useState('');
  const [newDeposit, setNewDeposit] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [allowsEmbroidery, setAllowsEmbroidery] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('bazar_admin_token');
    const savedRole = localStorage.getItem('bazar_admin_role');
    if (savedToken && savedRole) {
      setToken(savedToken);
      setUserRole(savedRole);
      fetchDashboardData(savedToken);
    }
  }, []);

  const fetchDashboardData = (activeToken: string) => {
    // Stats
    fetch(getApiUrl('/api/admin/stats'), { headers: { Authorization: `Bearer ${activeToken}` } })
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);

    // Orders
    fetch(getApiUrl('/api/admin/orders'), { headers: { Authorization: `Bearer ${activeToken}` } })
      .then((res) => res.json())
      .then(setOrders)
      .catch(console.error);

    // Rentals
    fetch(getApiUrl('/api/admin/rentals'), { headers: { Authorization: `Bearer ${activeToken}` } })
      .then((res) => res.json())
      .then(setRentals)
      .catch(console.error);

    // Products Catalog
    fetch(getApiUrl('/api/products'))
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        const map: Record<string, boolean> = {};
        data.forEach((p: Product) => {
          map[p.id] = p.stockQuantity > 0;
        });
        setOnlineProducts((prev) => ({ ...map, ...prev }));
      })
      .catch(console.error);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.user.role !== 'ADMIN' && data.user.role !== 'STAFF') {
        throw new Error('Access denied: You must be an admin or staff member.');
      }

      localStorage.setItem('bazar_admin_token', data.token);
      localStorage.setItem('bazar_admin_role', data.user.role);
      setToken(data.token);
      setUserRole(data.user.role);
      fetchDashboardData(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Error occurred.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bazar_admin_token');
    localStorage.removeItem('bazar_admin_role');
    setToken(null);
    setUserRole('');
  };

  const confirmPayment = async (orderId: string, status: 'PAID' | 'FAILED') => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/orders/${orderId}/payment`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) {
        alert(status === 'PAID' ? 'Payment verified! Order moved to confirmed and tailoring pipeline.' : 'Payment marked as failed.');
        fetchDashboardData(token!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchDashboardData(token!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const advanceOrderStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = 'PENDING';
    if (currentStatus === 'PENDING') nextStatus = 'CONFIRMED';
    else if (currentStatus === 'CONFIRMED') nextStatus = 'IN_EMBROIDERY';
    else if (currentStatus === 'IN_EMBROIDERY') nextStatus = 'IN_TAILORING';
    else if (currentStatus === 'IN_TAILORING') nextStatus = 'READY_FOR_DELIVERY';
    else if (currentStatus === 'READY_FOR_DELIVERY') nextStatus = 'OUT_FOR_DELIVERY';
    else if (currentStatus === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';
    else if (currentStatus === 'DELIVERED') nextStatus = 'COMPLETED';

    await updateStatus(orderId, nextStatus);
  };

  const dispatchRental = async (rentalId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/rentals/${rentalId}/return`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'RENTED_OUT' }),
      });
      if (res.ok) {
        fetchDashboardData(token!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRentalReturn) return;

    try {
      const res = await fetch(getApiUrl(`/api/admin/rentals/${activeRentalReturn.id}/return`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: returnStatus,
          lateFeeCharged: lateFee,
          damageFeeCharged: damageFee,
          notes: returnNotes,
        }),
      });
      if (res.ok) {
        alert('Rental return successfully logged. Stock restored.');
        setActiveRentalReturn(null);
        fetchDashboardData(token!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: newProductName,
      description: newProductDesc,
      category: newProductCategory,
      basePrice: newProductPrice,
      stockQuantity: newProductStock,
      isRentable: isNewRentable,
      rentPerDay: isNewRentable ? newRentPrice : null,
      depositFee: isNewRentable ? newDeposit : null,
      allowsCustomEmbroidery: allowsEmbroidery,
      imageUrls: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
    };

    try {
      const res = await fetch(getApiUrl('/api/admin/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('New product added to inventory.');
        setNewProductName('');
        setNewProductDesc('');
        setNewProductPrice('');
        setNewProductStock('5');
        setIsNewRentable(false);
        setNewRentPrice('');
        setNewDeposit('');
        fetchDashboardData(token!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (productId: string, stockVal: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/products/${productId}/stock`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stockQuantity: stockVal }),
      });
      if (res.ok) {
        setEditingStockId(null);
        fetchDashboardData(token!);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleProductOnline = (productId: string) => {
    setOnlineProducts((prev) => {
      const nextVal = !prev[productId];
      alert(`Product ${productId.slice(0, 8)} is now marked ${nextVal ? 'ONLINE' : 'OFFLINE'} on Balochi Bazar customer catalog.`);
      return { ...prev, [productId]: nextVal };
    });
  };

  // Checkbox functions
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleAllOrdersSelection = (currentFilteredIds: string[]) => {
    if (selectedOrderIds.length === currentFilteredIds.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(currentFilteredIds);
    }
  };

  const handleBatchReadyToShip = async () => {
    if (selectedOrderIds.length === 0) return;
    if (window.confirm(`Mark all ${selectedOrderIds.length} selected orders as READY TO SHIP?`)) {
      let successCount = 0;
      for (const id of selectedOrderIds) {
        const ord = orders.find((o) => o.id === id);
        if (ord && ord.status !== 'READY_FOR_DELIVERY') {
          try {
            const res = await fetch(getApiUrl(`/api/admin/orders/${id}/status`), {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: 'READY_FOR_DELIVERY' }),
            });
            if (res.ok) successCount++;
          } catch (e) {
            console.error(e);
          }
        }
      }
      alert(`Batch updates completed! ${successCount} orders set to Ready to Ship.`);
      setSelectedOrderIds([]);
      fetchDashboardData(token!);
    }
  };

  // Generate unique sectors for order filters
  const uniqueSectors = Array.from(new Set(orders.map((o) => o.address?.sectorName).filter(Boolean)));

  // Calculate dynamic dashboard stats to map notifications and to-do counters
  const todoPendingOrdersCount = orders.filter((o) => o.status === 'PENDING' || o.paymentStatus === 'PENDING').length;
  const todoReadyToShipCount = orders.filter((o) => o.status === 'READY_FOR_DELIVERY').length;
  const todoReturnRequestsCount = orders.filter((o) => o.status === 'RETURN_REQUESTED').length;
  const todoOutOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
  const todoRentalsAwaitingCount = rentals.filter((r) => r.status === 'AWAITING_DISPATCH').length;
  const todoRentalsActiveCount = rentals.filter((r) => r.status === 'RENTED_OUT').length;

  // Business Advisor dynamic metrics multiplier based on time filter
  const getMetricsData = () => {
    if (!stats) return null;
    let multiplier = 1;
    let sales = stats.totalSales;
    let orderCount = stats.totalOrdersCount;
    let visitorCount = 420;
    let conversionRate = 2.45;

    if (metricsTimeFilter === 'YESTERDAY') {
      multiplier = 0.92;
      visitorCount = 380;
      conversionRate = 2.1;
    } else if (metricsTimeFilter === '7DAYS') {
      multiplier = 6.4;
      visitorCount = 2650;
      conversionRate = 2.65;
    } else if (metricsTimeFilter === '30DAYS') {
      multiplier = 28.5;
      visitorCount = 11200;
      conversionRate = 2.58;
    }

    return {
      revenue: Math.round(sales * multiplier),
      orders: Math.round(orderCount * multiplier),
      backlog: stats.pendingTailoringCount,
      rentals: stats.activeRentalsCount,
      visitors: visitorCount,
      conversion: conversionRate,
    };
  };

  const metricsData = getMetricsData();

  // Render Login Frame
  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f5f8' }}>
        <div className="daraz-card" style={{ width: '420px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'black', fontSize: '24px', fontStyle: 'italic' }}>B</div>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#212121', letterSpacing: '-0.5px' }}>
                Balochi Bazar <span style={{ color: 'var(--primary)', fontWeight: '400' }}>Seller Center</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Gwadar Atelier Operations Dashboard</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '2px', fontSize: '0.8rem', marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" required className="daraz-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 03001234567" />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password</label>
              <input type="password" required className="daraz-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-daraz btn-daraz-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Login to Balochi Bazar Seller Center
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', border: '1px dashed #dcdcdc', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <strong>Demo Accounts (Pre-seeded):</strong><br />
            🔑 Admin: 03001234567 / admin123<br />
            🔑 Staff: 03007654321 / staff123
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* 100% Cohesive Customer Web Style Header Bar */}
      <header style={{
        height: '56px',
        backgroundColor: '#131a22',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 1000,
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Balochi Bazar Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('DASHBOARD')}>
            <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', fontStyle: 'italic' }}>B</div>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Balochi Bazar <span style={{ color: 'var(--primary)', fontWeight: '400' }}>Seller Center</span>
            </span>
          </div>
          
          <span style={{ height: '16px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}></span>
          
          {/* Header Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ffffff', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search for orders, products..." 
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '11px', width: '200px', color: 'var(--text-primary)' }} 
              value={ordersSearch}
              onChange={(e) => {
                setOrdersSearch(e.target.value);
                if (activeTab !== 'ORDERS') setActiveTab('ORDERS');
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '11px', color: '#cccccc' }}>
          {/* Support links */}
          <span style={{ color: '#cccccc', fontWeight: 500 }}>Bazar Academy</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
          <span style={{ color: '#cccccc', fontWeight: 500 }}>Bazar Help Center</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
          <span style={{ color: '#cccccc', fontWeight: 500 }}>Bazar Support</span>
          
          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>

          {/* Pakistan Location & Flag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '3px 8px', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '12px' }}>🇵🇰</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>Gwadar (PK)</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>▼</span>
          </div>
          
          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>

          {/* Notification bell */}
          <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }} onClick={() => alert('All Gwadar delivery lines operating normally.')}>
            <span style={{ fontSize: '13px' }}>🔔</span>
            <span style={{ backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '8px', padding: '1px 4px', fontWeight: 'bold', position: 'relative', top: '-6px', left: '-4px' }}>
              {todoPendingOrdersCount + todoReturnRequestsCount}
            </span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>

          {/* User ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>A</div>
            <strong style={{ color: '#ffffff' }}>Atelier Gwadar</strong>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="admin-container">
        {/* Sidebar Accordion Panel */}
        <aside className="sidebar">
          {/* Category Group 1: Analytics */}
          <div className="sidebar-menu-group">
            <div className={`sidebar-group-header ${expandedGroups.analytics ? 'open' : ''}`} onClick={() => toggleGroup('analytics')}>
              <span>📊 Finance & Analytics</span>
              <span className="arrow-icon">▶</span>
            </div>
            {expandedGroups.analytics && (
              <ul className="menu">
                <li>
                  <button onClick={() => setActiveTab('DASHBOARD')} className={`menu-item ${activeTab === 'DASHBOARD' ? 'active' : ''}`}>
                    <IconDashboard />
                    Business Advisor
                  </button>
                </li>
              </ul>
            )}
          </div>

          {/* Category Group 2: Orders */}
          <div className="sidebar-menu-group">
            <div className={`sidebar-group-header ${expandedGroups.orders ? 'open' : ''}`} onClick={() => toggleGroup('orders')}>
              <span>📦 Orders & Reviews</span>
              <span className="arrow-icon">▶</span>
            </div>
            {expandedGroups.orders && (
              <ul className="menu">
                <li>
                  <button onClick={() => { setActiveTab('ORDERS'); setOrdersFilter('PENDING'); }} className={`menu-item ${activeTab === 'ORDERS' && ordersFilter !== 'RETURNED' ? 'active' : ''}`}>
                    <IconOrder />
                    Manage Orders
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('ORDERS'); setOrdersFilter('RETURNED'); }} className={`menu-item ${activeTab === 'ORDERS' && ordersFilter === 'RETURNED' ? 'active' : ''}`}>
                    <IconReturn />
                    Return Orders
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('RENTALS')} className={`menu-item ${activeTab === 'RENTALS' ? 'active' : ''}`}>
                    <IconRental />
                    Rent Return Tracker
                  </button>
                </li>
              </ul>
            )}
          </div>

          {/* Category Group 3: Products */}
          <div className="sidebar-menu-group">
            <div className={`sidebar-group-header ${expandedGroups.catalog ? 'open' : ''}`} onClick={() => toggleGroup('catalog')}>
              <span>📋 Product & Catalog</span>
              <span className="arrow-icon">▶</span>
            </div>
            {expandedGroups.catalog && (
              <ul className="menu">
                <li>
                  <button onClick={() => setActiveTab('INVENTORY')} className={`menu-item ${activeTab === 'INVENTORY' ? 'active' : ''}`}>
                    <IconProduct />
                    Manage Products
                  </button>
                </li>
              </ul>
            )}
          </div>

          {/* Exit Link */}
          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={handleLogout} className="btn-daraz btn-daraz-secondary" style={{ width: '100%', fontSize: '11px', fontWeight: 'bold' }}>
              Exit Balochi Bazar Admin
            </button>
          </div>
        </aside>

        {/* main panels router */}
        <main className="main-content">
          
          {/* TAB 1: BUSINESS ADVISOR DASHBOARD */}
          {activeTab === 'DASHBOARD' && metricsData && (
            <div>
              {/* Daraz Seller Center Announcement notice banner */}
              <div style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid rgba(255, 153, 0, 0.2)',
                padding: '8px 12px',
                marginBottom: '1rem',
                fontSize: '11px',
                color: 'var(--text-gold, #c45500)',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '2px'
              }}>
                <span>📢 <strong>Seller Announcement:</strong> Welcome to Balochi Bazar Seller Center Atelier Gwadar! Ensure all custom tailoring sizes and rentals are audited. Next shipping carrier package pickup is scheduled for 18:00 PKT.</span>
                <span style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginLeft: '10px' }} onClick={(e) => {
                  const parent = e.currentTarget.parentElement;
                  if (parent) parent.style.display = 'none';
                }}>&times;</span>
              </div>

              <div className="page-title-bar">
                <div>
                  <h1 className="page-title">Business Advisor Dashboard</h1>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Real-time performance review for <strong>Atelier Gwadar (Seller ID: PK_GW_001)</strong>
                  </p>
                </div>
                {/* Time filter buttons groups */}
                <div className="time-filter-btn-group">
                  <button onClick={() => setMetricsTimeFilter('REALTIME')} className={`time-filter-btn ${metricsTimeFilter === 'REALTIME' ? 'active' : ''}`}>Real-time</button>
                  <button onClick={() => setMetricsTimeFilter('YESTERDAY')} className={`time-filter-btn ${metricsTimeFilter === 'YESTERDAY' ? 'active' : ''}`}>Yesterday</button>
                  <button onClick={() => setMetricsTimeFilter('7DAYS')} className={`time-filter-btn ${metricsTimeFilter === '7DAYS' ? 'active' : ''}`}>7 Days</button>
                  <button onClick={() => setMetricsTimeFilter('30DAYS')} className={`time-filter-btn ${metricsTimeFilter === '30DAYS' ? 'active' : ''}`}>30 Days</button>
                </div>
              </div>

              {/* To-Do Shortcut counters */}
              <div className="daraz-card">
                <div className="daraz-card-title">To-Do List (Action Required)</div>
                <div className="todo-grid">
                  <div className="todo-item" onClick={() => { setActiveTab('ORDERS'); setOrdersFilter('PENDING'); }}>
                    <div className="todo-count">{todoPendingOrdersCount}</div>
                    <div className="todo-label">Pending Orders</div>
                  </div>
                  <div className="todo-item" onClick={() => { setActiveTab('ORDERS'); setOrdersFilter('READY_TO_SHIP'); }}>
                    <div className="todo-count">{todoReadyToShipCount}</div>
                    <div className="todo-label">Ready to Ship</div>
                  </div>
                  <div className="todo-item" onClick={() => { setActiveTab('ORDERS'); setOrdersFilter('RETURNED'); }}>
                    <div className="todo-count">{todoReturnRequestsCount}</div>
                    <div className="todo-label">Return Orders</div>
                  </div>
                  <div className="todo-item" onClick={() => setActiveTab('INVENTORY')}>
                    <div className="todo-count" style={{ color: todoOutOfStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{todoOutOfStockCount}</div>
                    <div className="todo-label">Out of Stock</div>
                  </div>
                  <div className="todo-item" onClick={() => setActiveTab('RENTALS')}>
                    <div className="todo-count">{todoRentalsAwaitingCount}</div>
                    <div className="todo-label">Rentals to Dispatch</div>
                  </div>
                  <div className="todo-item" onClick={() => setActiveTab('RENTALS')}>
                    <div className="todo-count">{todoRentalsActiveCount}</div>
                    <div className="todo-label">Active Rentals</div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Widgets */}
              <div className="metrics-grid">
                <div className="metric-card primary">
                  <div className="metric-label">Revenue (Rs.)</div>
                  <div className="metric-value">Rs. {metricsData.revenue.toLocaleString()}</div>
                  <div className="metric-trend">
                    ▲ +12.5% <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>vs prev span</span>
                  </div>
                  <Sparkline points={[12000, 16000, 14000, 22000, 29000, metricsData.revenue]} color="var(--primary)" />
                </div>

                <div className="metric-card">
                  <div className="metric-label">Orders Count</div>
                  <div className="metric-value">{metricsData.orders}</div>
                  <div className="metric-trend">
                    ▲ +4.2% <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>vs prev span</span>
                  </div>
                  <Sparkline points={[8, 12, 11, 15, 20, metricsData.orders]} color="var(--info)" />
                </div>

                <div className="metric-card">
                  <div className="metric-label">Visitors</div>
                  <div className="metric-value">{metricsData.visitors}</div>
                  <div className="metric-trend">
                    ▲ +11.8% <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>vs prev span</span>
                  </div>
                  <Sparkline points={[250, 310, 290, 390, 410, metricsData.visitors]} color="var(--success)" />
                </div>

                <div className="metric-card">
                  <div className="metric-label">Conversion Rate</div>
                  <div className="metric-value">{metricsData.conversion}%</div>
                  <div className="metric-trend">
                    ▲ +0.15% <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>vs prev span</span>
                  </div>
                  <Sparkline points={[2.1, 2.3, 2.2, 2.5, 2.4, metricsData.conversion]} color="var(--warning)" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1rem' }}>
                {/* Store rating */}
                <div className="daraz-card" style={{ margin: 0 }}>
                  <div className="daraz-card-title">Store Performance Rating</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Positive Rating</span>
                      <strong style={{ color: 'var(--success)' }}>98% (Excellent)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Ship on Time Rate</span>
                      <strong style={{ color: 'var(--success)' }}>99% (Excellent)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Response Rate</span>
                      <strong style={{ color: 'var(--success)' }}>97% (Excellent)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Cancellation Rate</span>
                      <strong style={{ color: 'var(--success)' }}>1.1% (Good)</strong>
                    </div>
                  </div>
                </div>

                {/* Popular items */}
                <div className="daraz-card" style={{ margin: 0 }}>
                  <div className="daraz-card-title">Top Performing Garments</div>
                  <table className="daraz-table">
                    <thead>
                      <tr>
                        <th>Product Details</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock Level</th>
                        <th>Rating Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 3).map((prod) => (
                        <tr key={prod.id}>
                          <td><strong>{prod.name}</strong></td>
                          <td>{prod.category.replace(/_/g, ' ')}</td>
                          <td>Rs. {prod.basePrice.toLocaleString()}</td>
                          <td>{prod.stockQuantity} Pcs</td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>⭐ 4.9</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE ORDERS WITH CHECKBOX BATCH ACTIONS & PRINT MODALS */}
          {activeTab === 'ORDERS' && (() => {
            const filteredOrders = orders.filter((ord) => {
              if (sectorFilter && ord.address?.sectorName !== sectorFilter) return false;
              if (customerPhoneFilter && !ord.user?.phoneNumber.includes(customerPhoneFilter)) return false;
              if (orderNumberFilter && !ord.orderNumber.includes(orderNumberFilter)) return false;

              if (ordersSearch.trim() !== '') {
                const search = ordersSearch.toLowerCase();
                const matchOrderNum = ord.orderNumber?.toLowerCase().includes(search);
                const matchName = ord.user?.name?.toLowerCase().includes(search);
                const matchPhone = ord.user?.phoneNumber?.toLowerCase().includes(search);
                const matchSector = ord.address?.sectorName?.toLowerCase().includes(search);
                const matchProduct = ord.orderItems.some((itm) => itm.product.name.toLowerCase().includes(search));

                if (!matchOrderNum && !matchName && !matchPhone && !matchSector && !matchProduct) {
                  return false;
                }
              }

              // Tabs
              if (ordersFilter === 'PENDING') {
                return ord.status === 'PENDING' || ord.paymentStatus === 'PENDING' || ['CONFIRMED', 'IN_EMBROIDERY', 'IN_TAILORING'].includes(ord.status);
              } else if (ordersFilter === 'READY_TO_SHIP') {
                return ord.status === 'READY_FOR_DELIVERY';
              } else if (ordersFilter === 'SHIPPED') {
                return ord.status === 'OUT_FOR_DELIVERY';
              } else if (ordersFilter === 'DELIVERED') {
                return ord.status === 'DELIVERED';
              } else if (ordersFilter === 'COMPLETED') {
                return ord.status === 'COMPLETED';
              } else if (ordersFilter === 'RETURNED') {
                return ord.status === 'RETURNED' || ord.status === 'RETURN_REQUESTED';
              } else if (ordersFilter === 'CANCELLED') {
                return ord.status === 'CANCELLED';
              }
              return true; // ALL
            });

            const currentFilteredIds = filteredOrders.map((o) => o.id);

            return (
              <div>
                <div className="page-title-bar">
                  <div>
                    <h1 className="page-title">
                      {ordersFilter === 'RETURNED' ? '↩ Customer Return Orders' : '📦 Manage Orders Fulfillment'}
                    </h1>
                  </div>
                </div>

                {/* Filters grid */}
                <div className="daraz-card">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem', alignItems: 'end' }}>
                    <div>
                      <label className="form-label">Search Query</label>
                      <input type="text" placeholder="🔍 Search Order#, item, name..." className="daraz-input" value={ordersSearch} onChange={(e) => setOrdersSearch(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Order Number</label>
                      <input type="text" placeholder="e.g. 1000" className="daraz-input" value={orderNumberFilter} onChange={(e) => setOrderNumberFilter(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input type="text" placeholder="e.g. 0300" className="daraz-input" value={customerPhoneFilter} onChange={(e) => setCustomerPhoneFilter(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Gwadar Sector</label>
                      <select className="daraz-input" value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
                        <option value="">All Sectors</option>
                        {uniqueSectors.map((sector) => (
                          <option key={sector} value={sector}>{sector}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <button onClick={() => { setOrdersSearch(''); setOrderNumberFilter(''); setCustomerPhoneFilter(''); setSectorFilter(''); setSelectedOrderIds([]); }} className="btn-daraz btn-daraz-secondary" style={{ width: '100%', height: '28px' }}>
                        Reset Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Horizontal navigation tabs */}
                <div className="daraz-tabs-wrapper">
                  <div className="daraz-tabs">
                    <button onClick={() => { setOrdersFilter('PENDING'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'PENDING' ? 'active' : ''}`}>
                      Pending
                      <span className="tab-badge">
                        {orders.filter((o) => o.status === 'PENDING' || o.paymentStatus === 'PENDING' || ['CONFIRMED', 'IN_EMBROIDERY', 'IN_TAILORING'].includes(o.status)).length}
                      </span>
                    </button>
                    <button onClick={() => { setOrdersFilter('READY_TO_SHIP'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'READY_TO_SHIP' ? 'active' : ''}`}>
                      Ready to Ship
                      <span className="tab-badge">
                        {orders.filter((o) => o.status === 'READY_FOR_DELIVERY').length}
                      </span>
                    </button>
                    <button onClick={() => { setOrdersFilter('SHIPPED'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'SHIPPED' ? 'active' : ''}`}>
                      Shipped
                      <span className="tab-badge">
                        {orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length}
                      </span>
                    </button>
                    <button onClick={() => { setOrdersFilter('DELIVERED'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'DELIVERED' ? 'active' : ''}`}>
                      Delivered
                      <span className="tab-badge">
                        {orders.filter((o) => o.status === 'DELIVERED').length}
                      </span>
                    </button>
                    <button onClick={() => { setOrdersFilter('COMPLETED'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'COMPLETED' ? 'active' : ''}`}>
                      Completed
                      <span className="tab-badge">
                        {orders.filter((o) => o.status === 'COMPLETED').length}
                      </span>
                    </button>
                    <button onClick={() => { setOrdersFilter('RETURNED'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'RETURNED' ? 'active' : ''}`}>
                      Returned
                      <span className="tab-badge">
                        {orders.filter((o) => o.status === 'RETURNED' || o.status === 'RETURN_REQUESTED').length}
                      </span>
                    </button>
                    <button onClick={() => { setOrdersFilter('CANCELLED'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'CANCELLED' ? 'active' : ''}`}>
                      Cancelled
                      <span className="tab-badge">
                        {orders.filter((o) => o.status === 'CANCELLED').length}
                      </span>
                    </button>
                    <button onClick={() => { setOrdersFilter('ALL'); setSelectedOrderIds([]); }} className={`daraz-tab-btn ${ordersFilter === 'ALL' ? 'active' : ''}`}>
                      All
                      <span className="tab-badge">{orders.length}</span>
                    </button>
                  </div>
                </div>

                {/* Batch operations bar */}
                {selectedOrderIds.length > 0 && (
                  <div className="batch-actions-panel">
                    <div className="batch-actions-left">
                      📋 <strong>{selectedOrderIds.length} orders selected</strong>
                    </div>
                    <div className="batch-actions-right">
                      <button onClick={() => setPrintModalData({ type: 'LABEL', orderIds: selectedOrderIds })} className="btn-daraz btn-daraz-primary" style={{ height: '26px', fontSize: '11px' }}>
                        Bulk Shipping Labels
                      </button>
                      <button onClick={() => setPrintModalData({ type: 'INVOICE', orderIds: selectedOrderIds })} className="btn-daraz btn-daraz-secondary" style={{ height: '26px', fontSize: '11px' }}>
                        Bulk Invoices
                      </button>
                      {ordersFilter === 'PENDING' && (
                        <button onClick={handleBatchReadyToShip} className="btn-daraz btn-daraz-success" style={{ height: '26px', fontSize: '11px' }}>
                          Set Ready to Ship
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Order List */}
                {filteredOrders.length === 0 ? (
                  <div className="daraz-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    📭 No orders found matching this filter criteria.
                  </div>
                ) : (
                  <div>
                    {/* Master select checkbox bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.4rem 0.75rem', backgroundColor: '#eef0f4', border: '1px solid var(--border-color)', borderBottom: 'none', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <input 
                        type="checkbox" 
                        style={{ cursor: 'pointer' }}
                        checked={selectedOrderIds.length === currentFilteredIds.length && currentFilteredIds.length > 0} 
                        onChange={() => toggleAllOrdersSelection(currentFilteredIds)}
                      />
                      <span>Select All Orders listed below</span>
                    </div>

                    {filteredOrders.map((ord) => (
                      <div key={ord.id} className="order-card">
                        {/* Header details */}
                        <div className="order-card-header">
                          <div className="order-header-info">
                            <input 
                              type="checkbox" 
                              style={{ cursor: 'pointer' }}
                              checked={selectedOrderIds.includes(ord.id)}
                              onChange={() => toggleOrderSelection(ord.id)}
                            />
                            <span>Order No: <strong className="order-number">#{ord.orderNumber}</strong></span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ord.orderNumber);
                                alert(`Order No #${ord.orderNumber} copied!`);
                              }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold' }}
                            >
                              Copy
                            </button>
                            <span>Placed Date: {new Date(ord.createdAt).toLocaleString()}</span>
                            <span style={{ backgroundColor: '#eaecef', padding: '1px 5px', borderRadius: '1px', fontSize: '10px', fontWeight: 'bold' }}>
                              💳 {ord.paymentMethod}
                            </span>
                          </div>
                          <div>
                            Sector: <strong>{ord.address?.sectorName}</strong> | {ord.address?.streetAddress}
                          </div>
                        </div>

                        {/* Body details */}
                        <div className="order-card-body">
                          {/* Column 1: Items list */}
                          <div className="order-items-col">
                            {ord.orderItems.map((itm) => (
                              <div key={itm.id} className="order-item-row">
                                <img
                                  className="order-item-img"
                                  src={getProductImageUrl(itm.product)}
                                  alt={itm.product.name}
                                />
                                <div className="order-item-details">
                                  <div className="order-item-name">{itm.product.name}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                                    Qty: {itm.quantity} | Price: Rs. {itm.priceAtPurchase.toLocaleString()}
                                  </div>
                                  <div className="order-item-meta">
                                    {itm.customSizing && <span className="meta-pill sizing">📏 Size: {itm.customSizing}</span>}
                                    {itm.customizations && (
                                      <span className="meta-pill customization">
                                        🪡 Custom: {JSON.parse(itm.customizations).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Column 2: Price details */}
                          <div className="order-price-col">
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Total Amount</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>
                              Rs. {ord.totalAmount.toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                              ({ord.orderItems.reduce((acc, cur) => acc + cur.quantity, 0)} Items)
                            </span>
                          </div>

                          {/* Column 3: Payment screenshots checks */}
                          <div className="order-status-col">
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Payment Status</span>
                            <span style={{ 
                              fontWeight: 'bold', 
                              color: ord.paymentStatus === 'PAID' ? 'var(--success)' : ord.paymentStatus === 'FAILED' ? 'var(--danger)' : 'var(--warning)'
                            }}>
                              ● {ord.paymentStatus}
                            </span>

                            {ord.paymentStatus === 'PENDING' && (
                              <div style={{ marginTop: '0.4rem', padding: '0.4rem', backgroundColor: '#f8f9fa', border: '1px solid #e2e8f0' }}>
                                {ord.paymentReceiptUrl ? (
                                  <div>
                                    <button
                                      onClick={() => setReceiptModalImage(getApiUrl(ord.paymentReceiptUrl!))}
                                      className="btn-daraz btn-daraz-secondary"
                                      style={{ padding: '2px 4px', fontSize: '9px', width: '100%', marginBottom: '3px' }}
                                    >
                                      Check Receipt
                                    </button>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                      <button onClick={() => confirmPayment(ord.id, 'PAID')} className="btn-daraz btn-daraz-primary" style={{ flexGrow: 1, padding: '2px', fontSize: '9px', backgroundColor: 'var(--success)' }}>
                                        Approve
                                      </button>
                                      <button onClick={() => confirmPayment(ord.id, 'FAILED')} className="btn-daraz btn-daraz-secondary" style={{ flexGrow: 1, padding: '2px', fontSize: '9px', color: 'var(--danger)' }}>
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>No receipt uploaded</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Column 4: Document Printing (Shipping Label / Invoices) */}
                          <div className="order-print-col">
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Print Documents</span>
                            <button
                              onClick={() => setPrintModalData({ type: 'LABEL', orderIds: [ord.id] })}
                              className="btn-daraz btn-daraz-secondary"
                              style={{ padding: '2px 4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}
                            >
                              <span>🖨️</span> Shipping Label
                            </button>
                            <button
                              onClick={() => setPrintModalData({ type: 'INVOICE', orderIds: [ord.id] })}
                              className="btn-daraz btn-daraz-secondary"
                              style={{ padding: '2px 4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}
                            >
                              <span>🖨️</span> Print Invoice
                            </button>
                          </div>

                          {/* Column 5: Pipeline Actions */}
                          <div className="order-action-col">
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Fulfillment</span>
                            <span className={`status-badge badge-${ord.status.toLowerCase().replace(/_/g, '-')}`} style={{ marginBottom: '0.4rem' }}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>

                            {!['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(ord.status) && (
                              <button
                                onClick={() => advanceOrderStatus(ord.id, ord.status)}
                                className="btn-daraz btn-daraz-primary"
                                style={{ fontWeight: 'bold', fontSize: '10px', padding: '4px 6px' }}
                              >
                                {ord.status === 'PENDING' && 'Confirm Order'}
                                {ord.status === 'CONFIRMED' && 'Embroidery'}
                                {ord.status === 'IN_EMBROIDERY' && 'Tailoring'}
                                {ord.status === 'IN_TAILORING' && 'Ready to Ship'}
                                {ord.status === 'READY_FOR_DELIVERY' && 'Dispatch'}
                                {ord.status === 'OUT_FOR_DELIVERY' && 'Deliver'}
                                {ord.status === 'DELIVERED' && 'Complete'}
                                {' ➔'}
                              </button>
                            )}

                            {ord.status === 'DELIVERED' && (
                              <button
                                onClick={() => updateStatus(ord.id, 'COMPLETED')}
                                className="btn-daraz btn-daraz-success"
                                style={{ fontSize: '10px', fontWeight: 'bold' }}
                              >
                                ✓ Complete
                              </button>
                            )}

                            {ord.status === 'RETURN_REQUESTED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <button
                                  onClick={() => updateStatus(ord.id, 'RETURNED')}
                                  className="btn-daraz btn-daraz-primary"
                                  style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: 'var(--success)' }}
                                >
                                  Confirm Return
                                </button>
                                <button
                                  onClick={() => updateStatus(ord.id, 'COMPLETED')}
                                  className="btn-daraz btn-daraz-secondary"
                                  style={{ fontSize: '10px', fontWeight: 'bold' }}
                                >
                                  Reject Return
                                </button>
                              </div>
                            )}

                            {/* Overrides */}
                            {!['COMPLETED', 'CANCELLED', 'RETURNED'].includes(ord.status) && (
                              <div style={{ marginTop: 'auto', display: 'flex', gap: '2px', borderTop: '1px solid #f1f2f6', paddingTop: '0.4rem' }}>
                                {ord.status !== 'DELIVERED' && ord.status !== 'RETURN_REQUESTED' && (
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Mark Order #${ord.orderNumber} as completed?`)) {
                                        await updateStatus(ord.id, 'COMPLETED');
                                      }
                                    }}
                                    className="btn-daraz btn-daraz-secondary"
                                    style={{ flexGrow: 1, padding: '2px', fontSize: '9px', color: 'var(--success)' }}
                                  >
                                    Complete
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Cancel Order #${ord.orderNumber}?`)) {
                                      await updateStatus(ord.id, 'CANCELLED');
                                    }
                                  }}
                                  className="btn-daraz btn-daraz-danger"
                                  style={{ flexGrow: 1, padding: '2px', fontSize: '9px' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: DRESS RENTAL TRACKER */}
          {activeTab === 'RENTALS' && (
            <div>
              <div className="page-title-bar">
                <div>
                  <h1 className="page-title">Rent Return Tracker</h1>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Manage local Gwadar rental outfits and process security deposits.
                  </p>
                </div>
              </div>

              {activeRentalReturn && (
                <div className="daraz-card" style={{ border: '1px solid var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                    ↩ Process Rental Return (ID: #{activeRentalReturn.id.slice(0, 8)})
                  </h3>
                  <form onSubmit={handleReturnSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Garment Condition</label>
                        <select className="daraz-input" value={returnStatus} onChange={(e) => setReturnStatus(e.target.value)}>
                          <option value="RETURNED_GOOD">Good Condition (Refund Full Security Deposit)</option>
                          <option value="RETURNED_DAMAGED">Damaged / Stained (Apply Clean & Repair Fees)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Overdue Delay Fee (Rs.)</label>
                        <input type="number" className="daraz-input" value={lateFee} onChange={(e) => setLateFee(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Damage Cleaning Fee (Rs.)</label>
                        <input type="number" className="daraz-input" value={damageFee} onChange={(e) => setDamageFee(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Condition Notes / Audit details</label>
                        <input type="text" className="daraz-input" placeholder="Assess staining, custom bead damages..." value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button type="submit" className="btn-daraz btn-daraz-primary">
                        Log Return & Release Deposit
                      </button>
                      <button type="button" onClick={() => setActiveRentalReturn(null)} className="btn-daraz btn-daraz-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="daraz-table-container">
                <table className="daraz-table">
                  <thead>
                    <tr>
                      <th>Rental ID</th>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Renter Contact</th>
                      <th>Rent Start</th>
                      <th>Due Return Date</th>
                      <th>Rental Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map((rent) => (
                      <tr key={rent.id}>
                        <td><strong>#{rent.id.slice(0, 8)}</strong></td>
                        <td>#{rent.order?.orderNumber || 'N/A'}</td>
                        <td><strong>{rent.order?.user?.name || 'Walkin Customer'}</strong></td>
                        <td>{rent.order?.user?.phoneNumber}</td>
                        <td>{new Date(rent.startDate).toLocaleDateString()}</td>
                        <td>
                          <strong style={{ color: 'var(--warning)' }}>
                            {new Date(rent.endDate).toLocaleDateString()}
                          </strong>
                        </td>
                        <td>
                          <span className="status-badge" style={{
                            backgroundColor: rent.status === 'RENTED_OUT' ? 'rgba(245,158,11,0.1)' : rent.status === 'RETURNED_GOOD' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            color: rent.status === 'RENTED_OUT' ? '#d97706' : rent.status === 'RETURNED_GOOD' ? '#16a34a' : '#ef4444'
                          }}>
                            {rent.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          {rent.status === 'AWAITING_DISPATCH' && (
                            <button onClick={() => dispatchRental(rent.id)} className="btn-daraz btn-daraz-primary" style={{ fontSize: '10px', padding: '3px 6px' }}>
                              Dispatch Outfit ➔
                            </button>
                          )}
                          {(rent.status === 'RENTED_OUT' || rent.status === 'RETURN_REQUESTED') && (
                            <button onClick={() => { setActiveRentalReturn(rent); setReturnNotes(rent.notes || ''); }} className="btn-daraz btn-daraz-success" style={{ fontSize: '10px', padding: '3px 6px' }}>
                              Process Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS INVENTORY WITH TABS & SEARCH */}
          {activeTab === 'INVENTORY' && (() => {
            const filteredProducts = products.filter((p) => {
              // Text search
              if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase()) && !p.category.toLowerCase().includes(productSearch.toLowerCase())) {
                return false;
              }
              // Tab segments
              if (productTabFilter === 'ONLINE') {
                return onlineProducts[p.id] === true && p.stockQuantity > 0;
              } else if (productTabFilter === 'OUT_OF_STOCK') {
                return p.stockQuantity === 0;
              } else if (productTabFilter === 'OFFLINE') {
                return onlineProducts[p.id] === false || p.stockQuantity === 0;
              }
              return true; // ALL
            });

            return (
              <div>
                <div className="page-title-bar">
                  <div>
                    <h1 className="page-title">Manage Products & Catalog</h1>
                  </div>
                </div>

                {/* Filters */}
                <div className="daraz-card" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f5f6f9', padding: '4px 10px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🔍</span>
                      <input 
                        type="text" 
                        placeholder="Search product name or category..." 
                        style={{ border: 'none', background: 'none', outline: 'none', fontSize: '11px', width: '100%' }}
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Horizontal Product tabs */}
                <div className="daraz-tabs-wrapper">
                  <div className="daraz-tabs">
                    <button onClick={() => setProductTabFilter('ALL')} className={`daraz-tab-btn ${productTabFilter === 'ALL' ? 'active' : ''}`}>
                      All
                      <span className="tab-badge">{products.length}</span>
                    </button>
                    <button onClick={() => setProductTabFilter('ONLINE')} className={`daraz-tab-btn ${productTabFilter === 'ONLINE' ? 'active' : ''}`}>
                      Online
                      <span className="tab-badge">{products.filter((p) => onlineProducts[p.id] === true && p.stockQuantity > 0).length}</span>
                    </button>
                    <button onClick={() => setProductTabFilter('OUT_OF_STOCK')} className={`daraz-tab-btn ${productTabFilter === 'OUT_OF_STOCK' ? 'active' : ''}`}>
                      Out of Stock
                      <span className="tab-badge">{products.filter((p) => p.stockQuantity === 0).length}</span>
                    </button>
                    <button onClick={() => setProductTabFilter('OFFLINE')} className={`daraz-tab-btn ${productTabFilter === 'OFFLINE' ? 'active' : ''}`}>
                      Offline
                      <span className="tab-badge">{products.filter((p) => onlineProducts[p.id] === false || p.stockQuantity === 0).length}</span>
                    </button>
                  </div>
                </div>

                {/* Add product */}
                <div className="daraz-card">
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
                    🆕 Add New Balochi Doch Garment Item
                  </h3>
                  <form onSubmit={handleProductSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Garment Name</label>
                        <input type="text" required className="daraz-input" placeholder="e.g. Gwadar Royal Pashk Doch" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="daraz-input" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}>
                          <option value="COMPLETE_SET">Complete Set</option>
                          <option value="SAREEG">Sareeg (Dupatta)</option>
                          <option value="CHADDAR">Chaddar Tikk</option>
                          <option value="PASHKO_SHALWAR">Pashko & Shalwar</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Purchase Price (Rs.)</label>
                        <input type="number" required className="daraz-input" placeholder="e.g. 15000" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Initial Stock</label>
                        <input type="number" required className="daraz-input" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} />
                      </div>

                      <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1.5rem', alignItems: 'center', margin: '0.25rem 0' }}>
                        <div className="switch-container" onClick={() => setIsNewRentable(!isNewRentable)}>
                          <div className={`switch-container ${isNewRentable ? 'on' : ''}`}>
                            <div className="switch-track">
                              <div className="switch-thumb"></div>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Allow renting</span>
                        </div>

                        <div className="switch-container" onClick={() => setAllowsEmbroidery(!allowsEmbroidery)}>
                          <div className={`switch-container ${allowsEmbroidery ? 'on' : ''}`}>
                            <div className="switch-track">
                              <div className="switch-thumb"></div>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Allows customizations</span>
                        </div>
                      </div>

                      {isNewRentable && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Rent Price Per Day (Rs.)</label>
                            <input type="number" className="daraz-input" placeholder="e.g. 1000" value={newRentPrice} onChange={(e) => setNewRentPrice(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Security Deposit (Rs.)</label>
                            <input type="number" className="daraz-input" placeholder="e.g. 3000" value={newDeposit} onChange={(e) => setNewDeposit(e.target.value)} />
                          </div>
                        </>
                      )}

                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Description</label>
                        <textarea className="daraz-input" rows={2} placeholder="Embroidery styles, details..." value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="btn-daraz btn-daraz-primary" style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                      Save Garment
                    </button>
                  </form>
                </div>

                {/* Catalog Table */}
                <div className="daraz-table-container">
                  <div className="inventory-grid header">
                    <div>Image</div>
                    <div>Garment Details</div>
                    <div>Category</div>
                    <div>Base Price</div>
                    <div>Rentable?</div>
                    <div>Stock Level</div>
                    <div style={{ textAlign: 'center' }}>Online Status</div>
                  </div>

                  {filteredProducts.map((prod) => (
                    <div key={prod.id} className="inventory-grid">
                      <div>
                        <img
                          src={getProductImageUrl(prod)}
                          alt={prod.name}
                          style={{ width: '36px', height: '36px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{prod.name}</strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: #{prod.id.slice(0, 8)}</span>
                      </div>
                      <div>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '1px', fontSize: '10px' }}>
                          {prod.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        <strong>Rs. {prod.basePrice.toLocaleString()}</strong>
                        {prod.isRentable && prod.rentPerDay && (
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                            Rent: Rs. {prod.rentPerDay}/day
                          </div>
                        )}
                      </div>
                      <div>
                        <span style={{ color: prod.isRentable ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {prod.isRentable ? 'Rent / Sale' : 'Sale Only'}
                        </span>
                      </div>
                      
                      {/* Inline Stock Editing */}
                      <div>
                        {editingStockId === prod.id ? (
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            <input
                              type="number"
                              className="daraz-input"
                              style={{ width: '50px', padding: '2px', height: '20px' }}
                              value={editingStockVal}
                              onChange={(e) => setEditingStockVal(e.target.value)}
                            />
                            <button
                              onClick={() => handleUpdateStock(prod.id, parseInt(editingStockVal))}
                              style={{ border: 'none', background: '#22c55e', color: 'white', padding: '2px 4px', cursor: 'pointer', fontSize: '9px' }}
                            >
                              💾
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              style={{ border: 'none', background: '#9e9e9e', color: 'white', padding: '2px 4px', cursor: 'pointer', fontSize: '9px' }}
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <strong style={{ color: prod.stockQuantity === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                              {prod.stockQuantity} Pcs
                            </strong>
                            <button
                              onClick={() => { setEditingStockId(prod.id); setEditingStockVal(prod.stockQuantity.toString()); }}
                              style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '10px' }}
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Online Toggle */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className={`switch-container ${onlineProducts[prod.id] ? 'on' : ''}`} onClick={() => toggleProductOnline(prod.id)}>
                          <div className="switch-track">
                            <div className="switch-thumb"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        </main>
      </div>

      {/* FLOATING IMAGE RECEIPT VIEWER */}
      {receiptModalImage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setReceiptModalImage(null)}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '2px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>📷 Receipt Verification</h4>
              <button onClick={() => setReceiptModalImage(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <img src={receiptModalImage} alt="Payment Receipt" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', border: '1px solid #ddd' }} />
          </div>
        </div>
      )}

      {/* FLOATING DOCUMENT PRINT MODAL */}
      {printModalData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem'
        }} onClick={() => setPrintModalData(null)}>
          <div style={{
            backgroundColor: '#f4f5f8',
            padding: '1.5rem',
            borderRadius: '3px',
            maxWidth: '550px',
            width: '100%',
            position: 'relative',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', backgroundColor: '#ffffff', margin: '-1.5rem -1.5rem 1rem -1.5rem', padding: '1rem 1.5rem', position: 'sticky', top: '-1.5rem', zIndex: 10 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '13px' }}>🖨️ Balochi Bazzar document print layout</h3>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => window.print()} className="btn-daraz btn-daraz-primary">Print Document</button>
                <button onClick={() => setPrintModalData(null)} className="btn-daraz btn-daraz-secondary">Close Preview</button>
              </div>
            </div>

            {/* Print Sheets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {printModalData.orderIds.map((id, index) => {
                const ord = orders.find((o) => o.id === id);
                if (!ord) return null;
                return printModalData.type === 'LABEL' ? (
                  /* 100% Identical Shipping Label */
                  <div key={ord.id} className="print-layout" style={{ border: '2px dashed #000', padding: '1rem', backgroundColor: '#fff', fontSize: '10px', color: '#000', marginBottom: index < printModalData.orderIds.length - 1 ? '1rem' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '4px', fontWeight: 'bold' }}>
                      <span style={{ fontSize: '12px' }}>BALOCHI BAZZAR STANDARD SHIPPING</span>
                      <span>PORT: GWADAR</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderBottom: '1px solid #000', padding: '6px 0' }}>
                      <div>
                        <strong>SHIP TO (Customer):</strong>
                        <div style={{ fontSize: '11px', marginTop: '2px' }}>
                          {ord.user?.name}<br />
                          {ord.address?.streetAddress}, {ord.address?.sectorName}<br />
                          Gwadar, Pakistan<br />
                          Tel: {ord.user?.phoneNumber}
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid #000', paddingLeft: '8px' }}>
                        <strong>RETURN ADDRESS:</strong>
                        <div style={{ fontSize: '9px', marginTop: '2px' }}>
                          Atelier Gwadar Hub<br />
                          West Bay Sector, Gwadar<br />
                          Tel: 03001234567
                        </div>
                      </div>
                    </div>

                    <div className="print-barcode-sim"></div>
                    <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px' }}>
                      *PK-GW-{ord.orderNumber}*
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderTop: '1px solid #000', marginTop: '6px', paddingTop: '6px' }}>
                      <div>
                        <strong>Order Number: #{ord.orderNumber}</strong><br />
                        Date Placed: {new Date(ord.createdAt).toLocaleDateString()}<br />
                        Payment Type: <strong>{ord.paymentMethod}</strong>
                      </div>
                      <div style={{ borderLeft: '1px solid #000', paddingLeft: '8px', textAlign: 'right' }}>
                        Weight: 0.5 kg<br />
                        COD Price:<br />
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Rs. {ord.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 100% Identical Shopping Invoice */
                  <div key={ord.id} className="print-layout" style={{ border: '1px solid #ddd', padding: '1.25rem', backgroundColor: '#fff', fontSize: '10px', color: '#333', marginBottom: index < printModalData.orderIds.length - 1 ? '1rem' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>BALOCHI BAZZAR SELLER HUB</div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Atelier Gwadar Store (PK_GW_001)</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>INVOICE</div>
                        <span>Inv No: INV-{10000 + index}-{ord.orderNumber}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
                      <div>
                        <strong>Billed To:</strong>
                        <div>{ord.user?.name}</div>
                        <div>{ord.address?.streetAddress}, {ord.address?.sectorName}</div>
                        <div>Gwadar, PK</div>
                        <div>Phone: {ord.user?.phoneNumber}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong>Invoice Details:</strong>
                        <div>Order Date: {new Date(ord.createdAt).toLocaleDateString()}</div>
                        <div>Fulfillment Hub: Gwadar Central</div>
                        <div>Carrier Method: Gwadar Standard Courier</div>
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f6f7fa', borderBottom: '1px solid #ddd' }}>
                          <th style={{ padding: '4px', textAlign: 'left' }}>Item Details</th>
                          <th style={{ padding: '4px', textAlign: 'center' }}>Sizing / Custom</th>
                          <th style={{ padding: '4px', textAlign: 'right' }}>Price</th>
                          <th style={{ padding: '4px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '4px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ord.orderItems.map((itm) => (
                          <tr key={itm.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '4px' }}>
                              <strong>{itm.product.name}</strong><br />
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Cat: {itm.product.category}</span>
                            </td>
                            <td style={{ padding: '4px', textAlign: 'center' }}>
                              {itm.customSizing || 'Standard'}<br />
                              {itm.customizations ? <span style={{ fontSize: '8px', color: 'var(--primary)' }}>Customized</span> : ''}
                            </td>
                            <td style={{ padding: '4px', textAlign: 'right' }}>Rs. {itm.priceAtPurchase.toLocaleString()}</td>
                            <td style={{ padding: '4px', textAlign: 'center' }}>{itm.quantity}</td>
                            <td style={{ padding: '4px', textAlign: 'right' }}>Rs. {(itm.priceAtPurchase * itm.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '180px', fontSize: '11px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>Subtotal:</span>
                          <span>Rs. {ord.totalAmount.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>Shipping:</span>
                          <span>Rs. 0</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #000', fontWeight: 'bold' }}>
                          <span>Grand Total:</span>
                          <span>Rs. {ord.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #eee', paddingTop: '8px', textAlign: 'center', fontSize: '8px', color: 'var(--text-muted)' }}>
                      Thank you for shopping at Balochi Bazzar. For customization support, contact Atelier Gwadar.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
