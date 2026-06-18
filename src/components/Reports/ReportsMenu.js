import React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../PageHeader";

const reports = [
  { id: 1, title: "Financial Report",    description: "Revenue, payments, outstanding balances, and profit margins",       icon: "💹", path: "/reports/financial",    color: "var(--brand-500)" },
  { id: 2, title: "Top Products",        description: "Best-selling products with return rates and net revenue",           icon: "🏆", path: "/reports/top-products", color: "var(--success)"   },
  { id: 3, title: "Customer Analysis",   description: "Customer performance, payments, and purchasing behavior",           icon: "👥", path: "/reports/customers",    color: "var(--warning)"   },
  { id: 4, title: "Sales by Category",   description: "Category-wise sales breakdown and performance metrics",             icon: "🗂️", path: "/reports/categories",   color: "#8b5cf6"          },
];

const ReportsMenu = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Reports" subtitle="Analytics and business intelligence" />
      <div className="dashboard-grid">
        {reports.map((r) => (
          <button key={r.id} type="button" className="module-card" onClick={() => navigate(r.path)}
            style={{ cursor: "pointer", border: "none", textAlign: "left" }}>
            <div className="module-card-icon" style={{ background: `${r.color}1a`, border: `1px solid ${r.color}33` }}>
              <span style={{ fontSize: "2rem" }}>{r.icon}</span>
            </div>
            <div className="module-card-body">
              <h2>{r.title}</h2>
              <p>{r.description}</p>
            </div>
            <span className="module-card-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportsMenu;
