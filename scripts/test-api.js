const dns = require('dns');

// Force Node.js to resolve localhost to 127.0.0.1 instead of ::1 (IPv6), to prevent local network fetch failures.
dns.setDefaultResultOrder('ipv4first');

const API_BASE = 'http://127.0.0.1:5000/api';
const ROOT_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('🚀 Starting Balochi Bazzar Integration Test Suite...\n');
  let exitCode = 0;

  try {
    // 1. Verify backend health
    console.log('📋 Test 1: Verification of backend server health check...');
    const healthRes = await fetch(ROOT_URL);
    if (!healthRes.ok) throw new Error(`Backend offline, status code: ${healthRes.status}`);
    const healthData = await healthRes.json();
    console.log(`✅ Success: ${JSON.stringify(healthData)}`);
    console.log('--------------------------------------------------');

    // 2. Fetch products catalog
    console.log('📋 Test 2: Fetching product catalog...');
    const productsRes = await fetch(`${API_BASE}/products`);
    if (!productsRes.ok) throw new Error(`Failed to fetch products: ${productsRes.status}`);
    const products = await productsRes.json();
    console.log(`✅ Success: Found ${products.length} products in the database.`);
    if (products.length === 0) throw new Error('Catalog is empty! Seed database first.');
    console.log('--------------------------------------------------');

    // 3. Fetch single product details
    const testProduct = products[0];
    console.log(`📋 Test 3: Fetching details for product "${testProduct.name}"...`);
    const productDetailRes = await fetch(`${API_BASE}/products/${testProduct.id}`);
    if (!productDetailRes.ok) throw new Error(`Failed to fetch product details: ${productDetailRes.status}`);
    const productDetail = await productDetailRes.json();
    console.log(`✅ Success: Loaded details. Allows customization: ${productDetail.allowsCustomEmbroidery}`);
    console.log('--------------------------------------------------');

    // 4. Test User Authentication (Register)
    const testPhone = '03998765432';
    const testName = 'Test Client Gwadar';
    console.log(`📋 Test 4: Testing user registration for phone: ${testPhone}...`);
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: testPhone,
        password: 'localpassword123',
        name: testName,
        sectorName: 'Sabiya',
        streetAddress: 'House 42, Street 3',
        landmark: 'Near Sabiya Mosque'
      })
    });
    
    let token = '';
    const registerData = await registerRes.json();
    if (registerRes.ok) {
      console.log('✅ Success: New account registered.');
      token = registerData.token;
    } else if (registerData.error && registerData.error.includes('already registered')) {
      console.log('ℹ️ Info: User already registered. Proceeding to login...');
    } else {
      throw new Error(`Registration failed: ${registerData.error}`);
    }

    // 5. Test User Authentication (Login)
    console.log('📋 Test 5: Logging in user account...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: testPhone,
        password: 'localpassword123'
      })
    });
    if (!loginRes.ok) {
      const loginData = await loginRes.json();
      throw new Error(`Login failed: ${loginData.error}`);
    }
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log(`✅ Success: Logged in successfully. Received auth token.`);
    console.log('--------------------------------------------------');

    // 6. Test Address creation
    console.log('📋 Test 6: Creating delivery address profile...');
    const addressRes = await fetch(`${API_BASE}/auth/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sectorName: 'Mulla Band',
        streetAddress: 'Plot 55, Near gwadar port',
        landmark: 'Gwadar Port Gate',
        isDefault: true
      })
    });
    if (!addressRes.ok) {
      const addressData = await addressRes.json();
      throw new Error(`Address registration failed: ${addressData.error}`);
    }
    const addressData = await addressRes.json();
    console.log(`✅ Success: Address created. ID: ${addressData.id}`);
    console.log('--------------------------------------------------');

    // 7. Place Checkout Order
    console.log(`📋 Test 7: Submitting order for product: "${testProduct.name}"...`);
    const orderPayload = {
      addressId: addressData.id,
      paymentMethod: 'COD',
      items: [
        {
          productId: testProduct.id,
          quantity: 1,
          customizations: [],
          customSizing: { standardSize: 'M' },
          isRental: false,
          rentalDays: null
        }
      ]
    };
    
    const orderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });
    if (!orderRes.ok) {
      const orderData = await orderRes.json();
      throw new Error(`Order placement failed: ${orderData.error}`);
    }
    const orderData = await orderRes.json();
    console.log(`✅ Success: Order created successfully. Order Number: ${orderData.orderNumber}`);
    console.log('--------------------------------------------------');

    // 8. Retrieve Order list for customer
    console.log('📋 Test 8: Retrieving user order history...');
    const myOrdersRes = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!myOrdersRes.ok) throw new Error(`Failed to fetch my orders: ${myOrdersRes.status}`);
    const myOrders = await myOrdersRes.json();
    const foundOrder = myOrders.find(o => o.orderNumber === orderData.orderNumber);
    if (!foundOrder) throw new Error('Placed order not found in history!');
    console.log(`✅ Success: Verified! Order ${orderData.orderNumber} is listed in user history with status: ${foundOrder.status}`);
    console.log('--------------------------------------------------');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The backend is healthy and fully functional.');
  } catch (err) {
    console.error(`\n❌ TEST FAILURE: ${err.message}`);
    exitCode = 1;
  }

  process.exit(exitCode);
}

runTests();
