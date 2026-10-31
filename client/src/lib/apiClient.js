import {
  MOCK_PLANS,
  MOCK_TEMPLATES,
  MOCK_SUBSCRIPTIONS,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  MOCK_TAX_RULES,
  MOCK_DISCOUNT_RULES,
  MOCK_STAFF,
  MOCK_DASHBOARD_SUMMARY,
} from './mocks.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const FORCE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// State-machine transition rules (for mock simulation)
const VALID_SUBSCRIPTION_TRANSITIONS = {
  Draft: ['Quotation'],
  Quotation: ['Confirmed', 'Closed'],
  Confirmed: ['Active'],
  Active: ['Closed'],
  Closed: [],
};

const VALID_INVOICE_TRANSITIONS = {
  Draft: ['Confirmed'],
  Confirmed: ['Paid'],
  Paid: [],
};

// In-memory mock store so mutations survive in mock mode
let mockSubscriptions = [...MOCK_SUBSCRIPTIONS];
let mockInvoices = [...MOCK_INVOICES];
let mockPayments = [...MOCK_PAYMENTS];
let mockPlans = [...MOCK_PLANS];
let mockTemplates = [...MOCK_TEMPLATES];
let mockTaxRules = [...MOCK_TAX_RULES];
let mockDiscountRules = [...MOCK_DISCOUNT_RULES];
let mockStaff = [...MOCK_STAFF];

/**
 * Core HTTP Request Wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cadence_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  // If forced mock mode is enabled, resolve mocks immediately
  if (FORCE_MOCKS) {
    return handleMockRequest(endpoint, config);
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    // Automatic logout on 401 Unauthorized
    if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/signup')) {
      localStorage.removeItem('cadence_token');
      localStorage.removeItem('cadence_user');
      window.dispatchEvent(new CustomEvent('cadence-auth-logout'));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Preserve structured state machine violations
      const errorObj = new Error(data.message || `Request failed with status ${response.status}`);
      errorObj.status = response.status;
      errorObj.serverData = data;
      errorObj.isStateMachineViolation = data.error === 'State Machine Violation';
      errorObj.current_status = data.current_status;
      errorObj.requested_status = data.requested_status;
      errorObj.allowed_transitions = data.allowed_transitions || [];
      throw errorObj;
    }

    // Return the unwrapped data payload (or full object if data key missing)
    return data.data !== undefined ? data.data : data;
  } catch (error) {
    // If backend connection fails completely (ECONNREFUSED / offline), fall back seamlessly to mock data
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn(`[Cadence API] Backend offline at ${endpoint}. Serving realistic mock fixture.`);
      return handleMockRequest(endpoint, config);
    }
    throw error;
  }
}

/**
 * Realistic Mock Dispatcher
 */
async function handleMockRequest(endpoint, options) {
  // Artificial realistic micro-latency (40ms)
  await new Promise((r) => setTimeout(r, 40));

  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // 1. Auth Mock Endpoints
  if (endpoint.includes('/api/auth/login')) {
    const user = {
      _id: '672458a4e8d3650000000001',
      name: body.email?.includes('customer') ? 'Acme Billing Lead' : 'Eleanor Vance',
      email: body.email || 'admin@cadence.io',
      role: body.email?.includes('customer') ? 'customer' : body.email?.includes('staff') ? 'staff' : 'admin',
    };
    return { token: 'mock-jwt-cadence-token', user };
  }

  if (endpoint.includes('/api/auth/signup')) {
    return { message: 'OTP sent to email' };
  }

  if (endpoint.includes('/api/auth/verify-signup')) {
    return {
      token: 'mock-jwt-cadence-token',
      user: { _id: '672458a4e8d3650000000099', name: 'New User', email: body.email, role: 'staff' },
    };
  }

  // 2. Dashboard Summary
  if (endpoint.startsWith('/api/dashboard/summary')) {
    return MOCK_DASHBOARD_SUMMARY;
  }

  // 3. Plans
  if (endpoint === '/api/plans') {
    if (method === 'POST') {
      const newPlan = { _id: `plan_${Date.now()}`, ...body, active: body.active !== undefined ? body.active : true };
      mockPlans = [newPlan, ...mockPlans];
      return newPlan;
    }
    return mockPlans;
  }

  // 4. Quotation Templates
  if (endpoint === '/api/templates') {
    if (method === 'POST') {
      const newTmpl = { _id: `tmpl_${Date.now()}`, ...body, createdAt: new Date().toISOString() };
      mockTemplates = [newTmpl, ...mockTemplates];
      return newTmpl;
    }
    return mockTemplates;
  }

  // 5. Subscriptions
  if (endpoint.startsWith('/api/subscriptions/from-template')) {
    const tmpl = mockTemplates.find((t) => t._id === body.template_id);
    const newSub = {
      _id: `sub_${Date.now()}`,
      subscription_number: `SUB-${Date.now().toString().slice(-4)}`,
      customer_id: body.customer_id,
      customer: { name: 'New Customer Account', email: 'account@client.io' },
      plan_id: body.plan_id || tmpl?.default_plan_id || mockPlans[0]._id,
      plan: mockPlans[0],
      start_date: new Date().toISOString(),
      next_billing_date: new Date().toISOString(),
      billing_interval_days: 30,
      payment_terms: body.payment_terms || 'Immediate Payment',
      lines: (tmpl?.template_lines || []).map((l) => ({
        variant_id: l.product_variant_id,
        quantity: l.default_quantity,
        unit_price: 100,
        tax_amount: 18,
        total_amount: l.default_quantity * 100 * 1.18,
      })),
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };
    mockSubscriptions = [newSub, ...mockSubscriptions];
    return newSub;
  }

  if (endpoint.match(/\/api\/subscriptions\/([^/]+)\/status/)) {
    const subId = endpoint.split('/')[3];
    const sub = mockSubscriptions.find((s) => s._id === subId);
    if (!sub) throw new Error('Subscription not found');

    const allowed = VALID_SUBSCRIPTION_TRANSITIONS[sub.status] || [];
    if (!allowed.includes(body.status)) {
      const err = new Error(`Invalid state transition from '${sub.status}' to '${body.status}'`);
      err.isStateMachineViolation = true;
      err.current_status = sub.status;
      err.requested_status = body.status;
      err.allowed_transitions = allowed;
      throw err;
    }

    sub.status = body.status;
    return sub;
  }

  if (endpoint.match(/\/api\/subscriptions\/([^/]+)$/)) {
    const subId = endpoint.split('/')[3];
    const sub = mockSubscriptions.find((s) => s._id === subId);
    if (!sub) throw new Error('Subscription not found');
    return sub;
  }

  if (endpoint === '/api/subscriptions' || endpoint.startsWith('/api/subscriptions?')) {
    return mockSubscriptions;
  }

  // 6. Invoices
  if (endpoint === '/api/invoices/outstanding') {
    return mockInvoices.filter((i) => i.status !== 'Paid' && i.amount_due > 0);
  }

  if (endpoint.match(/\/api\/invoices\/([^/]+)\/payments/)) {
    const invId = endpoint.split('/')[3];
    return mockPayments.filter((p) => p.invoice_id === invId);
  }

  if (endpoint.match(/\/api\/invoices\/([^/]+)\/status/)) {
    const invId = endpoint.split('/')[3];
    const inv = mockInvoices.find((i) => i._id === invId);
    if (!inv) throw new Error('Invoice not found');

    const allowed = VALID_INVOICE_TRANSITIONS[inv.status] || [];
    if (!allowed.includes(body.status)) {
      const err = new Error(`Invalid state transition from '${inv.status}' to '${body.status}'`);
      err.isStateMachineViolation = true;
      err.current_status = inv.status;
      err.requested_status = body.status;
      err.allowed_transitions = allowed;
      throw err;
    }

    inv.status = body.status;
    return inv;
  }

  if (endpoint.match(/\/api\/invoices\/([^/]+)$/)) {
    const invId = endpoint.split('/')[3];
    const inv = mockInvoices.find((i) => i._id === invId);
    if (!inv) throw new Error('Invoice not found');
    return inv;
  }

  if (endpoint === '/api/invoices' || endpoint.startsWith('/api/invoices?')) {
    return mockInvoices;
  }

  // 7. Payments
  if (endpoint === '/api/payments') {
    if (method === 'POST') {
      const inv = mockInvoices.find((i) => i._id === body.invoice_id);
      if (!inv) throw new Error('Invoice not found');
      if (inv.status === 'Paid') throw new Error('Cannot record payment for an invoice that is already Paid');
      if (body.amount > inv.amount_due) {
        throw new Error(`Payment amount of $${body.amount} exceeds remaining balance of $${inv.amount_due}`);
      }

      const newPay = {
        _id: `pay_${Date.now()}`,
        ...body,
        payment_date: body.payment_date || new Date().toISOString(),
        invoice: { invoice_number: inv.invoice_number },
      };
      mockPayments = [newPay, ...mockPayments];

      inv.amount_paid = Number(((inv.amount_paid || 0) + Number(body.amount)).toFixed(2));
      inv.amount_due = Math.max(0, Number((inv.grand_total - inv.amount_paid).toFixed(2)));
      if (inv.amount_due === 0) {
        inv.status = 'Paid';
      }

      return { payment: newPay, invoice: inv };
    }
    return mockPayments;
  }

  // 8. Billing Run
  if (endpoint === '/api/billing/run') {
    return {
      reference_date: body.reference_date || new Date().toISOString(),
      total_due_subscriptions: mockSubscriptions.filter((s) => s.status === 'Active').length,
      invoices_generated: 1,
      invoices_skipped: 1,
      tax_rule_applied: { name: 'Standard GST', percentage_rate: 18 },
      generated_invoices: [mockInvoices[0]],
      skipped_invoices: [{ reason: 'Invoice already generated for current period' }],
    };
  }

  if (endpoint === '/api/billing/apply-discounts') {
    const inv = mockInvoices.find((i) => i._id === body.invoice_id);
    if (inv) {
      inv.discount_total = 50;
      inv.grand_total = Math.max(0, inv.subtotal - inv.discount_total + inv.tax_total);
      inv.amount_due = Math.max(0, inv.grand_total - inv.amount_paid);
    }
    return {
      applied: true,
      message: 'Discount successfully simulated',
      discount_rule: mockDiscountRules[0],
      invoice: inv,
    };
  }

  // 9. Taxes
  if (endpoint === '/api/taxes') {
    if (method === 'POST') {
      const newTax = { _id: `tax_${Date.now()}`, ...body };
      mockTaxRules = [newTax, ...mockTaxRules];
      return newTax;
    }
    return mockTaxRules;
  }

  // 10. Discounts
  if (endpoint === '/api/discounts') {
    if (method === 'POST') {
      const newDiscount = { _id: `disc_${Date.now()}`, times_used: 0, ...body };
      mockDiscountRules = [newDiscount, ...mockDiscountRules];
      return newDiscount;
    }
    return mockDiscountRules;
  }

  if (endpoint.match(/\/api\/discounts\/([^/]+)$/)) {
    const discId = endpoint.split('/')[3];
    const disc = mockDiscountRules.find((d) => d._id === discId);
    if (method === 'PATCH') {
      Object.assign(disc, body);
    }
    return disc;
  }

  // 11. Admin Staff
  if (endpoint === '/api/admin/staff') {
    if (method === 'POST') {
      const newStaff = { _id: `staff_${Date.now()}`, role: 'staff', createdAt: new Date().toISOString(), ...body };
      mockStaff = [newStaff, ...mockStaff];
      return newStaff;
    }
    return { staff: mockStaff };
  }

  return {};
}
