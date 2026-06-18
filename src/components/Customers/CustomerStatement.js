import React, { useState, useEffect, useRef } from "react";
import api from "../../api/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PageHeader from "../PageHeader";
import { Alert, Spinner, StatusBadge, Currency } from "../common/UI";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtCur = (a) => `EGP ${(a || 0).toFixed(2)}`;

const CustomerStatement = () => {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customers, setCustomers]               = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [statement, setStatement]               = useState(null);
  const [error, setError]                       = useState("");
  const [loading, setLoading]                   = useState(false);
  const [downloadingPDF, setDownloadingPDF]     = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const statementRef = useRef();

  useEffect(() => {
    api.get("/customers")
      .then((res) => setCustomers(res.data?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));
  }, []);

  const fetchStatement = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setLoading(true); setError("");
    try {
      const res = await api.post("/customers/statement", { name: selectedCustomer.trim() });
      setStatement(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching statement");
      setStatement(null);
    } finally { setLoading(false); }
  };

  const downloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await api.post("/customers/statement/file", { name: selectedCustomer.trim() }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = `statement-${selectedCustomer}.xlsx`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { setError("Failed to download Excel file."); }
    finally { setDownloadingExcel(false); }
  };

  const downloadPDF = async () => {
    if (!statementRef.current) return;
    setDownloadingPDF(true);
    try {
      const canvas = await html2canvas(statementRef.current, { scale: 2, backgroundColor: "#111218" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, h);
      pdf.save(`statement-${selectedCustomer}.pdf`);
    } catch { setError("Failed to generate PDF."); }
    finally { setDownloadingPDF(false); }
  };

  return (
    <div>
      <PageHeader title="Customer Statement" subtitle="View and export customer account statements" />

      <div className="card" style={{ maxWidth: 580, marginBottom: "var(--space-5)" }}>
        {error && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error" onClose={() => setError("")}>{error}</Alert></div>}

        <form onSubmit={fetchStatement}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="stmt-customer">Customer *</label>
              {loadingCustomers ? (
                <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
                  <Spinner size={14} /> Loading customers…
                </div>
              ) : (
                <select
                  id="stmt-customer"
                  className="form-control"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  required
                >
                  <option value="">Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || loadingCustomers || !selectedCustomer}>
              {loading ? <><Spinner size={14} /> Loading…</> : "View Statement"}
            </button>
          </div>
        </form>
      </div>

      {statement && (
        <div>
          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={downloadExcel} disabled={downloadingExcel}>
              {downloadingExcel ? <><Spinner size={14} /> Exporting…</> : "⬇ Export Excel"}
            </button>
            <button className="btn btn-secondary" onClick={downloadPDF} disabled={downloadingPDF}>
              {downloadingPDF ? <><Spinner size={14} /> Generating…</> : "⬇ Export PDF"}
            </button>
          </div>

          <div ref={statementRef} className="card invoice-card" style={{ maxWidth: 900 }}>
            {/* Header */}
            <div className="invoice-header">
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "2rem", fontFamily: "var(--font-display)" }}>
                  Account Statement
                </h2>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "1.3rem" }}>
                  Generated {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {statement.customer?.name || selectedCustomer}
                </div>
                {statement.customer?.email && (
                  <div style={{ fontSize: "1.3rem", color: "var(--text-secondary)" }}>{statement.customer.email}</div>
                )}
              </div>
            </div>

            {/* Summary boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
              {[
                { label: "Total Invoiced", value: fmtCur(statement.totalInvoiced), color: "var(--text-primary)" },
                { label: "Total Paid",     value: fmtCur(statement.totalPaid),     color: "var(--success)" },
                { label: "Total Returns",  value: fmtCur(statement.totalReturns),  color: "var(--warning)" },
                { label: "Balance Due",    value: fmtCur(statement.balanceDue),    color: statement.balanceDue > 0 ? "var(--danger)" : "var(--success)" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg-card-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "var(--space-4)" }}>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: "1.7rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Invoices */}
            {statement.invoices?.length > 0 && (
              <div style={{ marginBottom: "var(--space-5)" }}>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Invoices ({statement.invoices.length})
                </h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statement.invoices.map((inv) => (
                        <tr key={inv._id}>
                          <td style={{ color: "var(--brand-400)", fontWeight: 500 }}>{inv.invoiceNumber}</td>
                          <td style={{ color: "var(--text-secondary)" }}>{fmt(inv.issueDate)}</td>
                          <td><Currency amount={inv.totalAmount} /></td>
                          <td style={{ color: "var(--success)" }}><Currency amount={inv.amountPaid} /></td>
                          <td style={{ color: "var(--danger)" }}><Currency amount={inv.balanceDue} /></td>
                          <td><StatusBadge status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payments */}
            {statement.payments?.length > 0 && (
              <div style={{ marginBottom: "var(--space-5)" }}>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--space-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Payments ({statement.payments.length})
                </h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>Date</th><th>Amount</th><th>Invoice #</th><th>Method</th></tr>
                    </thead>
                    <tbody>
                      {statement.payments.map((p) => (
                        <tr key={p._id}>
                          <td style={{ color: "var(--text-secondary)" }}>{fmt(p.date)}</td>
                          <td style={{ color: "var(--success)" }}><Currency amount={p.amount} /></td>
                          <td style={{ color: "var(--text-secondary)" }}>{p.invoiceNumber || "—"}</td>
                          <td><span className="chip">{p.method || "—"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStatement;
