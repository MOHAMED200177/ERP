import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/client";
import { buildSalesReportPayload, extractApiError } from "../../api/utils";
import { formatCurrency, toNumber, defaultDateRange } from "../../utils/format";
import "../../utils/chartSetup";
import { Bar } from "react-chartjs-2";
import { ReportLoading, ReportError, ReportEmpty, FilterBar } from "../common/ReportShell";
import PageHeader from "../PageHeader";

const { startDate: defaultStart, endDate: defaultEnd } = defaultDateRange();

/* Clean number card — no overflow, no .00 */
const MetricCard = ({ label, value, icon, iconBg, valueColor }) => (
  <div className="stat-card" style={{ minWidth: 0, overflow: "hidden" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
      <span className="stat-card-label" style={{ minWidth: 0, flex: 1 }}>{label}</span>
      {icon && (
        <div className="stat-card-icon" style={{ background: iconBg || "var(--bg-elevated)", flexShrink: 0 }}>
          {icon}
        </div>
      )}
    </div>
    <div style={{
      fontFamily: "var(--font-display)", fontWeight: 700,
      fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
      color: valueColor || "var(--text-primary)",
      wordBreak: "break-word", overflowWrap: "break-word",
      lineHeight: 1.25, marginTop: "var(--space-2)",
    }}>
      {value}
    </div>
  </div>
);

const FinancialReport = () => {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters]       = useState({ startDate: defaultStart, endDate: defaultEnd });

  const fetchReport = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post("/sales/financial", buildSalesReportPayload(filters));
      setReportData(res.data?.data ?? null);
    } catch (err) {
      setError(extractApiError(err, "Failed to load financial report"));
      setReportData(null);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleFilterChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  const chartData = useMemo(() => {
    if (!reportData?.monthlyBreakdown?.length) return null;
    const labels = reportData.monthlyBreakdown.map((i) => `${i._id?.month ?? ""}/${i._id?.year ?? ""}`);
    return {
      labels,
      datasets: [
        { label: "Revenue", data: reportData.monthlyBreakdown.map((i) => toNumber(i.revenue)), backgroundColor: "rgba(99,102,241,0.85)", borderColor: "#6366f1", borderWidth: 1, borderRadius: 6 },
        { label: "Tax",     data: reportData.monthlyBreakdown.map((i) => toNumber(i.tax)),     backgroundColor: "rgba(6,182,212,0.7)",   borderColor: "#06b6d4", borderWidth: 1, borderRadius: 6 },
      ],
    };
  }, [reportData]);

  const exportCSV = () => {
    const s = reportData?.summary;
    if (!s) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue",  toNumber(s.totalRevenue)],
      ["Total Invoices", toNumber(s.totalInvoices)],
      ["Total Payments", toNumber(s.totalPayments)],
      ["Outstanding",    toNumber(s.totalOutstanding)],
      ["Net Sales",      toNumber(s.netSales)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `financial-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
  };

  if (loading) return <ReportLoading />;
  if (error)   return <ReportError message={error} onRetry={fetchReport} />;

  const summary = reportData?.summary;
  const hasData = summary && (toNumber(summary.totalRevenue) > 0 || toNumber(summary.totalInvoices) > 0);

  return (
    <div>
      <PageHeader title="Financial Report" subtitle="Revenue, payments and outstanding balances"
        actions={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>⬇ PDF</button>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ CSV</button>
          </div>
        }
      />

      <FilterBar onSubmit={(e) => { e.preventDefault(); fetchReport(); }}>
        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">Start Date</label>
          <input type="date" name="startDate" className="form-control" value={filters.startDate} onChange={handleFilterChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">End Date</label>
          <input type="date" name="endDate" className="form-control" value={filters.endDate} onChange={handleFilterChange} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Generate</button>
      </FilterBar>

      {!hasData ? <ReportEmpty /> : (
        <>
          {/* ── KPI Cards — overflow-safe grid ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "var(--space-4)",
            marginBottom: "var(--space-6)",
          }}>
            <MetricCard label="Total Revenue"   value={formatCurrency(summary?.totalRevenue)}     icon="💹" iconBg="rgba(99,102,241,0.12)" />
            <MetricCard label="Total Invoices"  value={toNumber(summary?.totalInvoices)}           icon="🧾" iconBg="rgba(6,182,212,0.12)"  />
            <MetricCard label="Total Payments"  value={formatCurrency(summary?.totalPayments)}    icon="💳" iconBg="rgba(16,185,129,0.12)" valueColor="var(--success)" />
            <MetricCard label="Outstanding"     value={formatCurrency(summary?.totalOutstanding)} icon="⚠️" iconBg="rgba(239,68,68,0.12)"  valueColor={toNumber(summary?.totalOutstanding) > 0 ? "var(--danger)" : "var(--success)"} />
            <MetricCard label="Net Sales"       value={formatCurrency(summary?.netSales)}         icon="📈" iconBg="rgba(245,158,11,0.12)" />
            {summary?.profitMargin && (
              <MetricCard label="Profit Margin" value={summary.profitMargin}                      icon="💰" iconBg="rgba(99,102,241,0.12)" />
            )}
          </div>

          {/* ── Monthly Chart ── */}
          {chartData && (
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header"><h3 className="card-title">Monthly Breakdown</h3></div>
              <div style={{ height: 300, position: "relative" }}>
                <Bar data={chartData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: "#94a3b8", font: { size: 12 } } },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
                      },
                    },
                  },
                  scales: {
                    x: { ticks: { color: "#64748b" }, grid: { color: "#1e2030" } },
                    y: { ticks: { color: "#64748b", callback: (v) => formatCurrency(v) }, grid: { color: "#1e2030" } },
                  },
                }} />
              </div>
            </div>
          )}

          {/* ── Monthly Table ── */}
          {reportData?.monthlyBreakdown?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">Monthly Details</h3></div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr><th>Month / Year</th><th>Revenue</th><th>Tax</th><th>Invoices</th></tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyBreakdown.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                          {row._id?.month}/{row._id?.year}
                        </td>
                        <td style={{ color: "var(--success)", fontWeight: 600 }}>{formatCurrency(row.revenue)}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{formatCurrency(row.tax)}</td>
                        <td>{row.count ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReport;
