import React from "react";
import { useLocation, Routes, Route, Link } from "react-router-dom";
import PageHeader from "./PageHeader";

const icons = {
  "Add Category": "🏷️",
  "list Category": "📋",
  "Supplier Form": "🏭",
  "Suppliers List": "📃",
  "Create Product": "➕",
  "Products List": "📦",
  "Add Stock": "📥",
  "View Stock": "📊",
  "Create Invoice": "🧾",
  "View Invoices": "📑",
  "Invoice lookup": "🔍",
  "Add Payment": "💳",
  "View Payments": "💰",
  "Add Return": "↩️",
  "View Returns": "📤",
  "Add Customer": "👤",
  "View Customers": "👥",
  Customer: "🔎",
  "Statement Customers": "📋",
  "Reports Menu": "📊",
  "Financial Report": "💹",
  "Top Products": "🏆",
  "Customer Analysis": "📈",
  "Sales by Category": "🗂️",
};

const GenericPage = ({ title, basePath, links, routes, logo }) => {
  const location = useLocation();
  const isBase = location.pathname === basePath || location.pathname === basePath + "/";

  return (
    <div className="page-container">
      <div className="content-area">
        <PageHeader title={title} />

        {isBase && (
          <div className="page-nav-grid">
            {links.map((link) => (
              <Link
                key={link.to}
                to={`${basePath}/${link.to}`}
                className="page-nav-item"
              >
                <span style={{ fontSize: "1.8rem" }}>{icons[link.label] || "📄"}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}

        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={`${route.path}`}
              element={route.element}
            />
          ))}
        </Routes>
      </div>
    </div>
  );
};

export default GenericPage;
