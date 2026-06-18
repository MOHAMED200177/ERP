import React, { useState, useEffect } from "react";
import api from "../api/client";
import { extractApiError } from "../api/utils";
import PageHeader from "./PageHeader";
import { Alert, Spinner } from "./common/UI";

const REASONS = ["Defective", "Wrong Item", "Damaged", "Customer Request", "Expired", "Other"];

const ReturnForm = () => {
  const [form, setForm] = useState({ invoiceNumber: "", productName: "", name: "", quantity: "", reason: "" });
  const [invoices, setInvoices]   = useState([]);
  const [products, setProducts]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState(null);

  useEffect(() => {
    Promise.all([api.get("/invoices"), api.get("/product"), api.get("/customers")])
      .then(([inv, prod, cust]) => {
        setInvoices(inv.data?.data?.data || []);
        setProducts(prod.data?.data?.data || []);
        setCustomers(cust.data?.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const addReturn = async (e) => {
    e.preventDefault();
    if (!form.invoiceNumber || !form.productName || !form.name || !form.quantity || !form.reason) {
      setMessage({ type: "error", text: "All fields are required." }); return;
    }
    if (Number(form.quantity) <= 0) {
      setMessage({ type: "error", text: "Quantity must be greater than zero." }); return;
    }
    setLoading(true); setMessage(null);
    try {
      await api.post("/return/add", { ...form, quantity: Number(form.quantity) });
      setMessage({ type: "success", text: "Return created successfully!" });
      setForm({ invoiceNumber: "", productName: "", name: "", quantity: "", reason: "" });
    } catch (err) {
      setMessage({ type: "error", text: extractApiError(err, "Failed to create return.") });
    } finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="Add Return" subtitle="Process a product return" />
      <div className="card">
        {message && <div style={{ marginBottom: "var(--space-4)" }}><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}
        <form onSubmit={addReturn}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Invoice *</label>
              {loadingData ? (
                <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}><Spinner size={14} /> Loading…</div>
              ) : (
                <select name="invoiceNumber" className="form-control" value={form.invoiceNumber} onChange={handleChange} required>
                  <option value="">Select invoice…</option>
                  {invoices.map((inv) => (
                    <option key={inv._id} value={inv.invoiceNumber}>
                      {inv.invoiceNumber} — {inv.customer?.name || "?"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Customer *</label>
                {loadingData ? (
                  <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}><Spinner size={14} /> Loading…</div>
                ) : (
                  <select name="name" className="form-control" value={form.name} onChange={handleChange} required>
                    <option value="">Select customer…</option>
                    {customers.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Product *</label>
                {loadingData ? (
                  <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}><Spinner size={14} /> Loading…</div>
                ) : (
                  <select name="productName" className="form-control" value={form.productName} onChange={handleChange} required>
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input name="quantity" type="number" min="1" className="form-control" value={form.quantity} onChange={handleChange} placeholder="0" required />
              </div>
              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select name="reason" className="form-control" value={form.reason} onChange={handleChange} required>
                  <option value="">Select reason…</option>
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || loadingData}>
              {loading ? <><Spinner size={14} /> Processing…</> : "Submit Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnForm;
