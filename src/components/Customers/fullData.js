import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../PageHeader";
import { PageLoading, Alert, StatusBadge, Currency } from "../common/UI";

const FullData = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get(`/customers/${id}`)
      .then((r) => setData(r.data?.data?.data ?? r.data?.data ?? r.data))
      .catch(() => setError("Failed to load customer data."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoading message="Loading customer…" />;
  if (error || !data) return <Alert type="error">{error || "Not found"}</Alert>;

  return (
    <div>
      <PageHeader title={data.name} subtitle="Customer full profile"
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/customers/edit-customer/${id}`)}>Edit</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate("/customers/view")}>All Customers</button>
          </>
        }
      />

      {/* Profile card */}
      <div className="card" style={{ maxWidth: 900, marginBottom: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: "var(--r-full)", background: "linear-gradient(135deg,var(--brand-600),var(--brand-800))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {data.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "1.9rem", fontFamily: "var(--font-display)" }}>{data.name}</h2>
            <div style={{ display: "flex", gap: "var(--space-4)", color: "var(--text-secondary)", fontSize: "1.3rem", flexWrap: "wrap" }}>
              {data.email && <span>✉ {data.email}</span>}
              {data.phone && <span>📞 {data.phone}</span>}
              {data.address && <span>📍 {data.address}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "var(--space-4)", marginTop: "var(--space-5)", paddingTop: "var(--space-5)", borderTop: "1px solid var(--border)" }}>
          {[
            { label: "Balance", value: <Currency amount={data.balance} />, color: (data.balance || 0) > 0 ? "var(--warning)" : "var(--text-primary)" },
            { label: "Outstanding", value: <Currency amount={data.outstandingBalance} />, color: (data.outstandingBalance || 0) > 0 ? "var(--danger)" : "var(--success)" },
            { label: "Invoices", value: data.invoice?.length || 0 },
            { label: "Returns", value: data.returns?.length || 0 },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--bg-card-2)", padding: "var(--space-4)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, color: s.color || "var(--text-primary)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      {data.invoice?.length > 0 && (
        <div className="card" style={{ maxWidth: 900, marginBottom: "var(--space-4)" }}>
          <div className="card-header"><h3 className="card-title">Invoices ({data.invoice.length})</h3></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Invoice #</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {data.invoice.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ color: "var(--brand-400)", fontWeight: 500 }}>{inv.invoiceNumber || inv._id?.slice(-8)}</td>
                    <td><Currency amount={inv.total || inv.totalAmount} /></td>
                    <td style={{ color: "var(--success)" }}><Currency amount={inv.paid || inv.amountPaid} /></td>
                    <td style={{ color: inv.balanceDue > 0 ? "var(--danger)" : "var(--success)" }}><Currency amount={inv.balance || inv.balanceDue} /></td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Returns */}
      {data.returns?.length > 0 && (
        <div className="card" style={{ maxWidth: 900 }}>
          <div className="card-header"><h3 className="card-title">Returns ({data.returns.length})</h3></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Return #</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {data.returns.map((r) => (
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
  );
};

export default FullData;
