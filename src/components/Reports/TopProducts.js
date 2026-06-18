import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/client";
import { buildSalesReportPayload, extractApiError } from "../../api/utils";
import { formatCurrency, toNumber, defaultDateRange } from "../../utils/format";
import "../../utils/chartSetup";
import { Bar } from "react-chartjs-2";
import { ReportLoading, ReportError, ReportEmpty, FilterBar } from "../common/ReportShell";
import PageHeader from "../PageHeader";

const { startDate: defaultStart, endDate: defaultEnd } = defaultDateRange();

const TopProducts = () => {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [products, setProducts] = useState([]);
  const [summary, setSummary]   = useState({});
  const [filters, setFilters]   = useState({ startDate: defaultStart, endDate: defaultEnd, limit: 10, sortBy: "quantity" });

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post("/sales/top-products", buildSalesReportPayload(filters));
      const data = res.data?.data ?? {};
      setProducts(data.products ?? []);
      setSummary(data.summary ?? {});
    } catch (err) {
      setError(extractApiError(err, "Failed to load top products"));
      setProducts([]); setSummary({});
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilterChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  const chartData = useMemo(() => {
    if (!products.length) return null;
    return {
      labels: products.map((p) => p.productName),
      datasets: [
        { label: "Net Revenue", data: products.map((p) => toNumber(p.netRevenue)), backgroundColor: "rgba(99,102,241,0.85)", borderRadius: 6 },
        { label: "Qty Sold",    data: products.map((p) => toNumber(p.netQuantitySold)), backgroundColor: "rgba(16,185,129,0.75)", borderRadius: 6, yAxisID: "y1" },
      ],
    };
  }, [products]);

  if (loading) return <ReportLoading />;
  if (error)   return <ReportError message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Top Products" subtitle="Best-selling products report" />

      <FilterBar onSubmit={(e) => { e.preventDefault(); fetchData(); }}>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">Start Date</label>
          <input type="date" name="startDate" className="form-control" value={filters.startDate} onChange={handleFilterChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">End Date</label>
          <input type="date" name="endDate" className="form-control" value={filters.endDate} onChange={handleFilterChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 120 }}>
          <label className="form-label">Limit</label>
          <select name="limit" className="form-control" value={filters.limit} onChange={handleFilterChange}>
            {[5,10,20,50].map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label className="form-label">Sort By</label>
          <select name="sortBy" className="form-control" value={filters.sortBy} onChange={handleFilterChange}>
            <option value="quantity">Quantity</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Generate</button>
      </FilterBar>

      {!products.length ? <ReportEmpty /> : (
        <>
          <div className="stats-row" style={{ marginBottom: "var(--space-5)" }}>
            {[
              { label: "Total Products",  value: summary.totalUniqueProducts || products.length, icon: "📦" },
              { label: "Total Revenue",   value: formatCurrency(summary.totalRevenue), icon: "💹", iconBg: "rgba(99,102,241,0.12)" },
              { label: "Total Sold",      value: summary.totalQuantitySold || "—", icon: "🔢", iconBg: "rgba(16,185,129,0.12)" },
              { label: "Total Returns",   value: summary.totalReturns || 0, icon: "↩️", iconBg: "rgba(239,68,68,0.12)" },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className="stat-card-label">{s.label}</span>
                  <div className="stat-card-icon" style={{ background: s.iconBg || "var(--bg-elevated)" }}>{s.icon}</div>
                </div>
                <div className="stat-card-value">{s.value}</div>
              </div>
            ))}
          </div>

          {chartData && (
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header"><h3 className="card-title">Revenue vs Quantity</h3></div>
              <div style={{ height: 300 }}>
                <Bar data={chartData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: "#94a3b8" } } },
                  scales: {
                    x: { ticks: { color: "#64748b" }, grid: { color: "#1e2030" } },
                    y:  { ticks: { color: "#64748b" }, grid: { color: "#1e2030" } },
                    y1: { position: "right", ticks: { color: "#64748b" }, grid: { drawOnChartArea: false } },
                  },
                }} />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><h3 className="card-title">Product Details</h3></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Gross Revenue</th><th>Returns</th><th>Net Revenue</th></tr></thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{p.productName}</td>
                      <td>{toNumber(p.totalQuantitySold)}</td>
                      <td style={{ color: "var(--success)" }}>{formatCurrency(p.grossRevenue)}</td>
                      <td style={{ color: "var(--danger)" }}>{toNumber(p.totalReturns) || 0}</td>
                      <td style={{ color: "var(--brand-400)", fontWeight: 600 }}>{formatCurrency(p.netRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopProducts;
