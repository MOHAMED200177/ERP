import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../PageHeader";
import { PageLoading, Alert, StatusBadge, Currency, ConfirmDialog } from "../common/UI";

const isMongoId = (s) => typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const InvoiceRouteView = () => {
  const { invoiceRef } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!invoiceRef) { setError("Missing invoice reference"); setLoading(false); return; }
      const ref = decodeURIComponent(invoiceRef);
      setLoading(true); setError(null);
      try {
        if (isMongoId(ref)) {
          const { data } = await api.get(`/invoices/${ref}`);
          setInvoice(data?.data?.data ?? data?.data ?? data);
        } else {
          const { data } = await api.post("/invoices/info", { invoiceNumber: ref });
          const body = data?.data?.data ?? data?.data;
          if (body) setInvoice(body); else setError("Invoice not found");
        }
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load invoice");
      } finally { setLoading(false); }
    };
    run();
  }, [invoiceRef]);

  const doDelete = async () => {
    try {
      await api.delete(`/invoices/${invoice._id}`);
      navigate("/invoices/view");
    } catch { setError("Failed to delete invoice."); setConfirmDelete(false); }
  };

  if (loading) return <PageLoading message="Loading invoice…" />;
  if (error || !invoice) return (
    <div>
      <PageHeader title="Invoice" />
      <Alert type="error">{error || "Not found"}</Alert>
    </div>
  );

  return (
    <div>
      <PageHeader title={`Invoice #${invoice.invoiceNumber || ""}`} subtitle={invoice.customer?.name}
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/invoices/edit/${invoice._id}`)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
          </>
        }
      />

      <div className="invoice-card">
        <div className="invoice-header">
          <div>
            <div style={{ fontSize: "1.3rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Invoice</div>
            <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-display)", fontWeight: 700 }}>#{invoice.invoiceNumber}</div>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="invoice-meta-grid">
          <div><div className="invoice-meta-item-label">Customer</div><div className="invoice-meta-item-value">{invoice.customer?.name || invoice.name || "—"}</div></div>
          <div><div className="invoice-meta-item-label">Issue Date</div><div className="invoice-meta-item-value">{fmt(invoice.issueDate)}</div></div>
          <div><div className="invoice-meta-item-label">Due Date</div><div className="invoice-meta-item-value">{fmt(invoice.dueDate)}</div></div>
          {invoice.customer?.email && <div><div className="invoice-meta-item-label">Email</div><div className="invoice-meta-item-value">{invoice.customer.email}</div></div>}
          {invoice.customer?.phone && <div><div className="invoice-meta-item-label">Phone</div><div className="invoice-meta-item-value">{invoice.customer.phone}</div></div>}
        </div>

        {invoice.items?.length > 0 && (
          <div className="table-wrapper" style={{ marginBottom: "var(--space-4)" }}>
            <table className="data-table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
              <tbody>
                {invoice.items.map((it, i) => {
                  const name = typeof it.product === "object" ? it.product?.name : it.product;
                  const price = it.price || it.unitPrice || 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{name}</td>
                      <td>{it.quantity}</td>
                      <td><Currency amount={price} /></td>
                      <td><Currency amount={(it.quantity || 1) * price} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="invoice-totals">
          <div className="invoice-total-row"><span>Subtotal</span><Currency amount={invoice.amount || invoice.totalAmount} /></div>
          {invoice.discount > 0 && (
            <div className="invoice-total-row"><span>Discount ({invoice.discount}%)</span><span style={{ color: "var(--success)" }}>– <Currency amount={(invoice.amount || 0) * (invoice.discount / 100)} /></span></div>
          )}
          <div className="invoice-total-row"><span>Amount Paid</span><span style={{ color: "var(--success)" }}><Currency amount={invoice.amountPaid} /></span></div>
          <div className="invoice-total-row grand">
            <span>Balance Due</span>
            <span style={{ color: invoice.balanceDue > 0 ? "var(--danger)" : "var(--success)" }}><Currency amount={invoice.balanceDue} /></span>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ marginTop: "var(--space-5)", padding: "var(--space-4)", background: "var(--bg-card-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Notes</div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "1.3rem" }}>{invoice.notes}</p>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Invoice"
          message="This action cannot be undone."
          danger onConfirm={doDelete} onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default InvoiceRouteView;
