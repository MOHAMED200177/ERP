import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { PURCHASE_ORDERS, SUPPLIERS, PRODUCTS } from "../../api/endpoints";
import PageHeader from "../PageHeader";
import { Alert, Spinner } from "../common/UI";

const emptyItem = { product: "", quantity: 1, unitCost: "" };

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ supplier: "", expectedDelivery: "", notes: "", items: [{ ...emptyItem }] });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    Promise.all([api.get(SUPPLIERS.list), api.get(PRODUCTS.list)])
      .then(([s, p]) => {
        setSuppliers(s.data?.data?.data ?? s.data?.data ?? []);
        setProducts(p.data?.data?.data ?? p.data?.data ?? []);
      })
      .catch(() => setError("Failed to load reference data."))
      .finally(() => setLoadingData(false));
  }, []);

  const setField = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const setItem  = (i, f, v) => setForm((p) => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [f]: v } : it) }));
  const addItem  = () => setForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));
  const rmItem   = (i) => { if (form.items.length > 1) setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) })); };

  const total = form.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = {
        supplier: form.supplier,
        items: form.items.map((it) => ({
          product: it.product,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
        })),
        ...(form.expectedDelivery && { expectedDelivery: form.expectedDelivery }),
        ...(form.notes && { notes: form.notes }),
      };
      const res = await api.post(PURCHASE_ORDERS.create, payload);
      const id  = res.data?.data?._id ?? res.data?._id;
      navigate(id ? `/purchase-orders/${id}` : "/purchase-orders/list");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create purchase order.");
    } finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="New Purchase Order" subtitle="Order products from a supplier" />
      <div className="card">
        {error && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error" onClose={() => setError(null)}>{error}</Alert></div>}
        <form onSubmit={handleSubmit}>
          {/* Supplier */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Supplier</div>
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Supplier *</label>
                {loadingData ? (
                  <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}><Spinner size={14} /> Loading…</div>
                ) : (
                  <select className="form-control" value={form.supplier} onChange={(e) => setField("supplier", e.target.value)} required>
                    <option value="">Select a supplier…</option>
                    {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expected Delivery</label>
                  <input type="date" className="form-control" value={form.expectedDelivery} onChange={(e) => setField("expectedDelivery", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Optional notes…" />
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
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px auto", gap: "var(--space-3)", alignItems: "flex-end", padding: "var(--space-4)", background: "var(--bg-card-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Product *</label>
                    <select className="form-control" value={item.product} onChange={(e) => setItem(idx, "product", e.target.value)} required>
                      <option value="">Select…</option>
                      {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Qty *</label>
                    <input type="number" min="1" className="form-control" value={item.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Unit Cost *</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={item.unitCost} onChange={(e) => setItem(idx, "unitCost", e.target.value)} required />
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => rmItem(idx)} disabled={form.items.length === 1}>✕</button>
                </div>
              ))}
            </div>

            {/* Total preview */}
            <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-card-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Estimated Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--brand-400)" }}>
                EGP {total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || loadingData}>
              {loading ? <><Spinner size={14} /> Creating…</> : "Create Purchase Order"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
