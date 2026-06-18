import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "../PageHeader";
import { Alert, Spinner, StatusBadge, Currency, ConfirmDialog } from "../common/UI";

const CustomerData = () => {
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers]       = useState([]);
  const [loadingList, setLoadingList]   = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/customers")
      .then((r) => setCustomers(r.data?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  const fetchData = async () => {
    if (!customerName) return;
    setLoading(true); setError(null); setCustomerData(null);
    try {
      const res = await api.post("/customers/profile", { name: customerName });
      setCustomerData(res.data?.data?.data || res.data?.data || res.data);
    } catch {
      setError("Customer not found. Please check the name.");
    } finally { setLoading(false); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/customers/${customerData._id}`);
      setCustomerData(null); setCustomerName(""); setConfirmDelete(false);
    } catch { setError("Error deleting customer."); setConfirmDelete(false); }
  };

  return (
    <div>
      <PageHeader title="Customer Lookup" subtitle="Search and view customer profile" />

      <div className="card" style={{ maxWidth: 560, marginBottom: "var(--space-5)" }}>
        {error && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error" onClose={() => setError(null)}>{error}</Alert></div>}

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {loadingList ? (
            <div className="form-control" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
              <Spinner size={14} /> Loading…
            </div>
          ) : (
            <select
              className="form-control"
              style={{ flex: 1 }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={fetchData} disabled={loading || !customerName}>
            {loading ? <Spinner size={14} /> : "Search"}
          </button>
        </div>
      </div>

      {customerData && (
        <div>
          {/* Profile header */}
          <div className="card" style={{ maxWidth: 900, marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <div style={{ width: 52, height: 52, borderRadius: "var(--r-full)", background: "linear-gradient(135deg,var(--brand-600),var(--brand-800))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {customerData.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "2rem", fontFamily: "var(--font-display)" }}>{customerData.name}</h2>
                  <div style={{ display: "flex", gap: "var(--space-4)", color: "var(--text-secondary)", fontSize: "1.3rem", flexWrap: "wrap" }}>
                    {customerData.email && <span>✉ {customerData.email}</span>}
                    {customerData.phone && <span>📞 {customerData.phone}</span>}
                    {customerData.address && <span>📍 {customerData.address}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/customers/edit-customer/${customerData._id}`)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "var(--space-4)", marginTop: "var(--space-5)", paddingTop: "var(--space-5)", borderTop: "1px solid var(--border)" }}>
              {[
                { label: "Balance", value: <Currency amount={customerData.balance} />, color: (customerData.balance || 0) > 0 ? "var(--warning)" : "var(--text-primary)" },
                { label: "Outstanding", value: <Currency amount={customerData.outstandingBalance} />, color: (customerData.outstandingBalance || 0) > 0 ? "var(--danger)" : "var(--success)" },
                { label: "Invoices", value: customerData.invoice?.length || 0 },
                { label: "Returns", value: customerData.returns?.length || 0 },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg-card-2)", padding: "var(--space-4)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, color: s.color || "var(--text-primary)" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices */}
          {customerData.invoice?.length > 0 && (
            <div className="card" style={{ maxWidth: 900, marginBottom: "var(--space-4)" }}>
              <div className="card-header"><h3 className="card-title">Invoices</h3></div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Invoice #</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                  <tbody>
                    {customerData.invoice.map((inv) => (
                      <tr key={inv._id}>
                        <td style={{ color: "var(--brand-400)", fontWeight: 500 }}>{inv.invoiceNumber || inv._id?.slice(-8)}</td>
                        <td><Currency amount={inv.total || inv.totalAmount} /></td>
                        <td style={{ color: "var(--success)" }}><Currency amount={inv.paid || inv.amountPaid} /></td>
                        <td style={{ color: "var(--danger)" }}><Currency amount={inv.balance || inv.balanceDue} /></td>
                        <td><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Returns */}
          {customerData.returns?.length > 0 && (
            <div className="card" style={{ maxWidth: 900 }}>
              <div className="card-header"><h3 className="card-title">Returns</h3></div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Return #</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {customerData.returns.map((r) => (
                      <tr key={r._id}>
                        <td style={{ color: "var(--text-secondary)" }}>{r._id?.slice(-8)}</td>
                        <td><Currency amount={r.amount} /></td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Customer"
          message={`Are you sure you want to delete "${customerData?.name}"? This cannot be undone.`}
          danger onConfirm={doDelete} onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default CustomerData;
