import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { PageLoading, Alert, StatusBadge, Currency } from "./common/UI";

const PaymentDetails = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!routeId) { setError("No payment ID provided."); setLoading(false); return; }
    const cleanId = routeId.replace(/^:/, "").trim();
    api.get(`/payment/${cleanId}`)
      .then((r) => {
        const d = r.data?.data?.data || r.data?.data || r.data;
        setPayment(d?.payment || d);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load payment."))
      .finally(() => setLoading(false));
  }, [routeId]);

  if (loading) return <PageLoading message="Loading payment…" />;
  if (error || !payment) return <div><PageHeader title="Payment" /><Alert type="error">{error || "Not found"}</Alert></div>;

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div>
      <PageHeader title="Payment Details"
        actions={
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/payments/edit/${payment._id}`)}>Edit</button>
        }
      />
      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-5)" }}>
          {[
            { label: "Customer",   value: payment.customerName || payment.customer?.name || "—" },
            { label: "Amount",     value: <Currency amount={payment.amount} /> },
            { label: "Invoice #",  value: payment.invoice?.invoiceNumber || payment.invoiceNumber || payment.invoice || "—" },
            { label: "Date",       value: fmt(payment.date) },
            { label: "Method",     value: payment.method ? <span className="chip">{payment.method}</span> : "—" },
            { label: "Status",     value: <StatusBadge status={payment.status} /> },
          ].map((row, i) => (
            <div key={i}>
              <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{row.label}</div>
              <div style={{ fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 500 }}>{row.value}</div>
            </div>
          ))}
        </div>
        {payment.notes && (
          <div style={{ marginTop: "var(--space-5)", paddingTop: "var(--space-5)", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Notes</div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "1.3rem" }}>{payment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;
