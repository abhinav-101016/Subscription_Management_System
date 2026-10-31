/**
 * Believable, high-fidelity mock datasets for Cadence Subscription Management.
 * Used when VITE_USE_MOCKS=true or during backend offline mode.
 */

export const MOCK_CUSTOMERS = [
  { _id: '672458a4e8d3560000000001', name: 'Acme Enterprise Corp', email: 'billing@acme.com', phone: '+1 415 800 9200' },
  { _id: '672458a4e8d3560000000002', name: 'Linear Systems Inc', email: 'finance@linear.app', phone: '+1 650 492 8810' },
  { _id: '672458a4e8d3560000000003', name: 'Vercel Labs AG', email: 'accounts@vercel.com', phone: '+41 22 819 9000' },
  { _id: '672458a4e8d3560000000004', name: 'Mercury Financial LLC', email: 'ap@mercury.com', phone: '+1 212 901 3400' },
  { _id: '672458a4e8d3560000000005', name: 'Ramp Treasury Co', email: 'invoices@ramp.com', phone: '+1 415 320 1199' },
];

export const MOCK_PRODUCT_VARIANTS = [
  { _id: '672458a4e8d3570000000001', name: 'Platform Seat — Enterprise Tier', sku: 'SEAT-ENT-01', default_price: 120 },
  { _id: '672458a4e8d3570000000002', name: 'Dedicated Dedicated VPC Gateway', sku: 'INFRA-VPC-02', default_price: 450 },
  { _id: '672458a4e8d3570000000003', name: '24/7 Dedicated TAM Support SLA', sku: 'SLA-GOLD-03', default_price: 800 },
  { _id: '672458a4e8d3570000000004', name: 'Audit Log & SIEM Ingestion Add-on', sku: 'SEC-LOGS-04', default_price: 250 },
];

export const MOCK_PLANS = [
  {
    _id: '672458a4e8d3580000000001',
    name: 'Enterprise Scale (Annual)',
    billing_frequency: 'Yearly',
    minimum_quantity: 10,
    available_from: '2026-01-01T00:00:00.000Z',
    available_to: '2026-12-31T23:59:59.000Z',
    renewal_behavior: 'Renew',
    active: true,
  },
  {
    _id: '672458a4e8d3580000000002',
    name: 'Growth Infrastructure (Monthly)',
    billing_frequency: 'Monthly',
    minimum_quantity: 3,
    available_from: '2026-01-01T00:00:00.000Z',
    available_to: null,
    renewal_behavior: 'Renew',
    active: true,
  },
  {
    _id: '672458a4e8d3580000000003',
    name: 'Developer Starter (Monthly)',
    billing_frequency: 'Monthly',
    minimum_quantity: 1,
    available_from: '2026-02-01T00:00:00.000Z',
    available_to: null,
    renewal_behavior: 'Pause',
    active: true,
  },
  {
    _id: '672458a4e8d3580000000004',
    name: 'Legacy Cloud Tier (Quarterly)',
    billing_frequency: 'Monthly',
    minimum_quantity: 5,
    available_from: '2025-01-01T00:00:00.000Z',
    available_to: '2026-06-30T23:59:59.000Z',
    renewal_behavior: 'Auto-Close',
    active: false,
  },
];

export const MOCK_TEMPLATES = [
  {
    _id: '672458a4e8d3590000000001',
    name: 'Standard Growth Blueprint',
    default_plan_id: '672458a4e8d3580000000002',
    validity_days: 30,
    template_lines: [
      { product_variant_id: '672458a4e8d3570000000001', default_quantity: 5 },
      { product_variant_id: '672458a4e8d3570000000002', default_quantity: 1 },
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
  },
  {
    _id: '672458a4e8d3590000000002',
    name: 'Global Enterprise Custom MSA',
    default_plan_id: '672458a4e8d3580000000001',
    validity_days: 60,
    template_lines: [
      { product_variant_id: '672458a4e8d3570000000001', default_quantity: 25 },
      { product_variant_id: '672458a4e8d3570000000002', default_quantity: 2 },
      { product_variant_id: '672458a4e8d3570000000003', default_quantity: 1 },
    ],
    createdAt: '2026-10-20T14:30:00.000Z',
  },
];

export const MOCK_SUBSCRIPTIONS = [
  {
    _id: '672458a4e8d3600000000001',
    subscription_number: 'SUB-202610-1049',
    customer_id: '672458a4e8d3560000000001',
    customer: MOCK_CUSTOMERS[0],
    plan_id: '672458a4e8d3580000000001',
    plan: MOCK_PLANS[0],
    start_date: '2026-10-01T00:00:00.000Z',
    next_billing_date: '2026-11-01T00:00:00.000Z',
    last_billed_date: '2026-10-01T00:00:00.000Z',
    expiry_date: '2027-10-01T00:00:00.000Z',
    billing_interval_days: 30,
    payment_terms: 'Net 30',
    status: 'Active',
    lines: [
      { variant_id: '672458a4e8d3570000000001', quantity: 15, unit_price: 120, tax_amount: 324, total_amount: 2124 },
      { variant_id: '672458a4e8d3570000000002', quantity: 1, unit_price: 450, tax_amount: 81, total_amount: 531 },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    _id: '672458a4e8d3600000000002',
    subscription_number: 'SUB-202610-2184',
    customer_id: '672458a4e8d3560000000002',
    customer: MOCK_CUSTOMERS[1],
    plan_id: '672458a4e8d3580000000002',
    plan: MOCK_PLANS[1],
    start_date: '2026-10-18T00:00:00.000Z',
    next_billing_date: '2026-11-18T00:00:00.000Z',
    last_billed_date: null,
    expiry_date: '2027-04-18T00:00:00.000Z',
    billing_interval_days: 30,
    payment_terms: 'Immediate Payment',
    status: 'Confirmed',
    lines: [
      { variant_id: '672458a4e8d3570000000001', quantity: 5, unit_price: 120, tax_amount: 108, total_amount: 708 },
    ],
    createdAt: '2026-10-18T11:20:00.000Z',
  },
  {
    _id: '672458a4e8d3600000000003',
    subscription_number: 'SUB-202610-3392',
    customer_id: '672458a4e8d3560000000003',
    customer: MOCK_CUSTOMERS[2],
    plan_id: '672458a4e8d3580000000002',
    plan: MOCK_PLANS[1],
    start_date: '2026-10-25T00:00:00.000Z',
    next_billing_date: '2026-11-25T00:00:00.000Z',
    last_billed_date: null,
    expiry_date: '2027-10-25T00:00:00.000Z',
    billing_interval_days: 30,
    payment_terms: 'Net 15',
    status: 'Quotation',
    lines: [
      { variant_id: '672458a4e8d3570000000001', quantity: 10, unit_price: 110, tax_amount: 198, total_amount: 1298 },
      { variant_id: '672458a4e8d3570000000003', quantity: 1, unit_price: 800, tax_amount: 144, total_amount: 944 },
    ],
    createdAt: '2026-10-25T16:45:00.000Z',
  },
  {
    _id: '672458a4e8d3600000000004',
    subscription_number: 'SUB-202610-4410',
    customer_id: '672458a4e8d3560000000004',
    customer: MOCK_CUSTOMERS[3],
    plan_id: '672458a4e8d3580000000003',
    plan: MOCK_PLANS[2],
    start_date: '2026-10-29T00:00:00.000Z',
    next_billing_date: '2026-10-29T00:00:00.000Z',
    last_billed_date: null,
    expiry_date: null,
    billing_interval_days: 30,
    payment_terms: 'Immediate Payment',
    status: 'Draft',
    lines: [
      { variant_id: '672458a4e8d3570000000001', quantity: 2, unit_price: 120, tax_amount: 43.2, total_amount: 283.2 },
    ],
    createdAt: '2026-10-29T09:15:00.000Z',
  },
  {
    _id: '672458a4e8d3600000000005',
    subscription_number: 'SUB-202609-0821',
    customer_id: '672458a4e8d3560000000005',
    customer: MOCK_CUSTOMERS[4],
    plan_id: '672458a4e8d3580000000004',
    plan: MOCK_PLANS[3],
    start_date: '2026-09-01T00:00:00.000Z',
    next_billing_date: '2026-10-01T00:00:00.000Z',
    last_billed_date: '2026-09-01T00:00:00.000Z',
    expiry_date: '2026-10-01T00:00:00.000Z',
    billing_interval_days: 30,
    payment_terms: 'Net 30',
    status: 'Closed',
    lines: [
      { variant_id: '672458a4e8d3570000000002', quantity: 2, unit_price: 450, tax_amount: 162, total_amount: 1062 },
    ],
    createdAt: '2026-09-01T12:00:00.000Z',
  },
];

export const MOCK_INVOICES = [
  {
    _id: '672458a4e8d3610000000001',
    invoice_number: 'INV-202610-8901',
    subscription_id: '672458a4e8d3600000000001',
    customer_id: '672458a4e8d3560000000001',
    customer: MOCK_CUSTOMERS[0],
    billing_period_start: '2026-10-01T00:00:00.000Z',
    billing_period_end: '2026-10-31T00:00:00.000Z',
    subtotal: 2250,
    discount_total: 250,
    tax_total: 360,
    grand_total: 2360,
    amount_paid: 2360,
    amount_due: 0,
    status: 'Paid',
    tax_rule_applied: { name: 'Standard GST', percentage_rate: 18 },
    lines: [
      { variant_id: '672458a4e8d3570000000001', quantity: 15, unit_price: 120, total: 1800 },
      { variant_id: '672458a4e8d3570000000002', quantity: 1, unit_price: 450, total: 450 },
    ],
    createdAt: '2026-10-01T08:05:00.000Z',
  },
  {
    _id: '672458a4e8d3610000000002',
    invoice_number: 'INV-202610-9112',
    subscription_id: '672458a4e8d3600000000002',
    customer_id: '672458a4e8d3560000000002',
    customer: MOCK_CUSTOMERS[1],
    billing_period_start: '2026-10-18T00:00:00.000Z',
    billing_period_end: '2026-10-25T00:00:00.000Z',
    subtotal: 600,
    discount_total: 0,
    tax_total: 108,
    grand_total: 708,
    amount_paid: 300,
    amount_due: 408,
    status: 'Confirmed', // Overdue since billing_period_end < today
    tax_rule_applied: { name: 'Standard GST', percentage_rate: 18 },
    lines: [
      { variant_id: '672458a4e8d3570000000001', quantity: 5, unit_price: 120, total: 600 },
    ],
    createdAt: '2026-10-18T11:22:00.000Z',
  },
  {
    _id: '672458a4e8d3610000000003',
    invoice_number: 'INV-202610-9445',
    subscription_id: '672458a4e8d3600000000003',
    customer_id: '672458a4e8d3560000000003',
    customer: MOCK_CUSTOMERS[2],
    billing_period_start: '2026-10-25T00:00:00.000Z',
    billing_period_end: '2026-11-25T00:00:00.000Z',
    subtotal: 1900,
    discount_total: 100,
    tax_total: 324,
    grand_total: 2124,
    amount_paid: 0,
    amount_due: 2124,
    status: 'Draft',
    tax_rule_applied: { name: 'Standard GST', percentage_rate: 18 },
    lines: [
      { variant_id: '672458a4e8d3570000000001', quantity: 10, unit_price: 110, total: 1100 },
      { variant_id: '672458a4e8d3570000000003', quantity: 1, unit_price: 800, total: 800 },
    ],
    createdAt: '2026-10-25T16:48:00.000Z',
  },
];

export const MOCK_PAYMENTS = [
  {
    _id: '672458a4e8d3620000000001',
    invoice_id: '672458a4e8d3610000000001',
    method: 'Credit Card',
    amount: 2360,
    payment_date: '2026-10-02T14:15:00.000Z',
    notes: 'Paid via Stripe Corporate Card ending in 4242',
    invoice: { invoice_number: 'INV-202610-8901' },
  },
  {
    _id: '672458a4e8d3620000000002',
    invoice_id: '672458a4e8d3610000000002',
    method: 'Bank Transfer',
    amount: 300,
    payment_date: '2026-10-20T10:00:00.000Z',
    notes: 'Partial wire payment via Silicon Valley Bank / Wire ref #99812',
    invoice: { invoice_number: 'INV-202610-9112' },
  },
];

export const MOCK_TAX_RULES = [
  {
    _id: '672458a4e8d3630000000001',
    name: 'India GST (Combined)',
    percentage_rate: 18,
    active: true,
  },
  {
    _id: '672458a4e8d3630000000002',
    name: 'US California Sales Tax',
    percentage_rate: 8.25,
    active: false,
  },
  {
    _id: '672458a4e8d3630000000003',
    name: 'EU Standard VAT',
    percentage_rate: 20,
    active: false,
  },
];

export const MOCK_DISCOUNT_RULES = [
  {
    _id: '672458a4e8d3640000000001',
    name: 'Early Customer Launch (20%)',
    code: 'LAUNCH20',
    type: 'Percentage',
    value: 20,
    min_purchase_amount: 500,
    min_quantity: 1,
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_to: '2026-12-31T23:59:59.000Z',
    usage_limit: 100,
    times_used: 28,
    applicability: 'Whole_Subscription',
    active: true,
  },
  {
    _id: '672458a4e8d3640000000002',
    name: 'Enterprise VPC Discount ($150 Fixed)',
    code: 'ENTERPRISE150',
    type: 'Fixed',
    value: 150,
    min_purchase_amount: 400,
    min_quantity: 1,
    valid_from: '2026-06-01T00:00:00.000Z',
    valid_to: '2026-12-31T23:59:59.000Z',
    usage_limit: 50,
    times_used: 14,
    applicability: 'Specific_Product',
    applicable_product_id: '672458a4e8d3570000000002',
    active: true,
  },
];

export const MOCK_STAFF = [
  { _id: '672458a4e8d3650000000001', name: 'Eleanor Vance', email: 'eleanor@cadence.io', role: 'admin', createdAt: '2026-01-01T00:00:00.000Z' },
  { _id: '672458a4e8d3650000000002', name: 'Julian Hayes', email: 'julian@cadence.io', role: 'staff', createdAt: '2026-04-12T09:30:00.000Z' },
  { _id: '672458a4e8d3650000000003', name: 'Maya Thorne', email: 'maya@cadence.io', role: 'staff', createdAt: '2026-07-20T14:10:00.000Z' },
];

export const MOCK_DASHBOARD_SUMMARY = {
  date_filter: {
    start_date: '2026-10-01T00:00:00.000Z',
    end_date: '2026-10-31T23:59:59.000Z',
    reference_date: '2026-10-31T14:00:00.000Z',
  },
  active_subscriptions: {
    count: 24,
  },
  revenue: {
    total_collected: 48920.00,
    transaction_count: 38,
  },
  overdue_invoices: {
    count: 3,
    total_outstanding: 4108.00,
  },
  total_unpaid_summary: {
    count: 7,
    amount: 11250.00,
  },
  performance: {
    execution_time_ms: 3,
    optimized_indexes_applied: true,
  },
  revenue_trend: [
    { date: '10/01', revenue: 6400 },
    { date: '10/05', revenue: 4200 },
    { date: '10/10', revenue: 7800 },
    { date: '10/15', revenue: 9100 },
    { date: '10/20', revenue: 5600 },
    { date: '10/25', revenue: 8400 },
    { date: '10/31', revenue: 7420 },
  ],
};
