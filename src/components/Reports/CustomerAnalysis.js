import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/client";
import { buildSalesReportPayload, extractApiError } from "../../api/utils";
import { formatCurrency, toNumber, defaultDateRange } from "../../utils/format";
import "../../utils/chartSetup";
import { Bar } from "react-chartjs-2";
import { ReportLoading, ReportError, ReportEmpty, FilterBar } from "../common/ReportShell";
import PageHeader from "../PageHeader";

const { startDate: defaultStart, endDate: defaultEnd } = defaultDateRange();

function getScore(c) {
  const purchases  = toNumber(c.netPurchases);
  const invoices   = toNumber(c.invoiceCount);
  const paid       = toNumber(c.totalPaid);
  const total      = toNumber(c.totalPurchases);
  const due        = toNumber(c.totalDue);
  const pScore = Math.min(30, (purchases / 10000) * 30);
  const fScore = Math.min(20, (invoices / 10) * 20);
  const payScore = due === 0 ? 25 : total > 0 ? Math.min(25, (paid / total) * 25) : 0;
  return Math.min(100, pScore + fScore + payScore + 25);
}

function getBadge(score) {
  if (score >= 80) return { label: "VIP",     color: "#fbbf24" };
  if (score >= 60) return { label: "Premium", color: "#a78bfa" };
  if (score >= 40) return { label: "Regular", color: "#60a5fa" };
  return                  { label: "New",     color: "#86efac" };
}

const CustomerAnalysis = () => {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary]     = useState({});
  const [filters, setFilters]     = useState({ startDate: defaultStart, endDate: defaultEnd, limit: 10 });

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post("/sales/customer-analysis", buildSalesReportPayload(filters));
      const data = res.data?.data ?? {};
      setCustomers(data.customers ?? []); setSummary(data.summary ?? {});
    } catch (err) {
      setError(extractApiError(err, "Failed to load customer analysis"));
      setCustomers([]); setSummary({});
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  const chartData = useMemo(() => {
    if (!customers.length) return null;
    return {
      labels: customers.slice(0, 10).map((c) => c.customerName),
      datasets: [
        { label: "Net Purchases", data: customers.slice(0, 10).map((c) => toNumber(c.netPurchases)), backgroundColor: "rgba(99,102,241,0.85)", borderRadius: 6 },
        { label: "Total Paid",    data: customers.slice(0, 10).map((c) => toNumber(c.totalPaid)),    backgroundColor: "rgba(16,185,129,0.75)", borderRadius: 6 },
      ],
    };
  }, [customers]);

  if (loading) return <ReportLoading />;
  if (error)   return <ReportError message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Customer Analysis" subtitle="Customer performance and purchasing behavior" />

      <FilterBar onSubmit={(e) => { e.preventDefault(); fetchData(); }}>
        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">Start Date</label>
          <input type="date" name="startDate" className="form-control" value={filters.startDate} onChange={handleChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">End Date</label>
          <input type="date" name="endDate" className="form-control" value={filters.endDate} onChange={handleChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 100 }}>
          <label className="form-label">Limit</label>
          <select name="limit" className="form-control" value={filters.limit} onChange={handleChange}>
            {[5,10,20,50].map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Generate</button>
      </FilterBar>

      {!customers.length ? <ReportEmpty /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
            {[
              { label: "Customers",        value: summary.totalCustomers || customers.length, icon: "👥" },
              { label: "Total Revenue",    value: formatCurrency(summary.totalRevenue), icon: "💹", iconBg: "rgba(99,102,241,0.12)" },
              { label: "Avg / Customer",   value: formatCurrency(summary.averageRevenuePerCustomer), icon: "📊", iconBg: "rgba(16,185,129,0.12)" },
              { label: "Outstanding",      value: formatCurrency(summary.totalOutstanding), icon: "⚠️", iconBg: "rgba(239,68,68,0.12)", color: toNumber(summary.totalOutstanding) > 0 ? "var(--danger)" : "var(--success)" },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ minWidth: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span className="stat-card-label">{s.label}</span>
                  {s.icon && <div className="stat-card-icon" style={{ background: s.iconBg || "var(--bg-elevated)", flexShrink: 0 }}>{s.icon}</div>}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.5rem,2.5vw,2.2rem)", color: s.color || "var(--text-primary)", wordBreak: "break-word", lineHeight: 1.25, marginTop: "var(--space-2)" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {chartData && (
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header"><h3 className="card-title">Top Customers by Revenue</h3></div>
              <div style={{ height: 280, position: "relative" }}>
                <Bar data={chartData} options={{
                  indexAxis: "y", responsive: true, maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: "#94a3b8" } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.x)}` } },
                  },
                  scales: {
                    x: { ticks: { color: "#64748b", callback: (v) => formatCurrency(v) }, grid: { color: "#1e2030" } },
                    y: { ticks: { color: "#64748b" }, grid: { color: "#1e2030" } },
                  },
                }} />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><h3 className="card-title">Customer Details</h3></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Customer</th><th>Invoices</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => {
                    const score = Math.round(getScore(c));
                    const badge = getBadge(score);
                    return (
                      <tr key={i}>
                        <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>#{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{c.customerName}</td>
                        <td>{toNumber(c.invoiceCount)}</td>
                        <td style={{ color: "var(--success)", fontWeight: 500 }}>{formatCurrency(c.totalPurchases)}</td>
                        <td>{formatCurrency(c.totalPaid)}</td>
                        <td style={{ color: toNumber(c.totalDue) > 0 ? "var(--danger)" : "var(--text-muted)" }}>
                          {formatCurrency(c.totalDue)}
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 700 }}>{score}</span>
                            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: badge.color, background: `${badge.color}22`, padding: "2px 8px", borderRadius: "var(--r-full)" }}>
                              {badge.label}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerAnalysis;
