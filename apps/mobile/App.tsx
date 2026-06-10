import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  Alert,
  SafeAreaView,
  Dimensions,
  Modal
} from 'react-native';

const { width } = Dimensions.get('window');

// Interfaces
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
  images: { id: string; url: string }[];
  customizationOptions: { id: string; sectionName: string; optionName: string; priceMarkup: number }[];
}

const categories = [
  { label: 'All', id: 'All' },
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

export default function App() {
  // Navigation State: 'CATALOG' | 'CUSTOMIZER' | 'ORDERS'
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CUSTOMIZER' | 'ORDERS'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Developer setting: Backend LAN IP (Change to local Wi-Fi IP for real phones)
  const [backendIp, setBackendIp] = useState('10.0.2.2'); 
  
  // Use EXPO_PUBLIC_API_URL if defined (for production builds on Play Store), otherwise use the local IP sync bar.
  const apiBase = process.env.EXPO_PUBLIC_API_URL || `http://${backendIp}:5000/api`;

  // Core lists
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Customization selection state
  const [isRental, setIsRental] = useState(false);
  const [rentalDays, setRentalDays] = useState(3);
  const [selectedEmbroidery, setSelectedEmbroidery] = useState<string[]>([]);
  const [sizeType, setSizeType] = useState<'STANDARD' | 'CUSTOM'>('STANDARD');
  const [standardSize, setStandardSize] = useState('M');
  const [height, setHeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [sleeves, setSleeves] = useState('');

  // Checkout info
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [sector, setSector] = useState('Mulla Band');
  const [address, setAddress] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  // Orders list & Authentication
  const [orders, setOrders] = useState<any[]>([]);
  const [orderPhone, setOrderPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');

  // Dynamic Ticking Flash Sale Timer
  const [secondsLeft, setSecondsLeft] = useState(6523);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 6523));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return { h: pad(h), m: pad(m), s: pad(s) };
  };
  const timerDigits = formatTime(secondsLeft);

  // Home slideshow carousel banner index
  const [sliderIndex, setSliderIndex] = useState(0);
  useEffect(() => {
    if (activeTab !== 'CATALOG') return;
    const sliderInterval = setInterval(() => {
      setSliderIndex((prev) => (prev === 2 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(sliderInterval);
  }, [activeTab]);

  useEffect(() => {
    loadProducts();
  }, [backendIp]);

  const loadProducts = () => {
    fetch(`${apiBase}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        if (data.length > 0 && !selectedProduct) {
          loadProductDetails(data[0].id);
        }
      })
      .catch((err) => {
        console.log('Error loading products. Ensure API is running and IP is correct.', err);
      });
  };

  const loadProductDetails = (id: string) => {
    fetch(`${apiBase}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedProduct(data);
        setSelectedEmbroidery([]);
        setIsRental(false);
      })
      .catch(console.error);
  };

  // Pricing calculation
  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    let base = 0;
    if (isRental) {
      const baseRent = selectedProduct.rentPerDay || (selectedProduct.basePrice * 0.1);
      const deposit = selectedProduct.depositFee || (selectedProduct.basePrice * 0.3);
      base = (baseRent * rentalDays) + deposit;
    } else {
      let price = selectedProduct.basePrice;
      selectedEmbroidery.forEach((optName) => {
        const option = selectedProduct.customizationOptions.find((o) => o.optionName === optName);
        if (option) {
          price += option.priceMarkup;
        }
      });
      base = price;
    }
    return Math.max(0, base - voucherDiscount);
  };

  const handleCustomizationToggle = (name: string) => {
    setSelectedEmbroidery((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // Apply Coupon Code
  const applyVoucher = () => {
    if (voucherCode.trim().toUpperCase() === 'BAZAR10') {
      setVoucherDiscount(1000);
      Alert.alert('Voucher Applied!', 'Rs. 1,000 has been deducted from your order subtotal.');
    } else {
      Alert.alert('Invalid Voucher', 'Try coupon code BAZAR10 for a discount.');
    }
  };

  // Submit order via mobile
  const handleCheckout = async () => {
    if (!selectedProduct || !userName || !userPhone || !address) {
      Alert.alert('Checkout Error', 'Please complete all customer and delivery address fields.');
      return;
    }

    try {
      // 1. Auto-login or register customer
      const authRes = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: userPhone,
          password: 'localpassword123',
          name: userName,
          sectorName: sector,
          streetAddress: address,
        }),
      });
      let authData = await authRes.json();
      let tokenStr = authData.token;

      if (!authRes.ok) {
        // Log in if already registered
        const loginRes = await fetch(`${apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: userPhone, password: 'localpassword123' }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error);
        tokenStr = loginData.token;
      }

      // 2. Add address
      const addrRes = await fetch(`${apiBase}/auth/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStr}`,
        },
        body: JSON.stringify({ sectorName: sector, streetAddress: address, isDefault: true }),
      });
      const addrData = await addrRes.json();

      // 3. Place order
      const orderPayload = {
        addressId: addrData.id,
        paymentMethod: 'COD',
        items: [
          {
            productId: selectedProduct.id,
            quantity: 1,
            customizations: selectedEmbroidery,
            customSizing: sizeType === 'CUSTOM' ? { height, chest, waist, sleeves } : { standardSize },
            isRental,
            rentalDays: isRental ? rentalDays : null,
          },
        ],
      };

      const orderRes = await fetch(`${apiBase}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStr}`,
        },
        body: JSON.stringify(orderPayload),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error);

      Alert.alert('Success!', `Your order ${orderData.orderNumber} has been received. Delivering to sector ${sector}.`);
      setCheckoutVisible(false);
      setVoucherCode('');
      setVoucherDiscount(0);

      // Navigate to orders
      setOrderPhone(userPhone);
      setIsLoggedIn(true);
      setAuthToken(tokenStr);
      fetchOrders(tokenStr);
      setActiveTab('ORDERS');
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'Error executing order.');
    }
  };

  // Load orders for phone number
  const handleOrderLookup = async () => {
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: orderPhone, password: 'localpassword123' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsLoggedIn(true);
      setAuthToken(data.token);
      fetchOrders(data.token);
    } catch (err: any) {
      Alert.alert('Lookup Failed', 'Ensure you have placed an order with this phone number.');
    }
  };

  const fetchOrders = (tokenStr: string) => {
    fetch(`${apiBase}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${tokenStr}` },
    })
      .then((res) => res.json())
      .then(setOrders)
      .catch(console.error);
  };

  const updateOrderStatusClient = async (orderId: string, action: 'receive' | 'return') => {
    try {
      const res = await fetch(`${apiBase}/orders/${orderId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert('Status Updated', `Order successfully updated to ${data.status}`);
      fetchOrders(authToken);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
    }
  };

  // Map order statuses to progress tracking timeline
  const getOrderProgressStep = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0; // Placed
      case 'CONFIRMED':
        return 1; // Approved
      case 'IN_EMBROIDERY':
        return 2; // Embroidery
      case 'IN_TAILORING':
        return 3; // Stitching
      case 'READY_FOR_DELIVERY':
      case 'OUT_FOR_DELIVERY':
        return 4; // Shipped
      case 'DELIVERED':
      case 'COMPLETED':
        return 5; // Delivered / Completed
      default:
        return 0;
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  };

  // Calculate order counts for Account status boxes
  const getStatusCount = (targetStates: string[]) => {
    return orders.filter((o) => targetStates.includes(o.status)).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Top IP Sync Bar (Only show in development/local testing mode) */}
      {!process.env.EXPO_PUBLIC_API_URL && (
        <View style={styles.ipBar}>
          <Text style={styles.ipLabel}>IP Address:</Text>
          <TextInput
            style={styles.ipInput}
            value={backendIp}
            onChangeText={setBackendIp}
            placeholder="e.g. 10.163.66.124"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.ipBtn} onPress={loadProducts}>
            <Text style={styles.ipBtnText}>Connect API</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* TAB 1: DARAZ-STYLE HOME CATALOG */}
        {activeTab === 'CATALOG' && (
          <View>
            {/* Orange Search Header */}
            <View style={styles.darazSearchHeader}>
              <View style={styles.locationContainer}>
                <Text style={styles.locationText}>📍 Deliver to Pakistan (Gwadar Sector)</Text>
              </View>
              <View style={styles.searchBarRow}>
                <View style={styles.searchBarBox}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput 
                    style={styles.searchBarInput} 
                    placeholder="Search in Balochi Bazar..." 
                    placeholderTextColor="#9e9e9e" 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Text style={{ marginRight: 6, color: '#9e9e9e', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => Alert.alert('Chat', 'Connecting to Balochi Bazar Atelier Gwadar support...')}>
                  <Text style={styles.headerIcon}>💬</Text>
                  <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>3</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => Alert.alert('Cart', 'Your Balochi Bazar cart is empty.')}>
                  <Text style={styles.headerIcon}>🛒</Text>
                  <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>0</Text></View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rotating Hero Campaign Slider */}
            <View style={styles.sliderContainer}>
              <Image 
                source={{ 
                  uri: sliderIndex === 0 
                    ? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'
                    : sliderIndex === 1
                    ? 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'
                    : 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=600&q=80'
                }} 
                style={styles.sliderImg} 
              />
              <View style={styles.sliderPills}>
                <View style={[styles.sliderPill, sliderIndex === 0 && styles.sliderPillActive]} />
                <View style={[styles.sliderPill, sliderIndex === 1 && styles.sliderPillActive]} />
                <View style={[styles.sliderPill, sliderIndex === 2 && styles.sliderPillActive]} />
              </View>
            </View>

            {/* Quick Channels Grid */}
            <View style={styles.channelsContainer}>
              <TouchableOpacity style={styles.channelItem} onPress={() => Alert.alert('BazarMall', 'Official flagship store for Balochi Bazar Gwadar premium embroidery doch sets.')}>
                <View style={styles.channelCircle}><Text style={styles.channelEmoji}>👑</Text></View>
                <Text style={styles.channelLabel}>BazarMall</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.channelItem} onPress={() => { if (products.length > 0) { const rent = products.find(p=>p.isRentable); if (rent) loadProductDetails(rent.id); } setActiveTab('CUSTOMIZER'); setIsRental(true); }}>
                <View style={styles.channelCircle}><Text style={styles.channelEmoji}>👗</Text></View>
                <Text style={styles.channelLabel}>Rentals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.channelItem} onPress={() => setActiveTab('CUSTOMIZER')}>
                <View style={styles.channelCircle}><Text style={styles.channelEmoji}>✂</Text></View>
                <Text style={styles.channelLabel}>Stitching</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.channelItem} onPress={() => Alert.alert('Flash Sale', 'Scroll down to shop local Gwadar Flash Deals!')}>
                <View style={styles.channelCircle}><Text style={styles.channelEmoji}>⚡</Text></View>
                <Text style={styles.channelLabel}>Flash Sale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.channelItem} onPress={() => Alert.alert('Free Shipping', 'Enjoy Rs. 0 delivery charge across all Gwadar sectors this week!')}>
                <View style={styles.channelCircle}><Text style={styles.channelEmoji}>🚚</Text></View>
                <Text style={styles.channelLabel}>Free Shipping</Text>
              </TouchableOpacity>
            </View>

            {/* Ticking Flash Sale Widget */}
            <View style={styles.flashSection}>
              <View style={styles.flashHeader}>
                <View style={styles.flashTitleRow}>
                  <Text style={styles.flashTitle}>⚡ FLASH SALE</Text>
                  <View style={styles.timerRow}>
                    <View style={styles.timeDigit}><Text style={styles.timeDigitText}>{timerDigits.h}</Text></View>
                    <Text style={styles.timeColon}>:</Text>
                    <View style={styles.timeDigit}><Text style={styles.timeDigitText}>{timerDigits.m}</Text></View>
                    <Text style={styles.timeColon}>:</Text>
                    <View style={styles.timeDigit}><Text style={styles.timeDigitText}>{timerDigits.s}</Text></View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Flash Sale', 'Exclusive Gwadar traditional Balochi doch items on discount.')}>
                  <Text style={styles.shopMoreText}>SHOP MORE ></Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flashScroll}>
                {products.map((prod) => (
                  <TouchableOpacity 
                    key={`flash-${prod.id}`} 
                    style={styles.flashCard}
                    onPress={() => {
                      loadProductDetails(prod.id);
                      setActiveTab('CUSTOMIZER');
                    }}
                  >
                    <Image source={{ uri: prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80' }} style={styles.flashCardImg} />
                    <Text style={styles.flashCardPrice}>Rs. {Math.round(prod.basePrice * 0.85).toLocaleString()}</Text>
                    <Text style={styles.flashCardOldPrice}>Rs. {prod.basePrice.toLocaleString()}</Text>
                    <View style={styles.flashProgressContainer}>
                      <View style={[styles.flashProgressBar, { width: '70%' }]} />
                      <Text style={styles.flashProgressText}>70% Sold</Text>
                    </View>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>-15%</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Just For You Grid Feed */}
            <View style={styles.gridSection}>
              <Text style={styles.gridSectionTitle}>RECOMMENDED FOR YOU</Text>
              
              {/* Category Filter Chips Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setActiveCategory(cat.id)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {products.length === 0 ? (
                <Text style={styles.loadingText}>No local designs found. Check connection to http://{backendIp}:5000</Text>
              ) : getFilteredProducts().length === 0 ? (
                <Text style={styles.loadingText}>No designs match the search or category filters.</Text>
              ) : (
                <View style={styles.gridContainer}>
                  {getFilteredProducts().map((prod) => (
                    <TouchableOpacity 
                      key={`grid-${prod.id}`} 
                      style={styles.gridCard}
                      onPress={() => {
                        loadProductDetails(prod.id);
                        setActiveTab('CUSTOMIZER');
                      }}
                    >
                      <Image source={{ uri: prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80' }} style={styles.gridImg} />
                      <View style={styles.gridInfo}>
                        <Text style={styles.gridCategory}>{prod.category.replace(/_/g, ' ')}</Text>
                        <Text style={styles.gridName} numberOfLines={2}>{prod.name}</Text>
                        
                        {/* Micro-Badges Row */}
                        <View style={styles.microBadgesRow}>
                          <View style={styles.microBadgeCoins}><Text style={styles.microBadgeText}>🪙 50 Coins</Text></View>
                          <View style={styles.microBadgeFreeShip}><Text style={styles.microBadgeText}>Free Shipping</Text></View>
                        </View>

                        <Text style={styles.gridPrice}>Rs. {prod.basePrice.toLocaleString()}</Text>
                        
                        <View style={styles.gridReviewRow}>
                          <Text style={styles.gridStar}>⭐ 4.9 (48)</Text>
                          <Text style={styles.gridLocation}>Gwadar</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

          </View>
        )}

        {/* TAB 2: DARAZ-STYLE DETAIL PAGE & CUSTOMIZER */}
        {activeTab === 'CUSTOMIZER' && selectedProduct && (
          <View>
            {/* Swipable Item Photo preview */}
            <Image 
              source={{ uri: selectedProduct.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' }} 
              style={styles.detailProductImg} 
            />

            <View style={styles.detailInfoBlock}>
              {/* Price Tag */}
              <View style={styles.detailPriceRow}>
                <Text style={styles.detailPriceText}>Rs. {selectedProduct.basePrice.toLocaleString()}</Text>
                {selectedProduct.isRentable && (
                  <View style={styles.rentalPill}>
                    <Text style={styles.rentalPillText}>Rent: Rs. {selectedProduct.rentPerDay?.toLocaleString()}/day</Text>
                  </View>
                )}
              </View>
              <Text style={styles.detailProductName}>{selectedProduct.name}</Text>
              <Text style={styles.detailProductDesc}>{selectedProduct.description}</Text>
            </View>

            {/* Standard Daraz Delivery Trust Card */}
            <View style={styles.trustCard}>
              <Text style={styles.trustItem}>🚚 Standard Delivery | Sector Fares Apply</Text>
              <Text style={styles.trustItem}>💵 Cash on Delivery Available</Text>
              <Text style={styles.trustItem}>🛡️ 7 Days Returns & Refund policies</Text>
            </View>

            {/* Configurator settings */}
            <View style={styles.configCard}>
              {/* Buy vs Rent Toggle Switch */}
              {selectedProduct.isRentable && (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Rent this outfit per day</Text>
                  <Switch 
                    value={isRental} 
                    onValueChange={(val) => {
                      setIsRental(val);
                      setSelectedEmbroidery([]);
                    }} 
                    trackColor={{ true: 'var(--primary)', false: '#ccc' }}
                  />
                </View>
              )}

              {isRental ? (
                <View style={styles.configSection}>
                  <Text style={styles.configSectionTitle}>Rental Duration (Days)</Text>
                  <View style={styles.rentalDurationRow}>
                    {[3, 5, 7].map((day) => (
                      <TouchableOpacity 
                        key={day} 
                        style={[styles.durationBubble, rentalDays === day && styles.durationBubbleActive]}
                        onPress={() => setRentalDays(day)}
                      >
                        <Text style={[styles.durationBubbleText, rentalDays === day && styles.durationBubbleTextActive]}>
                          {day} Days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.configInfoText}>
                    *Deposit Fee: Rs. {selectedProduct.depositFee || Math.round(selectedProduct.basePrice * 0.3)} (Refundable in cash upon return)
                  </Text>
                </View>
              ) : (
                <>
                  {/* Select embroidery stitches as tags bubbles */}
                  {selectedProduct.allowsCustomEmbroidery && selectedProduct.customizationOptions?.length > 0 && (
                    <View style={styles.configSection}>
                      <Text style={styles.configSectionTitle}>Select Custom Embroidery Stitches</Text>
                      <View style={styles.variationPillRow}>
                        {selectedProduct.customizationOptions.map((opt) => {
                          const isSelected = selectedEmbroidery.includes(opt.optionName);
                          return (
                            <TouchableOpacity 
                              key={opt.id} 
                              style={[styles.variationPill, isSelected && styles.variationPillActive]}
                              onPress={() => handleCustomizationToggle(opt.optionName)}
                            >
                              <Text style={[styles.variationPillText, isSelected && styles.variationPillTextActive]}>
                                {opt.optionName} (+Rs. {opt.priceMarkup})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Sizing selection */}
                  <View style={styles.configSection}>
                    <Text style={styles.configSectionTitle}>Tailoring Sizing Type</Text>
                    <View style={styles.tabRow}>
                      <TouchableOpacity onPress={() => setSizeType('STANDARD')} style={[styles.tabBtn, sizeType === 'STANDARD' && styles.tabBtnActive]}>
                        <Text style={[styles.tabBtnText, sizeType === 'STANDARD' && styles.tabBtnTextActive]}>Standard Size</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSizeType('CUSTOM')} style={[styles.tabBtn, sizeType === 'CUSTOM' && styles.tabBtnActive]}>
                        <Text style={[styles.tabBtnText, sizeType === 'CUSTOM' && styles.tabBtnTextActive]}>Custom Sizing</Text>
                      </TouchableOpacity>
                    </View>

                    {sizeType === 'STANDARD' ? (
                      <View style={styles.sizeOptions}>
                        {['S', 'M', 'L', 'XL'].map((s) => (
                          <TouchableOpacity key={s} onPress={() => setStandardSize(s)} style={[styles.sizeBubble, standardSize === s && styles.sizeBubbleActive]}>
                            <Text style={[styles.sizeBubbleText, standardSize === s && styles.sizeBubbleTextActive]}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.customSizeInputs}>
                        <TextInput style={styles.detailInput} placeholder="Height (cm)" placeholderTextColor="#999" keyboardType="numeric" value={height} onChangeText={setHeight} />
                        <TextInput style={styles.detailInput} placeholder="Chest (inches)" placeholderTextColor="#999" keyboardType="numeric" value={chest} onChangeText={setChest} />
                        <TextInput style={styles.detailInput} placeholder="Waist (inches)" placeholderTextColor="#999" keyboardType="numeric" value={waist} onChangeText={setWaist} />
                        <TextInput style={styles.detailInput} placeholder="Sleeves (inches)" placeholderTextColor="#999" keyboardType="numeric" value={sleeves} onChangeText={setSleeves} />
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>

            {/* High-Fidelity Customer Feedback section */}
            <View style={styles.feedbackSectionCard}>
              <View style={styles.feedbackSectionHeader}>
                <Text style={styles.feedbackSectionTitle}>Ratings & Reviews</Text>
                <Text style={styles.feedbackAggregateText}>⭐ 4.9/5 (24 Ratings)</Text>
              </View>
              
              <View style={styles.reviewsList}>
                <View style={styles.reviewCommentRow}>
                  <View style={styles.reviewCommentUser}>
                    <Text style={styles.reviewUserName}>Ayesha K. (Verified Buyer)</Text>
                    <Text style={styles.reviewUserStars}>⭐⭐⭐⭐⭐</Text>
                  </View>
                  <Text style={styles.reviewText}>Stitching quality for the pashk set was outstanding! The embroidery details inside Mulla Band were perfect.</Text>
                </View>
                <View style={styles.reviewCommentRow}>
                  <View style={styles.reviewCommentUser}>
                    <Text style={styles.reviewUserName}>Zubaida B. (Verified Buyer)</Text>
                    <Text style={styles.reviewUserStars}>⭐⭐⭐⭐⭐</Text>
                  </View>
                  <Text style={styles.reviewText}>Rented a Balochi sets for wedding in Gwadar. Deposit was refunded instantly on return. Recommended!</Text>
                </View>
              </View>
            </View>

            {/* Sticky Bottom Actions Navigation Bar (Store, Chat, Add to Cart, Buy Now) */}
            <View style={styles.checkoutFooterBar}>
              <View style={styles.footerIconsGroup}>
                <TouchableOpacity style={styles.footerIconItem} onPress={() => setActiveTab('CATALOG')}>
                  <Text style={styles.footerIconEmoji}>🏠</Text>
                  <Text style={styles.footerIconLabel}>Store</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerIconItem} onPress={() => Alert.alert('Chat', 'Connecting to Balochi Bazar Atelier Gwadar support...')} >
                  <Text style={styles.footerIconEmoji}>💬</Text>
                  <Text style={styles.footerIconLabel}>Chat</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.footerButtonsGroup}>
                <TouchableOpacity 
                  style={[styles.footerBtnAction, { backgroundColor: '#ff9800' }]} 
                  onPress={() => {
                    Alert.alert('Cart Updated', `${selectedProduct.name} configured size ${standardSize} added to your cart.`);
                  }}
                >
                  <Text style={styles.footerBtnActionText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.footerBtnAction, { backgroundColor: '#f85606' }]} 
                  onPress={() => setCheckoutVisible(true)}
                >
                  <Text style={styles.footerBtnActionText}>Buy Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: ACCOUNT RETRIEVAL & STEP-BY-STEP PROGRESS TRACKING */}
        {activeTab === 'ORDERS' && (
          <View style={{ padding: 12 }}>
            {!isLoggedIn ? (
              <View>
                <Text style={styles.ordersPageTitle}>Track Orders & Tailoring</Text>
                <View style={styles.ordersLoginBox}>
                  <Text style={styles.ordersLoginTitle}>Retrieve Order Records</Text>
                  <Text style={styles.ordersLoginDesc}>Enter your Gwadar phone number to sync and view your orders tracking details.</Text>
                  <TextInput
                    style={styles.detailInput}
                    placeholder="e.g. 03001234567"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={orderPhone}
                    onChangeText={setOrderPhone}
                  />
                  <TouchableOpacity style={styles.ordersLoginBtn} onPress={handleOrderLookup}>
                    <Text style={styles.ordersLoginBtnText}>Retrieve Order List</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {/* 100% Identical Account Dashboard Member Card */}
                <View style={styles.accountProfileCard}>
                  <View style={styles.profileHeaderRow}>
                    <View style={styles.avatarCircle}><Text style={styles.avatarLetter}>👤</Text></View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.accountName}>Balochi Bazar Client</Text>
                      <Text style={styles.memberStatusLabel}>🏆 Silver Member | {orderPhone}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.logoutPill} onPress={() => setIsLoggedIn(false)}>
                    <Text style={styles.logoutPillText}>Logout</Text>
                  </TouchableOpacity>
                </View>

                {/* Status Folders Grid (To Pay, To Ship, To Receive, To Return) */}
                <View style={styles.accountFoldersGrid}>
                  <View style={styles.folderCard}>
                    <Text style={styles.folderIcon}>💳</Text>
                    <Text style={styles.folderLabel}>To Pay</Text>
                    <View style={styles.folderBadge}><Text style={styles.folderBadgeText}>{getStatusCount([])}</Text></View>
                  </View>
                  <View style={styles.folderCard}>
                    <Text style={styles.folderIcon}>🧵</Text>
                    <Text style={styles.folderLabel}>To Ship</Text>
                    <View style={styles.folderBadge}><Text style={styles.folderBadgeText}>{getStatusCount(['PENDING', 'CONFIRMED', 'IN_EMBROIDERY', 'IN_TAILORING'])}</Text></View>
                  </View>
                  <View style={styles.folderCard}>
                    <Text style={styles.folderIcon}>🚚</Text>
                    <Text style={styles.folderLabel}>To Receive</Text>
                    <View style={styles.folderBadge}><Text style={styles.folderBadgeText}>{getStatusCount(['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'])}</Text></View>
                  </View>
                  <View style={styles.folderCard}>
                    <Text style={styles.folderIcon}>↩</Text>
                    <Text style={styles.folderLabel}>To Return</Text>
                    <View style={styles.folderBadge}><Text style={styles.folderBadgeText}>{getStatusCount(['RETURN_REQUESTED'])}</Text></View>
                  </View>
                </View>

                {orders.length === 0 ? (
                  <Text style={styles.noOrdersText}>No orders registered under this number.</Text>
                ) : (
                  orders.map((ord) => {
                    const activeStep = getOrderProgressStep(ord.status);
                    return (
                      <View key={ord.id} style={styles.orderTrackingCard}>
                        {/* Order Header bar */}
                        <View style={styles.trackingCardHead}>
                          <Text style={styles.trackingOrderNum}>Order ID: #{ord.orderNumber}</Text>
                          <Text style={styles.trackingPrice}>Rs. {ord.totalAmount.toLocaleString()}</Text>
                        </View>

                        <Text style={styles.trackingLocationText}>
                          📍 Delivered To: {ord.address?.streetAddress}, {ord.address?.sectorName}
                        </Text>

                        {/* Visual Step-by-Step Tracker Pipeline */}
                        <View style={styles.pipelineContainer}>
                          {['Placed', 'Approved', 'Embroidery', 'Stitching', 'Shipped', 'Complete'].map((step, idx) => {
                            const isCompleted = idx < activeStep;
                            const isCurrent = idx === activeStep;
                            return (
                              <View key={step} style={styles.pipelineStep}>
                                <View style={styles.pipelineGraphicCol}>
                                  <View style={[
                                    styles.pipelineNode,
                                    isCompleted && styles.pipelineNodeCompleted,
                                    isCurrent && styles.pipelineNodeCurrent
                                  ]}>
                                    {isCompleted && <Text style={styles.checkIcon}>✓</Text>}
                                  </View>
                                  {idx < 5 && (
                                    <View style={[
                                      styles.pipelineLine,
                                      isCompleted && styles.pipelineLineCompleted
                                    ]} />
                                  )}
                                </View>
                                <View style={styles.pipelineTextCol}>
                                  <Text style={[
                                    styles.pipelineStepLabel,
                                    isCompleted && styles.pipelineStepLabelCompleted,
                                    isCurrent && styles.pipelineStepLabelCurrent
                                  ]}>
                                    {step}
                                  </Text>
                                  {isCurrent && (
                                    <Text style={styles.currentStatusSubtitle}>
                                      Current Status: {ord.status.replace(/_/g, ' ')}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>

                        {/* Customer receiving / return action buttons */}
                        {ord.status === 'OUT_FOR_DELIVERY' && (
                          <TouchableOpacity 
                            style={styles.receiveBtn} 
                            onPress={() => updateOrderStatusClient(ord.id, 'receive')}
                          >
                            <Text style={styles.receiveBtnText}>Confirm Order Received</Text>
                          </TouchableOpacity>
                        )}

                        {ord.status === 'DELIVERED' && (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity 
                              style={[styles.receiveBtn, { flex: 1 }]} 
                              onPress={() => updateOrderStatusClient(ord.id, 'receive')}
                            >
                              <Text style={styles.receiveBtnText}>Confirm Received</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.returnRequestBtn, { flex: 1 }]} 
                              onPress={() => updateOrderStatusClient(ord.id, 'return')}
                            >
                              <Text style={styles.returnRequestBtnText}>Request Return</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Bottom sliding Checkout Modal sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={checkoutVisible}
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.dismissOverlay} onPress={() => setCheckoutVisible(false)} />
          <View style={styles.checkoutSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetHeaderTitle}>Delivery & Checkout Details</Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                <Text style={styles.sheetCloseBtn}>&times;</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 15 }}>
              <View style={styles.formGroup}>
                <Text style={styles.sheetLabel}>Customer Name</Text>
                <TextInput style={styles.detailInput} placeholder="e.g. Kabeer Khan" placeholderTextColor="#aaa" value={userName} onChangeText={setUserName} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.sheetLabel}>Gwadar Phone Number</Text>
                <TextInput style={styles.detailInput} placeholder="e.g. 03001234567" placeholderTextColor="#aaa" keyboardType="phone-pad" value={userPhone} onChangeText={setUserPhone} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.sheetLabel}>Gwadar Delivery Sector</Text>
                <View style={styles.sectorSelector}>
                  {['Mulla Band', 'West Bay', 'East Bay', 'Pishukan'].map((sec) => (
                    <TouchableOpacity 
                      key={sec} 
                      style={[styles.sectorBtn, sector === sec && styles.sectorBtnActive]}
                      onPress={() => setSector(sec)}
                    >
                      <Text style={[styles.sectorBtnText, sector === sec && styles.sectorBtnTextActive]}>
                        {sec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.sheetLabel}>Street Address / House info</Text>
                <TextInput style={styles.detailInput} placeholder="e.g. House 42, St 5" placeholderTextColor="#aaa" value={address} onChangeText={setAddress} />
              </View>

              {/* Coupon code input bar */}
              <View style={styles.formGroup}>
                <Text style={styles.sheetLabel}>Voucher Coupon Discount</Text>
                <View style={styles.voucherInputRow}>
                  <TextInput 
                    style={[styles.detailInput, { flex: 1, marginBottom: 0 }]} 
                    placeholder="Enter Voucher Code (e.g. BAZAR10)" 
                    placeholderTextColor="#aaa" 
                    value={voucherCode} 
                    onChangeText={setVoucherCode} 
                  />
                  <TouchableOpacity style={styles.voucherApplyBtn} onPress={applyVoucher}>
                    <Text style={styles.voucherApplyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Payment Summary */}
              <View style={styles.checkoutPriceDetailsCard}>
                <View style={styles.priceRowItem}>
                  <Text style={styles.priceItemLabel}>Payment Method:</Text>
                  <Text style={styles.priceItemVal}>Cash on Delivery (COD)</Text>
                </View>
                <View style={styles.priceRowItem}>
                  <Text style={styles.priceItemLabel}>Subtotal price:</Text>
                  <Text style={styles.priceItemVal}>Rs. {calculateTotal().toLocaleString()}</Text>
                </View>
                {voucherDiscount > 0 && (
                  <View style={styles.priceRowItem}>
                    <Text style={[styles.priceItemLabel, { color: 'var(--danger)' }]}>Voucher Discount:</Text>
                    <Text style={[styles.priceItemVal, { color: 'var(--danger)' }]}>- Rs. {voucherDiscount.toLocaleString()}</Text>
                  </View>
                )}
                <View style={styles.priceRowItem} style={{ borderTopWidth: 1, borderColor: '#eee', paddingTop: 8, marginTop: 8 }}>
                  <Text style={[styles.priceItemLabel, { fontWeight: 'bold', color: '#212121' }]}>Final Total:</Text>
                  <Text style={[styles.priceItemVal, { fontWeight: 'bold', color: 'var(--primary)', fontSize: 16 }]}>
                    Rs. {calculateTotal().toLocaleString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.sheetCheckoutBtn} onPress={handleCheckout}>
                <Text style={styles.sheetCheckoutBtnText}>Place Order (COD)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('CATALOG')}>
          <Text style={[styles.tabIcon, activeTab === 'CATALOG' && styles.tabActiveColor]}>🏠</Text>
          <Text style={[styles.tabText, activeTab === 'CATALOG' && styles.tabActiveColor]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('CUSTOMIZER')}>
          <Text style={[styles.tabIcon, activeTab === 'CUSTOMIZER' && styles.tabActiveColor]}>✂</Text>
          <Text style={[styles.tabText, activeTab === 'CUSTOMIZER' && styles.tabActiveColor]}>Customize</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('ORDERS')}>
          <Text style={[styles.tabIcon, activeTab === 'ORDERS' && styles.tabActiveColor]}>📦</Text>
          <Text style={[styles.tabText, activeTab === 'ORDERS' && styles.tabActiveColor]}>My Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f8',
  },
  ipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e4e8',
  },
  ipLabel: {
    color: '#5f6368',
    fontSize: 11,
    marginRight: 4,
    fontWeight: 'bold',
  },
  ipInput: {
    flex: 1,
    height: 30,
    backgroundColor: '#f1f2f5',
    color: '#212121',
    borderRadius: 2,
    paddingHorizontal: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#e2e4e8',
  },
  ipBtn: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f85606',
    borderRadius: 2,
  },
  ipBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  loadingText: {
    color: '#9e9e9e',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
  },

  // Home Screen Styling (Daraz app)
  darazSearchHeader: {
    backgroundColor: '#f85606',
    padding: 10,
    paddingBottom: 15,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  cameraIcon: {
    fontSize: 14,
    marginLeft: 6,
  },
  searchBarInput: {
    flex: 1,
    height: 36,
    fontSize: 12,
    color: '#212121',
    padding: 0,
  },
  headerIconBtn: {
    position: 'relative',
    padding: 4,
  },
  headerIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3b30',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Campaigns Banner Slider
  sliderContainer: {
    width: width,
    height: 150,
    position: 'relative',
  },
  sliderImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  sliderPills: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  sliderPill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  sliderPillActive: {
    backgroundColor: '#ffffff',
    width: 12,
  },

  // Channels Row
  channelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    marginBottom: 8,
  },
  channelItem: {
    alignItems: 'center',
    width: 65,
  },
  channelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff1eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelEmoji: {
    fontSize: 18,
  },
  channelLabel: {
    fontSize: 10,
    color: '#212121',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Flash Sale styling
  flashSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    marginBottom: 8,
  },
  flashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  flashTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#f85606',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeDigit: {
    backgroundColor: '#212121',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 2,
  },
  timeDigitText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  timeColon: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#212121',
  },
  shopMoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f85606',
  },
  flashScroll: {
    paddingLeft: 10,
  },
  flashCard: {
    width: 105,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#f1f2f6',
    padding: 4,
    position: 'relative',
  },
  flashCardImg: {
    width: '100%',
    height: 95,
    objectFit: 'cover',
    borderRadius: 2,
  },
  flashCardPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f85606',
    marginTop: 4,
  },
  flashCardOldPrice: {
    fontSize: 9,
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
  },
  flashProgressContainer: {
    height: 8,
    backgroundColor: '#eaecef',
    borderRadius: 4,
    marginTop: 4,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  flashProgressBar: {
    height: '100%',
    backgroundColor: '#ff5c00',
  },
  flashProgressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 6,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f85606',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // 2-Column Recommended grid
  gridSection: {
    padding: 10,
  },
  gridSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f6368',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  filterScrollView: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e4e8',
    borderRadius: 2,
    marginRight: 6,
    height: 26,
  },
  filterChipActive: {
    backgroundColor: '#ffece2',
    borderColor: '#f85606',
  },
  filterChipText: {
    fontSize: 10,
    color: '#212121',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#f85606',
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e4e8',
  },
  gridImg: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
  },
  gridInfo: {
    padding: 6,
  },
  gridCategory: {
    fontSize: 8,
    color: '#f85606',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridName: {
    fontSize: 11,
    color: '#212121',
    fontWeight: '500',
    marginTop: 2,
    height: 30,
  },
  microBadgesRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  microBadgeCoins: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  microBadgeFreeShip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  microBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#334155',
  },
  gridPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f85606',
    marginTop: 2,
  },
  gridReviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    alignItems: 'center',
  },
  gridStar: {
    fontSize: 9,
    color: '#5f6368',
  },
  gridLocation: {
    fontSize: 9,
    color: '#9e9e9e',
  },

  // CUSTOMIZER / DETAIL PAGE STYLING
  detailProductImg: {
    width: width,
    height: 300,
    objectFit: 'cover',
  },
  detailInfoBlock: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  detailPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailPriceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f85606',
  },
  rentalPill: {
    backgroundColor: '#ffece2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#f85606',
  },
  rentalPillText: {
    color: '#f85606',
    fontSize: 10,
    fontWeight: '700',
  },
  detailProductName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 6,
    lineHeight: 1.3,
  },
  detailProductDesc: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 4,
    lineHeight: 1.4,
  },
  trustCard: {
    backgroundColor: '#ffffff',
    padding: 10,
    marginTop: 8,
    gap: 4,
  },
  trustItem: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '500',
  },
  configCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212121',
  },
  configSection: {
    marginTop: 12,
  },
  configSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f6368',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  rentalDurationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  durationBubble: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: '#e2e4e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  durationBubbleActive: {
    borderColor: '#f85606',
    backgroundColor: '#ffece2',
  },
  durationBubbleText: {
    fontSize: 11,
    color: '#212121',
  },
  durationBubbleTextActive: {
    color: '#f85606',
    fontWeight: 'bold',
  },
  configInfoText: {
    fontSize: 10,
    color: '#9e9e9e',
    marginTop: 6,
  },
  variationPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  variationPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e4e8',
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  variationPillActive: {
    borderColor: '#f85606',
    backgroundColor: '#ffece2',
  },
  variationPillText: {
    fontSize: 11,
    color: '#212121',
  },
  variationPillTextActive: {
    color: '#f85606',
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: '#e2e4e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  tabBtnActive: {
    borderColor: '#f85606',
    backgroundColor: '#ffece2',
  },
  tabBtnText: {
    fontSize: 11,
    color: '#212121',
  },
  tabBtnTextActive: {
    color: '#f85606',
    fontWeight: 'bold',
  },
  sizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  sizeBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e4e8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  sizeBubbleActive: {
    borderColor: '#f85606',
    backgroundColor: '#f85606',
  },
  sizeBubbleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#212121',
  },
  sizeBubbleTextActive: {
    color: '#ffffff',
  },
  customSizeInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  detailInput: {
    height: 35,
    backgroundColor: '#f4f5f8',
    borderWidth: 1,
    borderColor: '#e2e4e8',
    color: '#212121',
    borderRadius: 2,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 8,
  },

  // Customer Feedback styling
  feedbackSectionCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginTop: 8,
    marginBottom: 85,
  },
  feedbackSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingBottom: 6,
    marginBottom: 8,
  },
  feedbackSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f6368',
    textTransform: 'uppercase',
  },
  feedbackAggregateText: {
    fontSize: 11,
    color: '#f85606',
    fontWeight: 'bold',
  },
  reviewsList: {
    gap: 10,
  },
  reviewCommentRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    paddingBottom: 8,
  },
  reviewCommentUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewUserName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#212121',
  },
  reviewUserStars: {
    fontSize: 9,
  },
  reviewText: {
    fontSize: 11,
    color: '#5f6368',
    lineHeight: 1.35,
  },

  // Sticky bottom checkout details
  checkoutFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 55,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e4e8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  footerIconsGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  footerIconItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIconEmoji: {
    fontSize: 16,
    color: '#5f6368',
  },
  footerIconLabel: {
    fontSize: 8,
    color: '#5f6368',
    fontWeight: '500',
    marginTop: 1,
  },
  footerButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  footerBtnAction: {
    height: 36,
    width: 105,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  footerBtnActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // ORDER TRACKING PAGE STYLING
  ordersPageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  ordersLoginBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#e2e4e8',
  },
  ordersLoginTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  ordersLoginDesc: {
    fontSize: 11,
    color: '#5f6368',
    marginBottom: 12,
    lineHeight: 1.3,
  },
  ordersLoginBtn: {
    backgroundColor: '#f85606',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginTop: 4,
  },
  ordersLoginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  logoutPillText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  noOrdersText: {
    textAlign: 'center',
    color: '#9e9e9e',
    marginTop: 40,
    fontSize: 12,
  },
  orderTrackingCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e4e8',
    padding: 12,
    marginBottom: 10,
    borderRadius: 2,
  },
  trackingCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingBottom: 6,
    marginBottom: 6,
  },
  trackingOrderNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#212121',
  },
  trackingPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f85606',
  },
  trackingLocationText: {
    fontSize: 10,
    color: '#5f6368',
    marginBottom: 10,
  },

  // Account member Dashboard card
  accountProfileCard: {
    backgroundColor: '#f85606',
    padding: 18,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#f85606',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarLetter: {
    fontSize: 18,
    color: '#ffffff',
  },
  accountName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  memberStatusLabel: {
    fontSize: 10,
    color: '#fffdec',
    fontWeight: 'bold',
    marginTop: 2,
  },

  // Account folder grids
  accountFoldersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e4e8',
    borderRadius: 2,
    marginBottom: 15,
  },
  folderCard: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  folderIcon: {
    fontSize: 16,
    color: '#5f6368',
  },
  folderLabel: {
    fontSize: 9,
    color: '#5f6368',
    fontWeight: 'bold',
    marginTop: 2,
  },
  folderBadge: {
    position: 'absolute',
    top: 0,
    right: 18,
    backgroundColor: '#f85606',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Step-by-Step Tracker timeline
  pipelineContainer: {
    marginTop: 5,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e4e8',
    marginLeft: 8,
    paddingLeft: 12,
    gap: 12,
    marginBottom: 10,
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  pipelineGraphicCol: {
    position: 'absolute',
    left: -20,
    top: 2,
    alignItems: 'center',
  },
  pipelineNode: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#eaecef',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineNodeCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  pipelineNodeCurrent: {
    backgroundColor: '#f85606',
    borderColor: '#f85606',
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  pipelineLine: {
    width: 1,
    height: 30,
    backgroundColor: '#eaecef',
    position: 'absolute',
    top: 15,
  },
  pipelineLineCompleted: {
    backgroundColor: '#22c55e',
  },
  pipelineTextCol: {
    flexGrow: 1,
  },
  pipelineStepLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  pipelineStepLabelCompleted: {
    color: '#212121',
  },
  pipelineStepLabelCurrent: {
    color: '#f85606',
    fontWeight: 'bold',
  },
  currentStatusSubtitle: {
    fontSize: 9,
    color: '#f85606',
    marginTop: 2,
  },

  // receive actions buttons
  receiveBtn: {
    backgroundColor: '#22c55e',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginTop: 8,
  },
  receiveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  returnRequestBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ef4444',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginTop: 8,
  },
  returnRequestBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Modal slide checkout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  checkoutSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  sheetHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
  },
  sheetCloseBtn: {
    fontSize: 22,
    color: '#9e9e9e',
  },
  formGroup: {
    marginBottom: 8,
  },
  sheetLabel: {
    fontSize: 11,
    color: '#5f6368',
    marginBottom: 4,
    fontWeight: '500',
  },
  sectorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sectorBtn: {
    flexGrow: 1,
    height: 28,
    borderWidth: 1,
    borderColor: '#e2e4e8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 2,
  },
  sectorBtnActive: {
    borderColor: '#f85606',
    backgroundColor: '#ffece2',
  },
  sectorBtnText: {
    fontSize: 10,
    color: '#212121',
  },
  sectorBtnTextActive: {
    color: '#f85606',
    fontWeight: 'bold',
  },
  voucherInputRow: {
    flexDirection: 'row',
    gap: 6,
  },
  voucherApplyBtn: {
    width: 70,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  voucherApplyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkoutPriceDetailsCard: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#e2e4e8',
    marginBottom: 15,
  },
  priceRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  priceItemLabel: {
    fontSize: 10,
    color: '#5f6368',
  },
  priceItemVal: {
    fontSize: 10,
    color: '#212121',
    fontWeight: '500',
  },
  sheetCheckoutBtn: {
    backgroundColor: '#f85606',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginBottom: 20,
  },
  sheetCheckoutBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Generic Bottom Tab Navigator
  tabBar: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e4e8',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 18,
    color: '#9e9e9e',
  },
  tabText: {
    fontSize: 9,
    color: '#9e9e9e',
    fontWeight: '500',
    marginTop: 2,
  },
  tabActiveColor: {
    color: '#f85606',
  },
});
