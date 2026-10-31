# ROUTING & GUARD SPECIFICATION — THE CADENCE LEDGER

## 1. Route Table & Role Permissions

| Path | Element | Allowed Roles | Guard Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | *Public* | None | Public overview, live tax calculator, plan catalog |
| `/login` | `LoginPage` | *Guest Only* | `GuestOnly` | Work email & password authentication |
| `/signup` | `SignupPage` | *Guest Only* | `GuestOnly` | Registration & entity onboarding |
| `/verify-otp` | `VerifyOtpPage` | *Guest Only* | `GuestOnly` | 6-box security code validation |
| `/forgot-password` | `ForgotPasswordPage` | *Guest Only* | `GuestOnly` | Password recovery initiation |
| `/reset-password` | `ResetPasswordPage` | *Guest Only* | `GuestOnly` | Password update with reset OTP |
| `/app` | `RoleHomeRedirect` | `admin`, `staff`, `customer` | `RequireAuth` | Redirects to `/app/dashboard` or `/app/portal` |
| `/app/dashboard` | `DashboardPage` | `admin`, `staff` | `RequireRole` | Executive KPI strip, payment chart, overdue table |
| `/app/subscriptions` | `SubscriptionsPage` | `admin`, `staff` | `RequireRole` | Contract table with status tabs & pagination |
| `/app/subscriptions/:id`| `SubscriptionDetailPage`| `admin`, `staff` | `RequireRole` | 5-stage lifecycle stepper, state transitions |
| `/app/invoices` | `InvoicesPage` | `admin`, `staff` | `RequireRole` | Statements list, balances due, outstanding tab |
| `/app/invoices/:id` | `InvoiceDetailPage` | `admin`, `staff` | `RequireRole` | Centered statement document, payment timeline |
| `/app/payments` | `PaymentsPage` | `admin`, `staff` | `RequireRole` | Cash & card settlement reconciliation ledger |
| `/app/billing` | `BillingConsolePage` | `admin`, `staff` | `RequireRole` | Idempotent automated recurring billing runs |
| `/app/plans` | `PlansPage` | `admin`, `staff` | `RequireRole` | Plan configuration & renewal behaviors |
| `/app/templates` | `TemplatesPage` | `admin`, `staff` | `RequireRole` | Quotation templates & 1-click contract creation |
| `/app/discounts` | `DiscountsPage` | `admin` | `RequireRole` | Promotional rules, usage limits, progress bars |
| `/app/taxes` | `TaxesPage` | `admin` | `RequireRole` | Statutory VAT, GST rates & calculations |
| `/app/staff` | `StaffPage` | `admin` | `RequireRole` | Internal operator accounts & governance |
| `/app/portal` | `CustomerPortalPage`| `customer` | `RequireRole` | Client active contracts & outstanding invoices |
| `/app/portal/invoices` | `InvoicesPage` | `customer` | `RequireRole` | Client invoice list (scoped to authenticated user) |
| `/app/portal/invoices/:id`| `InvoiceDetailPage`| `customer` | `RequireRole` | Client invoice statement & payment action |
| `/app/portal/payments` | `PaymentsPage` | `customer` | `RequireRole` | Client payment transaction ledger |
| `/403` | `ForbiddenPage` | *Any* | None | Designed access restricted page with safe link |
| `/404` | `NotFoundPage` | *Any* | None | Designed 404 statement not found |

---

## 2. Guard Logic & Session Rehydration

1. **Authentication Token (`cadence_token`):**
   - Stored in browser `localStorage`.
   - On application mount, `AuthContext` calls `GET /api/auth/me`.
   - If the token is valid, identity `{ _id, name, email, role }` is rehydrated.
   - If the token is expired or invalid (HTTP 401), the session is cleared and the user is redirected to `/login?next=<encoded_path>`.

2. **Role Authorization:**
   - Evaluated by `<RequireRole allowedRoles={[...]}>`.
   - If a customer attempts to access `/app/billing` or `/app/staff`, they are routed to `/403` (Forbidden).

3. **Data Scoping:**
   - Customers only receive their own contract, invoice, and payment records. The backend enforces `filter.customer_id = req.user._id`.

