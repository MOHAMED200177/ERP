import React, { useState } from "react";
import "./index.css";
import logo from "./img/ICON.svg";
import {
  BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedLayout from "./components/Auth/ProtectedLayout";
import LoginPage from "./components/Auth/LoginPage";
import SignupPage from "./components/Auth/SignupPage";

// Lazy imports
const GenericPage     = React.lazy(() => import("./components/GenericPage"));
const InvoiceForm     = React.lazy(() => import("./components/Invoice/InvoiceForm"));
const Invoice         = React.lazy(() => import("./components/Invoice/Invoice"));
const InvoiceList     = React.lazy(() => import("./components/Invoice/InvoiceList"));
const InvoiceRouteView= React.lazy(() => import("./components/Invoice/InvoiceRouteView"));
const EditInvoice     = React.lazy(() => import("./components/Invoice/editInvoice"));
const StockForm       = React.lazy(() => import("./components/StockForm"));
const CreateProduct   = React.lazy(() => import("./components/CreateProduct"));
const ProductsList    = React.lazy(() => import("./components/ProductsList"));
const StockList       = React.lazy(() => import("./components/StockList"));
const PaymentForm     = React.lazy(() => import("./components/PaymentForm"));
const CategoryForm    = React.lazy(() => import("./components/CategoryForm"));
const Category        = React.lazy(() => import("./components/Category"));
const SupplierForm    = React.lazy(() => import("./components/SupplierForm"));
const SuppliersList   = React.lazy(() => import("./components/SuppliersList"));
const PaymentList     = React.lazy(() => import("./components/PaymentList"));
const ReturnList      = React.lazy(() => import("./components/returnList"));
const PaymentDetails  = React.lazy(() => import("./components/PaymentDetails"));
const EditPayment     = React.lazy(() => import("./components/EditPayment"));
const ReturnForm      = React.lazy(() => import("./components/ReturnForm"));
const CustomerStatement = React.lazy(() => import("./components/Customers/CustomerStatement"));
const Customer        = React.lazy(() => import("./components/Customers/creatCustomer"));
const Profile         = React.lazy(() => import("./components/Customers/Customer"));
const CustomerList    = React.lazy(() => import("./components/Customers/CustomerList"));
const EditCustomer    = React.lazy(() => import("./components/Customers/editCustomer"));
const ProductEdit     = React.lazy(() => import("./components/ProductEdit"));
const FullData        = React.lazy(() => import("./components/Customers/fullData"));
const ReportsMenu     = React.lazy(() => import("./components/Reports/ReportsMenu"));
const FinancialReport = React.lazy(() => import("./components/Reports/FinancialReport"));
const TopProducts     = React.lazy(() => import("./components/Reports/TopProducts"));
const CustomerAnalysis= React.lazy(() => import("./components/Reports/CustomerAnalysis"));
const SalesByCategory = React.lazy(() => import("./components/Reports/SalesByCategory"));

const LoginGate = () => {
  const { token } = useAuth();
  const requireAuth = process.env.REACT_APP_REQUIRE_AUTH !== "false";
  if (requireAuth && token) return <Navigate to="/" replace />;
  return <LoginPage />;
};

const SignupGate = () => {
  const { token } = useAuth();
  const requireAuth = process.env.REACT_APP_REQUIRE_AUTH !== "false";
  if (requireAuth && token) return <Navigate to="/" replace />;
  return <SignupPage />;
};

// ─── Sidebar navigation ───────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Operations",
    items: [
      { path: "/invoices", icon: "🧾", label: "Invoices" },
      { path: "/payments", icon: "💳", label: "Payments" },
      { path: "/returns",  icon: "↩️", label: "Returns"  },
      { path: "/customers",icon: "👥", label: "Customers" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { path: "/stock", icon: "📦", label: "Stock & Products" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { path: "/reports", icon: "📊", label: "Reports" },
    ],
  },
];

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const requireAuth = process.env.REACT_APP_REQUIRE_AUTH !== "false";

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`app-sidebar${open ? " open" : ""}`} aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <img src={logo} alt="ACC ERP" className="sidebar-logo" onError={(e) => { e.target.style.display = "none"; }} />
        <div>
          <div className="sidebar-brand-name">ACC ERP</div>
          <div className="sidebar-brand-sub">Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link${isActive(item.path) ? " active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        {requireAuth && isAuthenticated ? (
          <div>
            <div className="user-menu" onClick={() => {}}>
              <div className="user-avatar">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "User"}
                </div>
                <div className="user-role">{user?.email || "Admin"}</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: "var(--space-2)", justifyContent: "flex-start", gap: "var(--space-2)", fontSize: "1.3rem" }}
              onClick={() => { logout(); navigate("/login", { replace: true }); }}
            >
              <span>🚪</span> Sign out
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
};

// ─── Shell with Sidebar ────────────────────────────────────────────
const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        {/* Topbar (mobile only) */}
        <header className="app-topbar">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <Link to="/" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--text-primary)", textDecoration: "none" }}>
            ACC ERP
          </Link>
        </header>

        <main className="content-area">
          <React.Suspense
            fallback={
              <div className="page-loading">
                <div className="spinner" />
                <span>Loading…</span>
              </div>
            }
          >
            {children}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

// ─── Dashboard Home ────────────────────────────────────────────────
const MODULES = [
  { path: "/invoices",  icon: "🧾", label: "Invoices",         desc: "Create and manage sales invoices"        },
  { path: "/payments",  icon: "💳", label: "Payments",         desc: "Record and track customer payments"       },
  { path: "/returns",   icon: "↩️", label: "Returns",          desc: "Handle product returns and refunds"       },
  { path: "/customers", icon: "👥", label: "Customers",        desc: "Manage customer accounts and profiles"    },
  { path: "/stock",     icon: "📦", label: "Stock & Products", desc: "Inventory, products, suppliers, categories" },
  { path: "/reports",   icon: "📊", label: "Reports",          desc: "Financial analytics and business insights" },
];

const MainMenu = () => {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <p style={{ margin: "0 0 4px", fontSize: "1.3rem", color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 style={{ margin: 0, fontSize: "2.8rem", fontFamily: "var(--font-display)", fontWeight: 800 }}>
          Welcome back, {firstName} 👋
        </h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-secondary)", fontSize: "1.5rem" }}>
          Here's an overview of your business modules.
        </p>
      </div>

      <p className="dashboard-section-title">Modules</p>
      <div className="dashboard-grid">
        {MODULES.map((m) => (
          <Link key={m.path} to={m.path} className="module-card">
            <div className="module-card-icon">{m.icon}</div>
            <div className="module-card-body">
              <h2>{m.label}</h2>
              <p>{m.desc}</p>
            </div>
            <span className="module-card-arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ─── Pages config ──────────────────────────────────────────────────
const pagesConfig = [
  {
    path: "invoices", title: "Invoices",
    links: [
      { to: "create", label: "Create Invoice" },
      { to: "view",   label: "View Invoices"  },
      { to: "Invoice",label: "Invoice lookup" },
    ],
    routes: [
      { path: "create",          element: <InvoiceForm /> },
      { path: "view/:invoiceRef",element: <InvoiceRouteView /> },
      { path: "view",            element: <InvoiceList /> },
      { path: "Invoice",         element: <Invoice /> },
      { path: "edit/:id",        element: <EditInvoice /> },
    ],
  },
  {
    path: "stock", title: "Stock & Products",
    links: [
      { to: "category",      label: "Add Category"   },
      { to: "category-list", label: "list Category"  },
      { to: "SupplierForm",  label: "Supplier Form"  },
      { to: "SuppliersList", label: "Suppliers List" },
      { to: "Create Product",label: "Create Product" },
      { to: "ProductsList",  label: "Products List"  },
      { to: "create",        label: "Add Stock"      },
      { to: "view",          label: "View Stock"     },
    ],
    routes: [
      { path: "create",         element: <StockForm />     },
      { path: "category",       element: <CategoryForm />  },
      { path: "category-list",  element: <Category />      },
      { path: "SuppliersList",  element: <SuppliersList /> },
      { path: "SupplierForm",   element: <SupplierForm />  },
      { path: "view",           element: <StockList />     },
      { path: "Create Product", element: <CreateProduct /> },
      { path: "ProductsList",   element: <ProductsList />  },
      { path: "product/:id",    element: <ProductEdit />   },
    ],
  },
  {
    path: "payments", title: "Payments",
    links: [
      { to: "create", label: "Add Payment"   },
      { to: "view",   label: "View Payments" },
    ],
    routes: [
      { path: "create",   element: <PaymentForm />    },
      { path: "view/:id", element: <PaymentDetails /> },
      { path: "view",     element: <PaymentList />    },
      { path: "edit/:id", element: <EditPayment />    },
    ],
  },
  {
    path: "returns", title: "Returns",
    links: [
      { to: "create", label: "Add Return"  },
      { to: "view",   label: "View Returns"},
    ],
    routes: [
      { path: "create", element: <ReturnForm /> },
      { path: "view",   element: <ReturnList /> },
    ],
  },
  {
    path: "customers", title: "Customers",
    links: [
      { to: "create",    label: "Add Customer"        },
      { to: "view",      label: "View Customers"      },
      { to: "customer",  label: "Customer"            },
      { to: "statement", label: "Statement Customers" },
    ],
    routes: [
      { path: "create",           element: <Customer />          },
      { path: "statement",        element: <CustomerStatement /> },
      { path: "view",             element: <CustomerList />      },
      { path: "customer",         element: <Profile />           },
      { path: "edit-customer/:id",element: <EditCustomer />      },
      { path: "data-customer/:id",element: <FullData />          },
    ],
  },
  {
    path: "reports", title: "Reports",
    links: [
      { to: "menu",        label: "Reports Menu"     },
      { to: "financial",   label: "Financial Report" },
      { to: "top-products",label: "Top Products"     },
      { to: "customers",   label: "Customer Analysis"},
      { to: "categories",  label: "Sales by Category"},
    ],
    routes: [
      { path: "menu",        element: <ReportsMenu />      },
      { path: "financial",   element: <FinancialReport />  },
      { path: "top-products",element: <TopProducts />      },
      { path: "customers",   element: <CustomerAnalysis /> },
      { path: "categories",  element: <SalesByCategory />  },
    ],
  },
];

// ─── Routes ────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/login"  element={<LoginGate />}  />
    <Route path="/signup" element={<SignupGate />} />

    <Route element={<ProtectedLayout />}>
      <Route
        path="/"
        element={
          <AppShell>
            <MainMenu />
          </AppShell>
        }
      />

      {pagesConfig.map((page) => (
        <Route
          key={page.path}
          path={`/${page.path}/*`}
          element={
            <AppShell>
              <GenericPage
                title={page.title}
                basePath={`/${page.path}`}
                links={page.links}
                routes={page.routes}
              />
            </AppShell>
          }
        />
      ))}

      <Route path="/reports" element={<Navigate to="/reports/menu" replace />} />
    </Route>
  </Routes>
);

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
