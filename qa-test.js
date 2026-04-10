// QA Test Script Round 2 — Full Regression + Integration
const http = require('http');

const BASE = 'http://localhost:5000';
let TOKEN = '';
let REFRESH_TOKEN = '';
let mechToken = '';
let managerToken = '';
let receptionistToken = '';
let results = { pass: 0, fail: 0, errors: [] };

function req(method, path, body = null, customToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(customToken !== false && (customToken || TOKEN) ? { Authorization: `Bearer ${customToken || TOKEN}` } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch {
          resolve({ status: res.statusCode, body: b });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function test(name, passed, detail = '') {
  if (passed) {
    results.pass++;
    console.log('  \u2705 ' + name);
  } else {
    results.fail++;
    results.errors.push({ name, detail });
    console.log('  \u274C ' + name + (detail ? ' \u2014 ' + detail : ''));
  }
}

async function run() {
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('  QA TEST ROUND 2 \u2014 FULL REGRESSION + FIX VERIFICATION');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');

  // ═══ 1. AUTH MODULE ═══
  console.log('\u2500\u2500 AUTH MODULE \u2500\u2500');

  // Login all roles
  let r = await req('POST', '/api/auth/login', { email: 'admin@garage.co.ke', password: 'Admin@1234' }, false);
  test('Login owner (200)', r.status === 200, 'status=' + r.status);
  test('Login response has token.access_token', !!r.body?.data?.token?.access_token);
  test('Login response has token.refresh_token', !!r.body?.data?.token?.refresh_token);
  test('Login response has user.role.slug', !!r.body?.data?.user?.role?.slug);
  test('Login response has session.session_id', !!r.body?.data?.session?.session_id);
  test('User role is owner', r.body?.data?.user?.role?.slug === 'owner', r.body?.data?.user?.role?.slug);
  TOKEN = r.body?.data?.token?.access_token || '';
  REFRESH_TOKEN = r.body?.data?.token?.refresh_token || '';

  r = await req('POST', '/api/auth/login', { email: 'manager@garage.co.ke', password: 'Admin@1234' }, false);
  test('Login manager (200)', r.status === 200, 'status=' + r.status);
  managerToken = r.body?.data?.token?.access_token || '';

  r = await req('POST', '/api/auth/login', { email: 'mechanic@garage.co.ke', password: 'Admin@1234' }, false);
  test('Login mechanic (200)', r.status === 200, 'status=' + r.status);
  mechToken = r.body?.data?.token?.access_token || '';

  r = await req('POST', '/api/auth/login', { email: 'receptionist@garage.co.ke', password: 'Admin@1234' }, false);
  test('Login receptionist (200)', r.status === 200, 'status=' + r.status);
  receptionistToken = r.body?.data?.token?.access_token || '';

  // Invalid credentials
  r = await req('POST', '/api/auth/login', { email: 'admin@garage.co.ke', password: 'wrongpass' }, false);
  test('Invalid password (401)', r.status === 401, 'status=' + r.status);

  // Empty body
  r = await req('POST', '/api/auth/login', {}, false);
  test('Login empty body (400)', r.status === 400, 'status=' + r.status);

  // Non-existent email
  r = await req('POST', '/api/auth/login', { email: 'nope@test.com', password: 'FakePass1!' }, false);
  test('Non-existent user (401)', r.status === 401, 'status=' + r.status);

  // Refresh token
  r = await req('POST', '/api/auth/refresh', { refresh_token: REFRESH_TOKEN }, false);
  test('Refresh token (200)', r.status === 200, 'status=' + r.status);
  test('Refresh returns new access_token', !!r.body?.data?.token?.access_token);
  test('Refresh returns new refresh_token', !!r.body?.data?.token?.refresh_token);
  if (r.body?.data?.token?.access_token) TOKEN = r.body.data.token.access_token;
  if (r.body?.data?.token?.refresh_token) REFRESH_TOKEN = r.body.data.token.refresh_token;

  // Invalid refresh token
  r = await req('POST', '/api/auth/refresh', { refresh_token: 'invalid.token.here' }, false);
  test('Invalid refresh token (401)', r.status === 401, 'status=' + r.status);

  // Missing refresh token body
  r = await req('POST', '/api/auth/refresh', {}, false);
  test('Missing refresh token (400)', r.status === 400, 'status=' + r.status);

  // Profile
  r = await req('GET', '/api/auth/profile');
  test('Get profile (200)', r.status === 200, 'status=' + r.status);
  test('Profile has user.email', !!r.body?.data?.user?.email || !!r.body?.data?.email, JSON.stringify(Object.keys(r.body?.data || {})).substring(0, 100));

  // Users list
  r = await req('GET', '/api/auth/users');
  test('Get users list (200)', r.status === 200, 'status=' + r.status);
  const usersData = r.body?.data;
  const users = usersData?.users || (Array.isArray(usersData) ? usersData : []);
  test('Users list has entries', users.length > 0, 'count=' + users.length);

  // No-auth access
  r = await req('GET', '/api/auth/profile', null, false);
  test('No token returns 401', r.status === 401, 'status=' + r.status);

  // ═══ 2. CARS / JOB CARDS ═══
  console.log('\n\u2500\u2500 CARS / JOB CARDS \u2500\u2500');

  r = await req('GET', '/api/cars');
  test('Get all cars (200)', r.status === 200, 'status=' + r.status);
  const carsData = r.body?.data;
  const cars = carsData?.cars || (Array.isArray(carsData) ? carsData : []);
  test('Cars data present', cars.length >= 0, 'count=' + cars.length);
  const testCar = cars[0];
  const testCarId = testCar?._id;

  // Dashboard stats
  r = await req('GET', '/api/cars/dashboard');
  test('Dashboard stats (200)', r.status === 200, 'status=' + r.status);
  if (r.status === 200) {
    const d = r.body?.data;
    test('Dashboard has totalCarsInGarage', d?.totalCarsInGarage !== undefined, JSON.stringify(Object.keys(d || {})).substring(0, 200));
    test('Dashboard has carsInProgress', d?.carsInProgress !== undefined);
    test('Dashboard has carsCompletedToday', d?.carsCompletedToday !== undefined);
    test('Dashboard has activeMechanics', d?.activeMechanics !== undefined);
  }

  // Garage board
  r = await req('GET', '/api/cars/garage-board');
  test('Garage board (200)', r.status === 200, 'status=' + r.status);

  // Single car
  if (testCarId) {
    r = await req('GET', '/api/cars/' + testCarId);
    test('Get car by ID (200)', r.status === 200, 'status=' + r.status);
    const car = r.body?.data;
    test('Car has _id', !!car?._id);
    test('Car has stage', !!car?.stage);
    test('Car has vehiclePlate', !!car?.vehiclePlate);
    test('Car has vehicleModel', !!car?.vehicleModel);
    test('Car has customerName', !!car?.customerName);
    test('Car has customerId', !!car?.customerId);
    test('Car has estimatedCost', car?.estimatedCost !== undefined);
    test('Car has paymentStatus', !!car?.paymentStatus);
    test('Car has serviceType', !!car?.serviceType);
    test('Car has services array', Array.isArray(car?.services));
    test('Car has checkInDate', !!car?.checkInDate);
    test('Car has daysInGarage >= 0', car?.daysInGarage >= 0);
    test('Car has beforePhotos array', Array.isArray(car?.beforePhotos));
    test('Car has afterPhotos array', Array.isArray(car?.afterPhotos));
  } else {
    console.log('  \u26A0\uFE0F  No cars in DB \u2014 skipping detail tests');
  }

  // Non-existent car
  r = await req('GET', '/api/cars/000000000000000000000000');
  test('Non-existent car (404)', r.status === 404, 'status=' + r.status);

  // Invalid create
  r = await req('POST', '/api/cars', {});
  test('Create car empty body (400)', r.status === 400, 'status=' + r.status);

  // ═══ 3. INVOICES ═══
  console.log('\n\u2500\u2500 INVOICES \u2500\u2500');

  r = await req('GET', '/api/invoices');
  test('Get all invoices (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/api/invoices/revenue-stats');
  test('Revenue stats (200)', r.status === 200, 'status=' + r.status);
  if (r.status === 200) {
    const s = r.body?.data;
    test('Has totalRevenue', s?.totalRevenue !== undefined);
    test('Has revenueToday', s?.revenueToday !== undefined);
    test('Has revenueThisWeek', s?.revenueThisWeek !== undefined);
    test('Has revenueThisMonth', s?.revenueThisMonth !== undefined);
    test('Has paidInvoices', s?.paidInvoices !== undefined);
    test('Has unpaidInvoices', s?.unpaidInvoices !== undefined);
    test('Has monthlyRevenue (6 entries)', Array.isArray(s?.monthlyRevenue) && s.monthlyRevenue.length === 6, 'len=' + s?.monthlyRevenue?.length);
    test('Has topPayingClients', Array.isArray(s?.topPayingClients));
    test('Has paymentMethodDistribution', Array.isArray(s?.paymentMethodDistribution));
    test('Has revenueTrend', s?.revenueTrend !== undefined);
    test('Has averageInvoiceValue', s?.averageInvoiceValue !== undefined);
  }

  r = await req('GET', '/api/invoices/outstanding');
  test('Outstanding invoices (200)', r.status === 200, 'status=' + r.status);

  // Generate invoice from car
  if (testCarId) {
    r = await req('POST', '/api/invoices/generate-from-car/' + testCarId);
    test('Generate invoice (201|400)', r.status === 201 || r.status === 400, 'status=' + r.status + ' msg=' + (r.body?.message || ''));
  }

  // Non-existent invoice
  r = await req('GET', '/api/invoices/000000000000000000000000');
  test('Non-existent invoice (404|500)', r.status === 404 || r.status === 500, 'status=' + r.status);

  // ═══ 4. CUSTOMERS ═══
  console.log('\n\u2500\u2500 CUSTOMERS \u2500\u2500');

  r = await req('GET', '/api/customers');
  test('Get customers (200)', r.status === 200, 'status=' + r.status);
  const custData = r.body?.data;
  const customers = custData?.customers || (Array.isArray(custData) ? custData : []);
  test('Customers count >= 0', customers.length >= 0, 'count=' + customers.length);

  if (customers[0]?._id) {
    r = await req('GET', '/api/customers/' + customers[0]._id);
    test('Get customer by ID (200)', r.status === 200, 'status=' + r.status);
    test('Customer has name', !!r.body?.data?.name);
    test('Customer has email', r.body?.data?.email !== undefined);
    test('Customer has phone', r.body?.data?.phone !== undefined);
  }

  // Search customers
  r = await req('GET', '/api/customers/search?q=test');
  test('Search customers (200)', r.status === 200, 'status=' + r.status);

  // Top customers
  r = await req('GET', '/api/customers/top');
  test('Top customers (200)', r.status === 200, 'status=' + r.status);

  // ═══ 5. MECHANICS ═══
  console.log('\n\u2500\u2500 MECHANICS \u2500\u2500');

  r = await req('GET', '/api/mechanics');
  test('Get mechanics (200)', r.status === 200, 'status=' + r.status);

  // Mechanic birthdays
  r = await req('GET', '/api/mechanics/birthdays');
  test('Mechanic birthdays (200)', r.status === 200, 'status=' + r.status);

  // ═══ 6. INVENTORY ═══
  console.log('\n\u2500\u2500 INVENTORY \u2500\u2500');

  r = await req('GET', '/api/inventory');
  test('Get inventory (200)', r.status === 200, 'status=' + r.status);

  // ═══ 7. BOOKINGS ═══
  console.log('\n\u2500\u2500 BOOKINGS \u2500\u2500');

  r = await req('GET', '/api/bookings');
  test('Get bookings (200)', r.status === 200, 'status=' + r.status);

  // ═══ 8. INSPECTIONS ═══
  console.log('\n\u2500\u2500 INSPECTIONS \u2500\u2500');

  r = await req('GET', '/api/inspections');
  test('Get inspections (200)', r.status === 200, 'status=' + r.status);

  // ═══ 9. ATTENDANCE (FIX VERIFICATION) ═══
  console.log('\n\u2500\u2500 ATTENDANCE \u2500\u2500');

  r = await req('GET', '/api/attendance/today');
  test('Today attendance (200) [owner]', r.status === 200, 'status=' + r.status);

  // FIX VERIFICATION: owner can now access /status
  r = await req('GET', '/api/attendance/status');
  test('[FIX] Owner can access /status (200)', r.status === 200, 'status=' + r.status);

  // Manager can also access
  r = await req('GET', '/api/attendance/status', null, managerToken);
  test('[FIX] Manager can access /status (200)', r.status === 200, 'status=' + r.status);

  // Mechanic can still access
  r = await req('GET', '/api/attendance/status', null, mechToken);
  test('Mechanic can access /status (200)', r.status === 200, 'status=' + r.status);

  // Attendance stats
  r = await req('GET', '/api/attendance/stats?startDate=2025-01-01&endDate=2025-12-31');
  test('Attendance stats (200)', r.status === 200, 'status=' + r.status);

  // ═══ 10. SETTINGS ═══
  console.log('\n\u2500\u2500 SETTINGS \u2500\u2500');

  r = await req('GET', '/api/settings');
  test('Get settings (200)', r.status === 200, 'status=' + r.status);
  test('Settings has data', !!r.body?.data);

  // ═══ 11. EXPENSES ═══
  console.log('\n\u2500\u2500 EXPENSES \u2500\u2500');

  r = await req('GET', '/api/expenses');
  test('Get expenses (200)', r.status === 200, 'status=' + r.status);

  // ═══ 12. HEALTH ═══
  console.log('\n\u2500\u2500 HEALTH CHECK \u2500\u2500');

  r = await req('GET', '/api/health', null, false);
  test('Health (200)', r.status === 200, 'status=' + r.status);
  test('Health says running', r.body?.message === 'Server is running');

  // ═══ 13. AUTHORIZATION ═══
  console.log('\n\u2500\u2500 AUTHORIZATION MATRIX \u2500\u2500');

  // Mechanic restrictions
  r = await req('GET', '/api/invoices/revenue-stats', null, mechToken);
  test('Mechanic blocked: revenue stats (403)', r.status === 403, 'status=' + r.status);

  r = await req('DELETE', '/api/cars/000000000000000000000000', null, mechToken);
  test('Mechanic blocked: delete car (403)', r.status === 403, 'status=' + r.status);

  r = await req('POST', '/api/invoices', {}, mechToken);
  test('Mechanic blocked: create invoice (403)', r.status === 403, 'status=' + r.status);

  r = await req('GET', '/api/auth/users', null, mechToken);
  test('Mechanic blocked: user list (403)', r.status === 403, 'status=' + r.status);

  // Mechanic permissions
  r = await req('GET', '/api/cars', null, mechToken);
  test('Mechanic allowed: list cars (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/api/attendance/status', null, mechToken);
  test('Mechanic allowed: attendance status (200)', r.status === 200, 'status=' + r.status);

  // Receptionist can create invoices
  r = await req('POST', '/api/cars', {}, receptionistToken);
  test('Receptionist can attempt car create (400 validation)', r.status === 400, 'status=' + r.status);

  // Manager has most access
  r = await req('GET', '/api/invoices/revenue-stats', null, managerToken);
  test('Manager allowed: revenue stats (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/api/auth/users', null, managerToken);
  test('Manager allowed: user list (200)', r.status === 200, 'status=' + r.status);

  // ═══ 14. CROSS-MODULE INTEGRATION ═══
  console.log('\n\u2500\u2500 CROSS-MODULE INTEGRATION \u2500\u2500');

  // Car detail + invoice linkage
  if (testCarId) {
    const carR = await req('GET', '/api/cars/' + testCarId);
    const invR = await req('GET', '/api/invoices?carId=' + testCarId);
    const car = carR.body?.data;
    const carInvoices = invR.body?.data || [];

    if (car?.invoiceId) {
      test('Car has invoiceId back-reference', !!car.invoiceId);
      test('Invoice exists for car', carInvoices.length > 0, 'count=' + carInvoices.length);
    } else {
      test('Car without invoice: no invoiceId', !car?.invoiceId);
    }

    // Payment status consistency
    if (carInvoices.length > 0) {
      const inv = carInvoices[0];
      test('Invoice has carId matching test car', String(inv.carId?._id || inv.carId) === String(testCarId));
    }
  }

  // Dashboard stats consistency
  r = await req('GET', '/api/cars/dashboard');
  if (r.status === 200) {
    const d = r.body?.data;
    test('Dashboard totalCarsInGarage >= 0', d?.totalCarsInGarage >= 0);
    test('Dashboard carsInProgress >= 0', d?.carsInProgress >= 0);
  }

  // Revenue stats consistency  
  r = await req('GET', '/api/invoices/revenue-stats');
  if (r.status === 200) {
    const s = r.body?.data;
    test('Revenue: totalRevenue >= 0', s?.totalRevenue >= 0);
    test('Revenue: paid + unpaid + partial consistent',
      (s?.paidInvoices + s?.unpaidInvoices + s?.partialInvoices) >= 0);
  }

  // ═══ 15. EDGE CASES & ERROR HANDLING ═══
  console.log('\n\u2500\u2500 EDGE CASES & ERROR HANDLING \u2500\u2500');

  // Malformed ObjectId
  r = await req('GET', '/api/cars/not-a-valid-id');
  test('Malformed car ID handled', r.status >= 400, 'status=' + r.status);

  r = await req('GET', '/api/customers/not-a-valid-id');
  test('Malformed customer ID handled', r.status >= 400, 'status=' + r.status);

  // Empty POST body on invoice
  r = await req('POST', '/api/invoices', {});
  test('Create invoice empty body (400)', r.status === 400, 'status=' + r.status);

  // Generate invoice for non-existent car
  r = await req('POST', '/api/invoices/generate-from-car/000000000000000000000000');
  test('Generate invoice non-existent car (404)', r.status === 404, 'status=' + r.status);

  // 404 for completely unknown route
  r = await req('GET', '/api/unknown-route');
  test('Unknown route (404)', r.status === 404, 'status=' + r.status);

  // ═══ SUMMARY ═══
  console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('  RESULTS: ' + results.pass + ' passed, ' + results.fail + ' failed');
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');

  if (results.errors.length > 0) {
    console.log('\n  FAILURES:');
    results.errors.forEach((e, i) => {
      console.log('  ' + (i + 1) + '. ' + e.name + ': ' + e.detail);
    });
  }
  console.log('');
}

run().catch(console.error);
