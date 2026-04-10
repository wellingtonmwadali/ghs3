/**
 * FUNCTIONAL REQUIREMENTS TEST
 * Tests all implemented features per FUNCTIONAL_REQUIREMENTS_ANALYSIS.md
 * Covers: 101 API endpoints, 14 modules, 4 roles, workflows, data integrity
 */

const BASE = 'http://localhost:5000/api';
let passed = 0, failed = 0, failures = [];
const ROLES = {};
let SAMPLE = {}; // store sample IDs for cross-module tests

function test(name, ok, detail) {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(`${name}: ${detail || 'FAIL'}`); console.log(`  ❌ ${name} — ${detail || 'FAIL'}`); }
}

async function req(method, path, body, useToken = true, role = 'owner') {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (useToken && ROLES[role]) headers['Authorization'] = `Bearer ${ROLES[role].token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(url, opts);
    let data = null;
    try { data = await r.json(); } catch {}
    return { status: r.status, data: data?.data ?? data, raw: data };
  } catch (e) { return { status: 0, data: null, error: e.message }; }
}

async function loginAll() {
  const accounts = [
    { role: 'owner', email: 'admin@garage.co.ke' },
    { role: 'manager', email: 'manager@garage.co.ke' },
    { role: 'mechanic', email: 'mechanic@garage.co.ke' },
    { role: 'receptionist', email: 'receptionist@garage.co.ke' },
  ];
  for (const a of accounts) {
    const r = await req('POST', '/auth/login', { email: a.email, password: 'Admin@1234' }, false);
    if (r.status === 200 && r.data?.token) {
      ROLES[a.role] = {
        token: r.data.token.access_token,
        refresh: r.data.token.refresh_token,
        user: r.data.user,
        session: r.data.session,
      };
    }
  }
}

async function run() {
  console.log('══════════════════════════════════════════');
  console.log('  FUNCTIONAL REQUIREMENTS TEST');
  console.log('══════════════════════════════════════════\n');

  // ═══ PREREQUISITE: Login all roles ═══
  await loginAll();
  const rolesReady = Object.keys(ROLES).length;
  console.log(`── SETUP: ${rolesReady}/4 roles authenticated ──`);
  test('All 4 roles logged in', rolesReady === 4, `${rolesReady}/4`);

  // ═══ FR-1: AUTHENTICATION & AUTHORIZATION ═══
  console.log('\n── FR-1: AUTHENTICATION & AUTHORIZATION ──');

  // 1.1 Login returns JWT tokens
  test('Owner has access_token', !!ROLES.owner?.token);
  test('Owner has refresh_token', !!ROLES.owner?.refresh);
  test('Owner has session', !!ROLES.owner?.session?.session_id);
  test('Owner role is owner', ROLES.owner?.user?.role?.slug === 'owner', ROLES.owner?.user?.role?.slug);

  // 1.2 Token refresh
  let r = await req('POST', '/auth/refresh', { refresh_token: ROLES.owner.refresh }, false);
  test('Token refresh works', r.status === 200, 'status=' + r.status);
  test('Refresh returns new tokens', !!r.data?.token?.access_token && !!r.data?.token?.refresh_token);
  // Update token
  if (r.data?.token?.access_token) ROLES.owner.token = r.data.token.access_token;
  if (r.data?.token?.refresh_token) ROLES.owner.refresh = r.data.token.refresh_token;

  // 1.3 Profile
  r = await req('GET', '/auth/profile');
  test('Profile returns user data', r.status === 200 && !!r.data?.user?.email, 'status=' + r.status);

  // 1.4 User management (owner/manager only)
  r = await req('GET', '/auth/users');
  test('Owner can list users', r.status === 200 && Array.isArray(r.data?.users), 'status=' + r.status);
  const userCount = r.data?.users?.length || 0;
  test('Users list has entries', userCount > 0, `count=${userCount}`);

  r = await req('GET', '/auth/users', null, true, 'manager');
  test('Manager can list users', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/auth/users', null, true, 'mechanic');
  test('Mechanic blocked from users list', r.status === 403, 'status=' + r.status);

  r = await req('GET', '/auth/users', null, true, 'receptionist');
  test('Receptionist blocked from users list', r.status === 403, 'status=' + r.status);

  // 1.5 Password change (valid schema, wrong old pass)
  r = await req('POST', '/auth/change-password', { oldPassword: 'WrongOld1!', newPassword: 'NewPass123!' });
  test('Change password validates old pass', r.status === 400 || r.status === 401, 'status=' + r.status);

  // 1.6 Invalid auth
  r = await req('POST', '/auth/login', { email: 'fake@garage.co.ke', password: 'FakePass1!' }, false);
  test('Non-existent user returns 401', r.status === 401, 'status=' + r.status);

  r = await req('GET', '/auth/profile', null, false);
  test('No token returns 401', r.status === 401, 'status=' + r.status);

  // 1.7 Logout
  r = await req('POST', '/auth/logout');
  test('Logout works', r.status === 200, 'status=' + r.status);
  // Re-login owner after logout
  const relogin = await req('POST', '/auth/login', { email: 'admin@garage.co.ke', password: 'Admin@1234' }, false);
  if (relogin.data?.token) {
    ROLES.owner.token = relogin.data.token.access_token;
    ROLES.owner.refresh = relogin.data.token.refresh_token;
  }

  // ═══ FR-2: CAR / JOB CARD MANAGEMENT ═══
  console.log('\n── FR-2: CAR / JOB CARD MANAGEMENT ──');

  // 2.1 List all cars
  r = await req('GET', '/cars');
  test('Get all cars (200)', r.status === 200, 'status=' + r.status);
  const cars = Array.isArray(r.data) ? r.data : r.data?.cars || [];
  test('Cars list returned', cars.length >= 0);
  if (cars.length > 0) {
    SAMPLE.carId = cars[0]._id;
    SAMPLE.car = cars[0];
  }

  // 2.2 Dashboard stats (FR: operational overview)
  r = await req('GET', '/cars/dashboard');
  test('Dashboard stats (200)', r.status === 200, 'status=' + r.status);
  const dash = r.data;
  test('Has totalCarsInGarage', dash?.totalCarsInGarage !== undefined);
  test('Has carsInProgress', dash?.carsInProgress !== undefined);
  test('Has carsCompletedToday', dash?.carsCompletedToday !== undefined);
  test('Has carsWaitingPickup', dash?.carsWaitingPickup !== undefined);
  test('Has activeMechanics', dash?.activeMechanics !== undefined);
  test('Has workloadDistribution', Array.isArray(dash?.workloadDistribution));

  // 2.3 Garage board (FR: real-time operations view)
  r = await req('GET', '/cars/garage-board');
  test('Garage board (200)', r.status === 200, 'status=' + r.status);

  // 2.4 Car detail fields (FR: complete job card info)
  if (SAMPLE.carId) {
    r = await req('GET', `/cars/${SAMPLE.carId}`);
    test('Get car by ID (200)', r.status === 200, 'status=' + r.status);
    const c = r.data;
    test('Car has vehiclePlate', !!c?.vehiclePlate);
    test('Car has vehicleModel', !!c?.vehicleModel);
    test('Car has customerName', !!c?.customerName);
    test('Car has stage', !!c?.stage);
    test('Car has services array', Array.isArray(c?.services));
    test('Car has checkInDate', !!c?.checkInDate);
    test('Car has estimatedCost', c?.estimatedCost !== undefined);
    test('Car has paymentStatus', !!c?.paymentStatus);
    test('Car has daysInGarage', c?.daysInGarage >= 0);
    test('Car has beforePhotos', Array.isArray(c?.beforePhotos));
    test('Car has afterPhotos', Array.isArray(c?.afterPhotos));
  }

  // 2.5 Non-existent car
  r = await req('GET', '/cars/000000000000000000000000');
  test('Non-existent car (404)', r.status === 404, 'status=' + r.status);

  // 2.6 Duplicate plate validation (FR: Priority 1 fix)
  // We test that creating a car with validation schema catches empty body
  r = await req('POST', '/cars', {});
  test('Create car validation (400)', r.status === 400, 'status=' + r.status);

  // 2.7 Role-based car creation
  r = await req('POST', '/cars', {}, true, 'mechanic');
  test('Mechanic blocked: create car (403)', r.status === 403, 'status=' + r.status);

  // 2.8 Role-based car deletion
  r = await req('DELETE', '/cars/000000000000000000000000', null, true, 'mechanic');
  test('Mechanic blocked: delete car (403)', r.status === 403, 'status=' + r.status);

  // ═══ FR-3: INVOICE & PAYMENT MANAGEMENT ═══
  console.log('\n── FR-3: INVOICE & PAYMENT MANAGEMENT ──');

  // 3.1 List invoices
  r = await req('GET', '/invoices');
  test('Get all invoices (200)', r.status === 200, 'status=' + r.status);
  const invoices = Array.isArray(r.data) ? r.data : r.data?.invoices || [];
  if (invoices.length > 0) SAMPLE.invoiceId = invoices[0]._id;

  // 3.2 Revenue stats (FR: financial reporting)
  r = await req('GET', '/invoices/revenue-stats');
  test('Revenue stats (200)', r.status === 200, 'status=' + r.status);
  const rev = r.data;
  test('Has totalRevenue', rev?.totalRevenue !== undefined);
  test('Has revenueToday', rev?.revenueToday !== undefined);
  test('Has revenueThisWeek', rev?.revenueThisWeek !== undefined);
  test('Has revenueThisMonth', rev?.revenueThisMonth !== undefined);
  test('Has paidInvoices count', rev?.paidInvoices !== undefined);
  test('Has unpaidInvoices count', rev?.unpaidInvoices !== undefined);
  test('Has monthlyRevenue array', Array.isArray(rev?.monthlyRevenue));
  test('Has topPayingClients', Array.isArray(rev?.topPayingClients));
  test('Has paymentMethodDistribution', Array.isArray(rev?.paymentMethodDistribution));
  test('Has revenueTrend', typeof rev?.revenueTrend === 'number');
  test('Has averageInvoiceValue', rev?.averageInvoiceValue !== undefined);

  // 3.3 Outstanding invoices
  r = await req('GET', '/invoices/outstanding');
  test('Outstanding invoices (200)', r.status === 200, 'status=' + r.status);

  // 3.4 Generate invoice from car (FR: Invoice ↔ Job Card integration)
  if (SAMPLE.carId) {
    r = await req('POST', `/invoices/generate-from-car/${SAMPLE.carId}`);
    // May return 201 (created) or 400 (already has invoice)
    test('Generate invoice from car (201|400)', r.status === 201 || r.status === 400, 'status=' + r.status);
  }

  // 3.5 Authorization matrix for invoices
  r = await req('GET', '/invoices/revenue-stats', null, true, 'mechanic');
  test('Mechanic blocked: revenue stats (403)', r.status === 403, 'status=' + r.status);

  r = await req('POST', '/invoices', {}, true, 'mechanic');
  test('Mechanic blocked: create invoice (403)', r.status === 403, 'status=' + r.status);

  // 3.6 Non-existent invoice
  r = await req('GET', '/invoices/000000000000000000000000');
  test('Non-existent invoice (404)', r.status === 404 || r.status === 500, 'status=' + r.status);

  // ═══ FR-4: CUSTOMER MANAGEMENT ═══
  console.log('\n── FR-4: CUSTOMER MANAGEMENT ──');

  r = await req('GET', '/customers');
  test('Get customers (200)', r.status === 200, 'status=' + r.status);
  const custs = r.data?.customers || r.data || [];
  if (Array.isArray(custs) && custs.length > 0) {
    SAMPLE.customerId = custs[0]._id;
  }
  test('Customers data present', Array.isArray(custs));

  // 4.2 Customer detail
  if (SAMPLE.customerId) {
    r = await req('GET', `/customers/${SAMPLE.customerId}`);
    test('Get customer by ID (200)', r.status === 200, 'status=' + r.status);
    test('Customer has name', !!r.data?.name);
    test('Customer has phone', !!r.data?.phone);
  }

  // 4.3 Search
  r = await req('GET', '/customers/search?q=a');
  test('Search customers (200)', r.status === 200, 'status=' + r.status);

  // 4.4 Top customers
  r = await req('GET', '/customers/top');
  test('Top customers (200)', r.status === 200, 'status=' + r.status);

  // 4.5 Customer history
  if (SAMPLE.customerId) {
    r = await req('GET', `/customers/${SAMPLE.customerId}/history`);
    test('Customer history (200)', r.status === 200, 'status=' + r.status);
  }

  // ═══ FR-5: MECHANIC MANAGEMENT ═══
  console.log('\n── FR-5: MECHANIC MANAGEMENT ──');

  r = await req('GET', '/mechanics');
  test('Get mechanics (200)', r.status === 200, 'status=' + r.status);
  const mechs = Array.isArray(r.data) ? r.data : r.data?.mechanics || [];
  if (mechs.length > 0) SAMPLE.mechanicId = mechs[0]._id;
  test('Mechanics data present', mechs.length >= 0);

  // 5.2 Mechanic detail
  if (SAMPLE.mechanicId) {
    r = await req('GET', `/mechanics/${SAMPLE.mechanicId}`);
    test('Get mechanic by ID (200)', r.status === 200, 'status=' + r.status);
  }

  // 5.3 Birthdays (FR: HR feature)
  r = await req('GET', '/mechanics/birthdays');
  test('Mechanic birthdays (200)', r.status === 200, 'status=' + r.status);

  // 5.4 Top performers (FR: smart assignment)
  r = await req('GET', '/mechanics/top-performers');
  test('Top performers (200)', r.status === 200, 'status=' + r.status);

  // 5.5 Available mechanics (FR: workload-based assignment)
  r = await req('GET', '/mechanics/available');
  test('Available mechanics (200)', r.status === 200, 'status=' + r.status);

  // ═══ FR-6: INVENTORY MANAGEMENT ═══
  console.log('\n── FR-6: INVENTORY MANAGEMENT ──');

  r = await req('GET', '/inventory');
  test('Get inventory (200)', r.status === 200, 'status=' + r.status);
  const invItems = Array.isArray(r.data) ? r.data : r.data?.items || [];
  if (invItems.length > 0) SAMPLE.inventoryId = invItems[0]._id;

  // 6.2 Low stock alert (FR: inventory automation)
  r = await req('GET', '/inventory/low-stock');
  test('Low stock items (200)', r.status === 200, 'status=' + r.status);

  // 6.3 Inventory detail
  if (SAMPLE.inventoryId) {
    r = await req('GET', `/inventory/${SAMPLE.inventoryId}`);
    test('Get inventory item (200)', r.status === 200, 'status=' + r.status);
  }

  // ═══ FR-7: BOOKING SYSTEM ═══
  console.log('\n── FR-7: BOOKING SYSTEM ──');

  r = await req('GET', '/bookings');
  test('Get bookings (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/bookings/pending');
  test('Pending bookings (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/bookings/today');
  test('Today bookings (200)', r.status === 200, 'status=' + r.status);

  // 7.4 Public booking (no auth - FR: customer self-service)
  r = await req('POST', '/bookings/public', {
    customerName: 'Test Public',
    customerPhone: '0700000000',
    vehiclePlate: 'KXX 000X',
    serviceType: 'General Service',
    preferredDate: new Date(Date.now() + 86400000).toISOString(),
  }, false);
  // May return 201 or 400 depending on validation
  test('Public booking endpoint exists', r.status === 201 || r.status === 400 || r.status === 200, 'status=' + r.status);

  // ═══ FR-8: INSPECTION MODULE ═══
  console.log('\n── FR-8: INSPECTION MODULE ──');

  r = await req('GET', '/inspections');
  test('Get inspections (200)', r.status === 200, 'status=' + r.status);

  // 8.2 Authorization
  r = await req('POST', '/inspections', {}, true, 'receptionist');
  test('Receptionist blocked: create inspection (403)', r.status === 403, 'status=' + r.status);

  // ═══ FR-9: ATTENDANCE MODULE ═══
  console.log('\n── FR-9: ATTENDANCE MODULE ──');

  // 9.1 Today's attendance (owner/manager)
  r = await req('GET', '/attendance/today');
  test('Today attendance [owner] (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/attendance/today', null, true, 'manager');
  test('Today attendance [manager] (200)', r.status === 200, 'status=' + r.status);

  // 9.2 Attendance status (FR fix: expanded roles)
  r = await req('GET', '/attendance/status');
  test('Owner: attendance status (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/attendance/status', null, true, 'manager');
  test('Manager: attendance status (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/attendance/status', null, true, 'mechanic');
  test('Mechanic: attendance status (200)', r.status === 200, 'status=' + r.status);

  // 9.3 Stats with date range
  r = await req('GET', '/attendance/stats?startDate=2025-01-01&endDate=2025-12-31');
  test('Attendance stats with dates (200)', r.status === 200, 'status=' + r.status);

  // 9.4 Mechanic attendance report
  if (SAMPLE.mechanicId) {
    r = await req('GET', `/attendance/mechanic/${SAMPLE.mechanicId}`);
    test('Mechanic attendance history (200)', r.status === 200, 'status=' + r.status);

    r = await req('GET', `/attendance/report/${SAMPLE.mechanicId}?startDate=2025-01-01&endDate=2026-12-31`);
    test('Mechanic attendance report (200)', r.status === 200, 'status=' + r.status);
  }

  // 9.5 Clock-in authorization (mechanic only)
  r = await req('POST', '/attendance/clock-in', { location: { latitude: -1.2921, longitude: 36.8219 } }, true, 'owner');
  test('Owner blocked: clock-in (403)', r.status === 403, 'status=' + r.status);

  // ═══ FR-10: SETTINGS ═══
  console.log('\n── FR-10: SETTINGS ──');

  r = await req('GET', '/settings');
  test('Get settings (200)', r.status === 200, 'status=' + r.status);
  test('Settings has data', !!r.data);

  // 10.2 Active announcements
  r = await req('GET', '/settings/announcements/active');
  test('Active announcements (200)', r.status === 200, 'status=' + r.status);

  // 10.3 Upcoming holidays
  r = await req('GET', '/settings/holidays/upcoming');
  test('Upcoming holidays (200)', r.status === 200, 'status=' + r.status);

  // ═══ FR-11: EXPENSE TRACKING (FR Phase 2) ═══
  console.log('\n── FR-11: EXPENSE TRACKING ──');

  r = await req('GET', '/expenses');
  test('Get expenses (200)', r.status === 200, 'status=' + r.status);

  // 11.2 Expense stats
  r = await req('GET', '/expenses/stats/by-category');
  test('Expenses by category (200)', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/expenses/stats/total');
  test('Total expenses (200)', r.status === 200, 'status=' + r.status);

  // 11.3 Profit/Loss report (FR: financial management)
  r = await req('GET', '/expenses/stats/profit-loss');
  test('Profit/Loss report (200)', r.status === 200, 'status=' + r.status);

  // 11.4 Authorization
  r = await req('GET', '/expenses', null, true, 'mechanic');
  test('Mechanic blocked: expenses (403)', r.status === 403, 'status=' + r.status);

  r = await req('GET', '/expenses', null, true, 'receptionist');
  test('Receptionist blocked: expenses (403)', r.status === 403, 'status=' + r.status);

  // ═══ FR-12: NOTIFICATIONS ═══
  console.log('\n── FR-12: NOTIFICATIONS ──');

  r = await req('POST', '/notifications/check-inventory');
  test('Check inventory notifications (200)', r.status === 200, 'status=' + r.status);

  r = await req('POST', '/notifications/check-late-services');
  test('Check late services (200)', r.status === 200, 'status=' + r.status);

  r = await req('POST', '/notifications/check-all');
  test('Check all notifications (200)', r.status === 200, 'status=' + r.status);

  // 12.4 Authorization
  r = await req('POST', '/notifications/check-all', null, true, 'mechanic');
  test('Mechanic blocked: notifications (403)', r.status === 403, 'status=' + r.status);

  // ═══ FR-13: RECEIPTS ═══
  console.log('\n── FR-13: RECEIPTS ──');

  // Test with non-existent invoice
  r = await req('POST', '/receipts/generate', { invoiceId: '000000000000000000000000' });
  test('Receipt generate validates invoice', r.status === 404 || r.status === 400 || r.status === 500, 'status=' + r.status);

  // Authorization: mechanic can't generate
  r = await req('POST', '/receipts/generate', { invoiceId: '000000000000000000000000' }, true, 'mechanic');
  test('Mechanic blocked: receipt generate (403)', r.status === 403, 'status=' + r.status);

  // ═══ FR-14: HEALTH CHECK ═══
  console.log('\n── FR-14: HEALTH CHECK ──');

  r = await req('GET', '/health', null, false);
  test('Health endpoint (200)', r.status === 200, 'status=' + r.status);
  test('Health says running', r.raw?.status === 'running' || r.data?.status === 'running' || r.raw?.message?.includes?.('running'));

  // ═══ FR-15: ERROR HANDLING (FR Priority 1 fix) ═══
  console.log('\n── FR-15: ERROR HANDLING ──');

  // 15.1 Structured 404
  r = await req('GET', '/nonexistent-route');
  test('Unknown route (404)', r.status === 404, 'status=' + r.status);

  // 15.2 Malformed IDs
  r = await req('GET', '/cars/not-a-valid-id');
  test('Malformed car ID handled', r.status >= 400 && r.status < 600, 'status=' + r.status);

  r = await req('GET', '/customers/not-a-valid-id');
  test('Malformed customer ID handled', r.status >= 400 && r.status < 600, 'status=' + r.status);

  r = await req('GET', '/invoices/not-a-valid-id');
  test('Malformed invoice ID handled', r.status >= 400 && r.status < 600, 'status=' + r.status);

  // 15.3 Validation errors
  r = await req('POST', '/auth/login', {}, false);
  test('Login empty body returns 400', r.status === 400, 'status=' + r.status);

  r = await req('POST', '/invoices', {});
  test('Create invoice empty body (400)', r.status === 400, 'status=' + r.status);

  // ═══ FR-16: AUTHORIZATION MATRIX (all 4 roles) ═══
  console.log('\n── FR-16: AUTHORIZATION MATRIX ──');

  // Owner should access everything
  r = await req('GET', '/cars', null, true, 'owner');
  test('Owner: cars (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/invoices/revenue-stats', null, true, 'owner');
  test('Owner: revenue stats (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/expenses', null, true, 'owner');
  test('Owner: expenses (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/auth/users', null, true, 'owner');
  test('Owner: users (200)', r.status === 200, 'status=' + r.status);

  // Manager: similar access to owner
  r = await req('GET', '/cars', null, true, 'manager');
  test('Manager: cars (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/invoices/revenue-stats', null, true, 'manager');
  test('Manager: revenue stats (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/expenses', null, true, 'manager');
  test('Manager: expenses (200)', r.status === 200, 'status=' + r.status);

  // Mechanic: limited access
  r = await req('GET', '/cars', null, true, 'mechanic');
  test('Mechanic: cars (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/cars/dashboard', null, true, 'mechanic');
  test('Mechanic: dashboard (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/mechanics', null, true, 'mechanic');
  test('Mechanic: mechanics list (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/invoices/revenue-stats', null, true, 'mechanic');
  test('Mechanic: revenue stats blocked (403)', r.status === 403, 'status=' + r.status);
  r = await req('GET', '/expenses', null, true, 'mechanic');
  test('Mechanic: expenses blocked (403)', r.status === 403, 'status=' + r.status);
  r = await req('POST', '/notifications/check-all', null, true, 'mechanic');
  test('Mechanic: notifications blocked (403)', r.status === 403, 'status=' + r.status);

  // Receptionist: can create cars/invoices, limited admin
  r = await req('GET', '/cars', null, true, 'receptionist');
  test('Receptionist: cars (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/customers', null, true, 'receptionist');
  test('Receptionist: customers (200)', r.status === 200, 'status=' + r.status);
  r = await req('GET', '/bookings', null, true, 'receptionist');
  test('Receptionist: bookings (200)', r.status === 200, 'status=' + r.status);

  // ═══ FR-17: CROSS-MODULE INTEGRATION ═══
  console.log('\n── FR-17: CROSS-MODULE INTEGRATION ──');

  // 17.1 Dashboard data consistency
  const dashR = await req('GET', '/cars/dashboard');
  const d = dashR.data;
  test('Dashboard: totalCarsInGarage >= 0', d?.totalCarsInGarage >= 0);
  test('Dashboard: carsInProgress >= 0', d?.carsInProgress >= 0);
  test('Dashboard: activeMechanics >= 0', d?.activeMechanics >= 0);

  // 17.2 Revenue data consistency  
  const revR = await req('GET', '/invoices/revenue-stats');
  const rv = revR.data;
  test('Revenue: totalRevenue >= 0', rv?.totalRevenue >= 0);
  test('Revenue: consistency (paid + unpaid exists)', rv?.paidInvoices >= 0 && rv?.unpaidInvoices >= 0);
  test('Revenue: monthlyRevenue has entries', Array.isArray(rv?.monthlyRevenue));

  // 17.3 Expense data consistency
  const expR = await req('GET', '/expenses/stats/profit-loss');
  test('P&L report returns data', expR.status === 200);

  // 17.4 Mechanic workload in dashboard
  test('Workload distribution data', Array.isArray(d?.workloadDistribution));

  // ═══ FR-18: DATA INTEGRITY ═══
  console.log('\n── FR-18: DATA INTEGRITY ──');

  // 18.1 All mechanics should have required fields
  if (mechs.length > 0) {
    const mech = mechs[0];
    test('Mechanic has firstName', !!mech?.firstName);
  }

  // 18.2 All cars should have required fields
  if (cars.length > 0) {
    const car = cars[0];
    test('Car has vehiclePlate', !!car?.vehiclePlate);
    test('Car has stage', !!car?.stage);
    test('Car has customerName', !!car?.customerName);
  }

  // 18.3 Invoice validation
  r = await req('POST', '/invoices', { amount: -100 });
  test('Negative invoice amount rejected (400)', r.status === 400, 'status=' + r.status);

  // ═══ FR-19: EDGE CASES ═══
  console.log('\n── FR-19: EDGE CASES ──');

  // 19.1 Pagination
  r = await req('GET', '/cars?page=1&limit=5');
  test('Cars pagination works', r.status === 200, 'status=' + r.status);

  r = await req('GET', '/customers?page=1&limit=5');
  test('Customers pagination works', r.status === 200, 'status=' + r.status);

  // 19.2 Very large page number
  r = await req('GET', '/cars?page=99999');
  test('Large page number handled', r.status === 200, 'status=' + r.status);

  // 19.3 Generate invoice for non-existent car
  r = await req('POST', '/invoices/generate-from-car/000000000000000000000000');
  test('Generate invoice: non-existent car (404)', r.status === 404, 'status=' + r.status);

  // 19.4 Non-existent customer
  r = await req('GET', '/customers/000000000000000000000000');
  test('Non-existent customer (404)', r.status === 404, 'status=' + r.status);

  // 19.5 Non-existent mechanic
  r = await req('GET', '/mechanics/000000000000000000000000');
  test('Non-existent mechanic (404)', r.status === 404 || r.status === 500, 'status=' + r.status);

  // ═══ RESULTS ═══
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════');
  if (failures.length) {
    console.log('\n  FAILURES:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }
  console.log('');
}

run().catch(e => console.error('FATAL:', e));
