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
  const purchases = toNumber(c.netPurchases);
  const invoices  = toNumber(c.invoiceCount);
  const paid      = toNumber(c.totalPaid);
  const total     = toNumber(c.totalPurchases);
  const due       = toNumber(c.totalDue);
  const purchaseScore  = Math.min(30, (purchases / 10000) * 30);
  const frequencyScore = Math.min(20, (invoices / 10) * 20);
  const paymentScore   = due === 0 ? 25 : total > 0 ? Math.min(25, (paid / total) * 25) : 0;
  return Math.min(100, purchaseScore + frequencyScore + paymentScore + 25);
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

  const handleFilterChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

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
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Generate</button>
      </FilterBar>

      {!customers.length ? <ReportEmpty /> : (
        <>
          <div className="stats-row" style={{ marginBottom: "var(--space-5)" }}>
            {[
              { label: "Total Customers",   value: summary.totalCustomers || customers.length, icon: "👥" },
              { label: "Total Revenue",     value: formatCurrency(summary.totalRevenue), icon: "💹", iconBg: "rgba(99,102,241,0.12)" },
              { label: "Avg per Customer",  value: formatCurrency(summary.averageRevenuePerCustomer), icon: "📊", iconBg: "rgba(16,185,129,0.12)" },
              { label: "Outstanding",       value: formatCurrency(summary.totalOutstanding), icon: "⚠️", iconBg: "rgba(239,68,68,0.12)" },
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
              <div className="card-header"><h3 className="card-title">Top Customers by Revenue</h3></div>
              <div style={{ height: 300 }}>
                <Bar data={chartData} options={{
                  responsive: true, maintainAspectRatio: false, indexAxis: "y",
                  plugins: { legend: { labels: { color: "#94a3b8" } } },
                  scales: {
                    x: { ticks: { color: "#64748b" }, grid: { color: "#1e2030" } },
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
                  <tr><th>Rank</th><th>Customer</th><th>Invoices</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Score</th></tr>
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
                        <td style={{ color: "var(--success)" }}>{formatCurrency(c.totalPurchases)}</td>
                        <td>{formatCurrency(c.totalPaid)}</td>
                        <td style={{ color: toNumber(c.totalDue) > 0 ? "var(--danger)" : "var(--text-muted)" }}>{formatCurrency(c.totalDue)}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{score}</span>
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
