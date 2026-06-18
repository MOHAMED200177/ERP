import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../PageHeader";
import { Alert, Spinner, StatusBadge, Currency, ConfirmDialog } from "../common/UI";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const InvoiceLookup = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices]         = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedId, setSelectedId]     = useState("");
  const [invoice, setInvoice]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.get("/invoices")
      .then((r) => setInvoices(r.data?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingInvoices(false));
  }, []);

  const fetchInvoice = async (e) => {
    e.preventDefault();
    if (!selectedId) { setError("Please select an invoice"); return; }
    setLoading(true); setError(null); setInvoice(null);
    try {
      const res = await api.get(`/invoices/${selectedId}`);
      const inv = res.data?.data?.data ?? res.data?.data ?? res.data;
      if (inv) setInvoice(inv);
      else setError("Invoice not found");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch invoice.");
    } finally { setLoading(false); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/invoices/${invoice._id}`);
      setInvoice(null); setSelectedId(""); setConfirmDelete(false);
    } catch { setError("Failed to delete invoice."); setConfirmDelete(false); }
  };

  return (
    <div>
      <PageHeader title="Invoice Lookup" subtitle="Search and view invoice details" />

      <div className="card" style={{ maxWidth: 560, marginBottom: "var(--space-5)" }}>
        {error && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error" onClose={() => setError(null)}>{error}</Alert></div>}

        <form onSubmit={fetchInvoice} style={{ display: "flex", gap: "var(--space-3)" }}>
          {loadingInvoices ? (
            <div className="form-control" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
              <Spinner size={14} /> Loading invoices…
            </div>
          ) : (
            <select
              className="form-control"
              style={{ flex: 1 }}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select an invoice…</option>
              {invoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber || inv._id?.slice(-8)} — {inv.customer?.name || "?"} — EGP {(inv.totalAmount || 0).toFixed(2)}
                </option>
              ))}
            </select>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading || loadingInvoices || !selectedId}>
            {loading ? <Spinner size={14} /> : "View"}
          </button>
        </form>
      </div>

      {invoice && (
        <div className="invoice-card" style={{ maxWidth: 760 }}>
          <div className="invoice-header">
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "2rem", fontFamily: "var(--font-display)" }}>
                Invoice #{invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/invoices/edit/${invoice._id}`)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
            </div>
          </div>

          <div className="invoice-meta-grid">
            <div>
              <div className="invoice-meta-item-label">Customer</div>
              <div className="invoice-meta-item-value">{invoice.customer?.name || invoice.name || "—"}</div>
            </div>
            <div>
              <div className="invoice-meta-item-label">Issue Date</div>
              <div className="invoice-meta-item-value">{fmt(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="invoice-meta-item-label">Due Date</div>
              <div className="invoice-meta-item-value">{fmt(invoice.dueDate)}</div>
            </div>
            {invoice.customer?.email && (
              <div>
                <div className="invoice-meta-item-label">Email</div>
                <div className="invoice-meta-item-value">{invoice.customer.email}</div>
              </div>
            )}
            {invoice.customer?.phone && (
              <div>
                <div className="invoice-meta-item-label">Phone</div>
                <div className="invoice-meta-item-value">{invoice.customer.phone}</div>
              </div>
            )}
          </div>

          {invoice.items?.length > 0 && (
            <div className="table-wrapper" style={{ marginBottom: "var(--space-4)" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{typeof item.product === "object" ? item.product?.name : item.product}</td>
                      <td>{item.quantity}</td>
                      <td><Currency amount={item.price || item.unitPrice} /></td>
                      <td><Currency amount={(item.quantity || 1) * (item.price || item.unitPrice || 0)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="invoice-totals">
            <div className="invoice-total-row"><span>Subtotal</span><Currency amount={invoice.amount || invoice.totalAmount} /></div>
            {invoice.discount > 0 && (
              <div className="invoice-total-row"><span>Discount ({invoice.discount}%)</span><span style={{ color: "var(--success)" }}>- <Currency amount={(invoice.amount || 0) * (invoice.discount / 100)} /></span></div>
            )}
            <div className="invoice-total-row"><span>Amount Paid</span><span style={{ color: "var(--success)" }}><Currency amount={invoice.amountPaid} /></span></div>
            <div className="invoice-total-row grand">
              <span>Balance Due</span>
              <span style={{ color: invoice.balanceDue > 0 ? "var(--danger)" : "var(--success)" }}>
                <Currency amount={invoice.balanceDue} />
              </span>
            </div>
          </div>
        </div>
      )}

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

export default InvoiceLookup;
