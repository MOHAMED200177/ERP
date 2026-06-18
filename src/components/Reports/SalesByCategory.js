import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/client";
import { buildSalesReportPayload, extractApiError } from "../../api/utils";
import { formatCurrency, toNumber, defaultDateRange } from "../../utils/format";
import "../../utils/chartSetup";
import { Pie } from "react-chartjs-2";
import { ReportLoading, ReportError, ReportEmpty, FilterBar } from "../common/ReportShell";
import PageHeader from "../PageHeader";

const { startDate: defaultStart, endDate: defaultEnd } = defaultDateRange();
const COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];

const SalesByCategory = () => {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [categories, setCategories] = useState([]);
  const [summary, setSummary]       = useState({});
  const [filters, setFilters]       = useState({ startDate: defaultStart, endDate: defaultEnd });

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post("/sales/sales-by-category", buildSalesReportPayload(filters));
      const data = res.data?.data ?? {};
      setCategories(data.categories ?? []); setSummary(data.summary ?? {});
    } catch (err) {
      setError(extractApiError(err, "Failed to load category report"));
      setCategories([]); setSummary({});
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilterChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  const pieData = useMemo(() => {
    if (!categories.length) return null;
    return {
      labels: categories.map((c) => c.category),
      datasets: [{ data: categories.map((c) => toNumber(c.totalRevenue)), backgroundColor: COLORS, borderWidth: 0 }],
    };
  }, [categories]);

  if (loading) return <ReportLoading />;
  if (error)   return <ReportError message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Sales by Category" subtitle="Category-wise sales breakdown" />

      <FilterBar onSubmit={(e) => { e.preventDefault(); fetchData(); }}>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">Start Date</label>
          <input type="date" name="startDate" className="form-control" value={filters.startDate} onChange={handleFilterChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">End Date</label>
          <input type="date" name="endDate" className="form-control" value={filters.endDate} onChange={handleFilterChange} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Generate</button>
      </FilterBar>

      {!categories.length ? <ReportEmpty /> : (
        <>
          <div className="stats-row" style={{ marginBottom: "var(--space-5)" }}>
            {[
              { label: "Categories",    value: categories.length, icon: "🗂️" },
              { label: "Total Revenue", value: formatCurrency(summary.totalRevenue), icon: "💹", iconBg: "rgba(99,102,241,0.12)" },
              { label: "Top Category",  value: categories[0]?.category || "—", icon: "🏆", iconBg: "rgba(245,158,11,0.12)" },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className="stat-card-label">{s.label}</span>
                  <div className="stat-card-icon" style={{ background: s.iconBg || "var(--bg-elevated)" }}>{s.icon}</div>
                </div>
                <div className="stat-card-value" style={{ fontSize: i === 2 ? "1.8rem" : undefined }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
            {pieData && (
              <div className="card">
                <div className="card-header"><h3 className="card-title">Revenue Share</h3></div>
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pie data={pieData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 11 } } } },
                  }} />
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Category Breakdown</h3></div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Category</th><th>Products</th><th>Qty Sold</th><th>Revenue</th><th>Share</th></tr></thead>
                  <tbody>
                    {categories.map((c, i) => {
                      const total = toNumber(summary.totalRevenue);
                      const pct   = total ? ((toNumber(c.totalRevenue) / total) * 100).toFixed(1) : "0";
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontWeight: 500 }}>{c.category}</span>
                            </div>
                          </td>
                          <td>{toNumber(c.productCount) || "—"}</td>
                          <td>{toNumber(c.totalQuantitySold)}</td>
                          <td style={{ color: "var(--success)", fontWeight: 500 }}>{formatCurrency(c.totalRevenue)}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: COLORS[i % COLORS.length], transition: "width 0.5s ease" }} />
                              </div>
                              <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)", minWidth: 36 }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesByCategory;
