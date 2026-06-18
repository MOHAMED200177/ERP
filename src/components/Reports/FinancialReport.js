import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/client";
import { buildSalesReportPayload, extractApiError } from "../../api/utils";
import { formatCurrency, defaultDateRange } from "../../utils/format";
import "../../utils/chartSetup";
import { Bar } from "react-chartjs-2";
import { ReportLoading, ReportError, ReportEmpty, ReportHeader, FilterBar } from "../common/ReportShell";
import PageHeader from "../PageHeader";

const { startDate: defaultStart, endDate: defaultEnd } = defaultDateRange();

const STAT_ICONS = {
  "Total Revenue":    { icon: "💹", bg: "rgba(99,102,241,0.12)"  },
  "Total Invoices":   { icon: "🧾", bg: "rgba(6,182,212,0.12)"   },
  "Total Payments":   { icon: "💳", bg: "rgba(16,185,129,0.12)"  },
  "Outstanding":      { icon: "⚠️", bg: "rgba(239,68,68,0.12)"   },
  "Net Sales":        { icon: "📈", bg: "rgba(245,158,11,0.12)"  },
  "Profit Margin":    { icon: "💰", bg: "rgba(99,102,241,0.12)"  },
};

const FinancialReport = () => {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters]     = useState({ startDate: defaultStart, endDate: defaultEnd });

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
  const handleSubmit = (e) => { e.preventDefault(); fetchReport(); };

  const chartData = useMemo(() => {
    if (!reportData?.monthlyBreakdown?.length) return null;
    const labels = reportData.monthlyBreakdown.map((i) => `${i._id.month}/${i._id.year}`);
    return {
      labels,
      datasets: [
        { label: "Revenue", data: reportData.monthlyBreakdown.map((i) => parseFloat(i.revenue) || 0), backgroundColor: "rgba(99,102,241,0.8)", borderColor: "rgba(99,102,241,1)", borderWidth: 1, borderRadius: 6 },
        { label: "Tax",     data: reportData.monthlyBreakdown.map((i) => parseFloat(i.tax)     || 0), backgroundColor: "rgba(6,182,212,0.7)",   borderColor: "rgba(6,182,212,1)",   borderWidth: 1, borderRadius: 6 },
      ],
    };
  }, [reportData]);

  const exportCSV = () => {
    if (!reportData?.summary) return;
    const rows = [["Metric","Value"],
      ["Total Revenue", reportData.summary.totalRevenue],
      ["Total Invoices", reportData.summary.totalInvoices],
      ["Total Payments", reportData.summary.totalPayments],
      ["Outstanding", reportData.summary.totalOutstanding],
      ["Net Sales", reportData.summary.netSales],
      ["Profit Margin", reportData.summary.profitMargin],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `financial-${filters.startDate}-${filters.endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <ReportLoading />;
  if (error)   return <ReportError message={error} onRetry={fetchReport} />;

  const summary = reportData?.summary;
  const hasData = summary && (parseFloat(summary.totalRevenue) > 0 || summary.totalInvoices > 0 || reportData?.monthlyBreakdown?.length > 0);

  const summaryCards = [
    { label: "Total Revenue",  value: formatCurrency(summary?.totalRevenue)  },
    { label: "Total Invoices", value: summary?.totalInvoices ?? 0            },
    { label: "Total Payments", value: formatCurrency(summary?.totalPayments) },
    { label: "Outstanding",    value: formatCurrency(summary?.totalOutstanding) },
    { label: "Net Sales",      value: formatCurrency(summary?.netSales)      },
    { label: "Profit Margin",  value: summary?.profitMargin || "0%"          },
  ];

  return (
    <div>
      <PageHeader title="Financial Report"
        actions={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Export PDF</button>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>Export CSV</button>
          </div>
        }
      />

      <FilterBar onSubmit={handleSubmit}>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">Start Date</label>
          <input type="date" name="startDate" className="form-control" value={filters.startDate} onChange={handleFilterChange} required />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">End Date</label>
          <input type="date" name="endDate" className="form-control" value={filters.endDate} onChange={handleFilterChange} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Generate Report</button>
      </FilterBar>

      {!hasData ? <ReportEmpty /> : (
        <>
          <div className="stats-row" style={{ marginBottom: "var(--space-6)" }}>
            {summaryCards.map((card) => {
              const meta = STAT_ICONS[card.label] || { icon: "📊", bg: "var(--bg-elevated)" };
              return (
                <div key={card.label} className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span className="stat-card-label">{card.label}</span>
                    <div className="stat-card-icon" style={{ background: meta.bg }}>{meta.icon}</div>
                  </div>
                  <div className="stat-card-value">{card.value}</div>
                </div>
              );
            })}
          </div>

          {chartData && (
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header">
                <h3 className="card-title">Monthly Revenue Breakdown</h3>
              </div>
              <div style={{ height: 320 }}>
                <Bar data={chartData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: "#94a3b8", font: { size: 12 } } } },
                  scales: {
                    x: { ticks: { color: "#64748b" }, grid: { color: "#1e2030" } },
                    y: { ticks: { color: "#64748b" }, grid: { color: "#1e2030" } },
                  },
                }} />
              </div>
            </div>
          )}

          {reportData?.monthlyBreakdown?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">Monthly Breakdown</h3></div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Month</th><th>Revenue</th><th>Tax</th><th>Invoices</th></tr></thead>
                  <tbody>
                    {reportData.monthlyBreakdown.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--text-secondary)" }}>{row._id.month}/{row._id.year}</td>
                        <td style={{ color: "var(--success)", fontWeight: 500 }}>{formatCurrency(row.revenue)}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{formatCurrency(row.tax)}</td>
                        <td>{row.count || "—"}</td>
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
