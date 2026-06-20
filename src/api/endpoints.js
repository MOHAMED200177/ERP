/**
 * Centralized API endpoint definitions
 * Mapped from ACC_ERP_Complete_Postman_Collection
 */

// ── Auth ──────────────────────────────────────────────────────────
export const AUTH = {
  login:      "/auth/login",
  register:   "/auth/register",
  me:         "/auth/me",
  createUser: "/auth/users",
};

// ── Customers ─────────────────────────────────────────────────────
export const CUSTOMERS = {
  list:           "/customers",
  create:         "/customers",
  byId:    (id)  => `/customers/${id}`,
  update:  (id)  => `/customers/${id}`,
  profile:        "/customers/profile",
  statement:      "/customers/statement",
  statementFile:  "/customers/statement/file",
  exportPDF:      "/customers/export/pdf",
  exportExcel:    "/customers/export/excel",
};

// ── Categories ────────────────────────────────────────────────────
export const CATEGORIES = {
  list:          "/categories",
  create:        "/categories",
  update: (id)  => `/categories/${id}`,
  delete: (id)  => `/categories/${id}`,
};

// ── Suppliers ─────────────────────────────────────────────────────
export const SUPPLIERS = {
  list:          "/supplier",
  create:        "/supplier",
  byId:   (id)  => `/supplier/${id}`,
  update: (id)  => `/supplier/${id}`,
  delete: (id)  => `/supplier/${id}`,
};

// ── Products ──────────────────────────────────────────────────────
export const PRODUCTS = {
  list:          "/product",
  create:        "/product",
  byId:   (id)  => `/product/${id}`,
  update: (id)  => `/product/${id}`,
  delete: (id)  => `/product/${id}`,
};

// ── Stock ─────────────────────────────────────────────────────────
export const STOCK = {
  list:          "/stock",
  create:        "/stock",
  byId:   (id)  => `/stock/${id}`,
  update: (id)  => `/stock/${id}`,
  delete: (id)  => `/stock/${id}`,
};

// ── Invoices ──────────────────────────────────────────────────────
export const INVOICES = {
  list:            "/invoices",
  create:          "/invoices/create",
  info:            "/invoices/info",
  byId:    (id)   => `/invoices/${id}`,
  update:  (id)   => `/invoices/${id}`,
  status:  (id)   => `/invoices/${id}/status`,
  delete:  (id)   => `/invoices/${id}`,
};

// ── Payments ──────────────────────────────────────────────────────
export const PAYMENTS = {
  list:          "/payment",
  create:        "/payment/add",
  byId:   (id)  => `/payment/${id}`,
  update: (id)  => `/payment/${id}`,
  delete: (id)  => `/payment/${id}`,
};

// ── Returns ───────────────────────────────────────────────────────
export const RETURNS = {
  list:          "/return",
  byId:   (id)  => `/return/${id}`,
  update: (id)  => `/return/${id}`,
  delete: (id)  => `/return/${id}`,
};

// ── Sales Reports (POST) ──────────────────────────────────────────
export const SALES = {
  financial:        "/sales/financial",
  topProducts:      "/sales/top-products",
  customerAnalysis: "/sales/customer-analysis",
  byCategory:       "/sales/sales-by-category",
};

// ── Analytics Reports (GET) ───────────────────────────────────────
export const REPORTS = {
  sales:               "/reports/sales",
  salesTrend:          "/reports/sales/trend",
  topProducts:         "/reports/sales/top-products",
  byCustomer:          "/reports/sales/by-customer",
  profit:              "/reports/sales/profit",
  inventory:           "/reports/inventory",
  inventoryMovement:   "/reports/inventory/movement",
  deadStock:           "/reports/inventory/dead-stock",
  mostUsed:            "/reports/inventory/most-used",
  topCustomers:        "/reports/customers/top",
  customerDebt:        "/reports/customers/debt",
  customerStatement:   (id) => `/reports/customers/${id}/statement`,
  supplierOutstanding: "/reports/suppliers/outstanding",
  supplierStatement:   (id) => `/reports/suppliers/${id}/statement`,
  financialSummary:    "/reports/financial-summary",
};

// ── Purchase Orders ───────────────────────────────────────────────
export const PURCHASE_ORDERS = {
  list:              "/purchase-orders",
  create:            "/purchase-orders",
  stats:             "/purchase-orders/stats",
  byId:      (id)  => `/purchase-orders/${id}`,
  receive:   (id)  => `/purchase-orders/${id}/receive`,
  payment:   (id)  => `/purchase-orders/${id}/payment`,
  cancel:    (id)  => `/purchase-orders/${id}/cancel`,
  delete:    (id)  => `/purchase-orders/${id}`,
};
