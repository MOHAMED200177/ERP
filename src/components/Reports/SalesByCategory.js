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

  const handleChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  const pieData = useMemo(() => {
    if (!categories.length) return null;
    return {
      labels: categories.map((c) => c.category),
      datasets: [{ data: categories.map((c) => toNumber(c.totalRevenue)), backgroundColor: COLORS, borderWidth: 0 }],
    };
  }, [categories]);

  if (loading) return <ReportLoading />;
  if (error)   return <ReportError message={error} onRetry={fetchData} />;

  const totalRev = toNumber(summary.totalRevenue);

  return (
    <div>
      <PageHeader title="Sales by Category" subtitle="Category-wise sales breakdown" />

      <FilterBar onSubmit={(e) => { e.preventDefault(); fetchData(); }}>
        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">Start Date</label>
          <input type="date" name="startDate" className="form-control" value={filters.startDate} onChange={handleChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">End Date</label>
          <input type="date" name="endDate" className="form-control" value={filters.endDate} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Generate</button>
      </FilterBar>

      {!categories.length ? <ReportEmpty /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
            {[
              { label: "Categories",    value: categories.length, icon: "🗂️" },
              { label: "Total Revenue", value: formatCurrency(summary.totalRevenue), icon: "💹", iconBg: "rgba(99,102,241,0.12)" },
              { label: "Top Category",  value: categories[0]?.category || "—", icon: "🏆", iconBg: "rgba(245,158,11,0.12)" },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ minWidth: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span className="stat-card-label">{s.label}</span>
                  {s.icon && <div className="stat-card-icon" style={{ background: s.iconBg || "var(--bg-elevated)", flexShrink: 0 }}>{s.icon}</div>}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.4rem,2.2vw,2rem)", color: "var(--text-primary)", wordBreak: "break-word", lineHeight: 1.3, marginTop: "var(--space-2)" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
            {pieData && (
              <div className="card" style={{ minWidth: 0 }}>
                <div className="card-header"><h3 className="card-title">Revenue Share</h3></div>
                <div style={{ height: 260, position: "relative" }}>
                  <Pie data={pieData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 12 } },
                      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } },
                    },
                  }} />
                </div>
              </div>
            )}

            <div className="card" style={{ minWidth: 0 }}>
              <div className="card-header"><h3 className="card-title">Category Breakdown</h3></div>
              <div className="table-wrapper" style={{ maxHeight: 320 }}>
                <table className="data-table">
                  <thead><tr><th>Category</th><th>Products</th><th>Qty</th><th>Revenue</th><th>Share</th></tr></thead>
                  <tbody>
                    {categories.map((c, i) => {
                      const rev = toNumber(c.totalRevenue);
                      const pct = totalRev > 0 ? ((rev / totalRev) * 100).toFixed(1) : "0";
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
                          <td style={{ minWidth: 80 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ flex: 1, height: 5, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: COLORS[i % COLORS.length] }} />
                              </div>
                              <span style={{ fontSize: "1.1rem", color: "var(--text-secondary)", minWidth: 34, textAlign: "right" }}>{pct}%</span>
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
