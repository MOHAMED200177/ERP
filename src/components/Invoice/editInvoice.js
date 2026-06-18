import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../PageHeader";
import { PageLoading, Alert, Spinner } from "../common/UI";

function normalize(raw) {
  if (!raw) return null;
  const c = raw.customer || {};
  const items = Array.isArray(raw.items)
    ? raw.items.map((l) => ({ product: typeof l.product === "string" ? l.product : l.product?.name || "", quantity: l.quantity ?? 1, price: l.price ?? l.unitPrice ?? "" }))
    : [{ product: "", quantity: 1, price: "" }];
  return { name: raw.name || c.name || "", email: raw.email || c.email || "", phone: raw.phone || c.phone || "", items, amount: raw.amount ?? "", discount: raw.discount ?? "", notes: raw.notes || "" };
}

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", phone: "", items: [{ product: "", quantity: 1, price: "" }], amount: "", discount: "", notes: "" });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, prodRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get("/products"),
        ]);
        const body = invRes.data?.data?.data ?? invRes.data?.data ?? invRes.data;
        setForm(normalize(body));
        setProducts(prodRes.data?.data?.data || []);
      } catch { setError("Failed to load invoice."); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const setField = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setItem  = (idx, field, value) => setForm((p) => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [field]: value } : it) }));
  const addItem  = () => setForm((p) => ({ ...p, items: [...p.items, { product: "", quantity: 1, price: "" }] }));
  const rmItem   = (idx) => { if (form.items.length > 1) setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.patch(`/invoices/${id}`, {
        name: form.name, email: form.email, phone: form.phone,
        items: form.items.map((it) => ({ product: it.product, quantity: Number(it.quantity), price: it.price !== "" ? Number(it.price) : undefined })),
        amount: parseFloat(form.amount), discount: parseFloat(form.discount) || 0, notes: form.notes,
      });
      setSuccess("Invoice updated!");
      setTimeout(() => navigate("/invoices/view"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update invoice.");
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoading message="Loading invoice…" />;

  return (
    <div className="form-page">
      <PageHeader title="Edit Invoice" />

      <div className="card">
        {error   && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error"   onClose={() => setError("")}>{error}</Alert></div>}
        {success && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="success">{success}</Alert></div>}

        <form onSubmit={handleSubmit}>
          {/* Customer */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Customer</div>
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <span className="form-section-title" style={{ margin: 0 }}>Items</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {form.items.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px auto", gap: "var(--space-3)", alignItems: "flex-end", padding: "var(--space-4)", background: "var(--bg-card-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Product *</label>
                    <select className="form-control" value={item.product} onChange={(e) => setItem(idx, "product", e.target.value)} required>
                      <option value="">Select…</option>
                      {products.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Qty</label>
                    <input className="form-control" type="number" min="1" value={item.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Price</label>
                    <input className="form-control" type="number" min="0" step="0.01" value={item.price} onChange={(e) => setItem(idx, "price", e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => rmItem(idx)} disabled={form.items.length === 1}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Pricing</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Amount (EGP) *</label>
                <input className="form-control" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setField("amount", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Discount (%)</label>
                <input className="form-control" type="number" min="0" max="100" step="0.01" value={form.discount} onChange={(e) => setField("discount", e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><Spinner size={14} /> Saving…</> : "Save Changes"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvoice;
