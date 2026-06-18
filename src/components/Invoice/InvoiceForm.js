import React, { useState, useEffect, useRef } from "react";
import api from "../../api/client";
import * as yup from "yup";
import debounce from "lodash/debounce";
import DOMPurify from "dompurify";
import PageHeader from "../PageHeader";
import { Alert, Spinner } from "../common/UI";

const invoiceSchema = yup.object().shape({
  name: yup.string().required("Customer is required"),
  items: yup.array().of(
    yup.object().shape({
      product: yup.string().required("Product required"),
      quantity: yup.number().min(1).required("Quantity required").typeError("Must be a number"),
    })
  ).min(1, "At least one item required"),
  amount: yup.number().min(0).required("Total amount required"),
  discount: yup.number().min(0).max(100),
});

const InvoiceForm = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    items: [{ product: "", quantity: 1 }],
    amount: 0, discount: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [responseMessage, setResponseMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const saveDraftRef = useRef();

  useEffect(() => {
    saveDraftRef.current = debounce((data) => {
      localStorage.setItem("draftInvoice", JSON.stringify(data));
    }, 500);
    return () => saveDraftRef.current?.cancel();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("draftInvoice");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setFormData({ ...p, items: p.items.map((i) => ({ ...i, quantity: Number(i.quantity) || 1 })) });
      } catch {}
    }
  }, []);

  useEffect(() => { saveDraftRef.current?.(formData); }, [formData]);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [cusRes, prodRes] = await Promise.all([
          api.get("/customers"),
          api.get("/products"),
        ]);
        setCustomers(cusRes.data?.data?.data || []);
        setProducts(prodRes.data?.data?.data || []);
      } catch {}
      finally { setLoadingData(false); }
    };
    load();
  }, []);

  const selectedCustomer = customers.find((c) => c.name === formData.name);

  const handleFieldChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: DOMPurify.sanitize(value) }));

  const handleItemChange = (index, field, value) => {
    const sanitized = field === "product"
      ? DOMPurify.sanitize(value)
      : Math.max(1, parseInt(value) || 1);
    setFormData((p) => ({
      ...p,
      items: p.items.map((item, i) => i === index ? { ...item, [field]: sanitized } : item),
    }));
  };

  const addItem = () =>
    setFormData((p) => ({ ...p, items: [...p.items, { product: "", quantity: 1 }] }));

  const removeItem = (index) => {
    if (formData.items.length > 1)
      setFormData((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const clean = {
        name: formData.name,
        items: formData.items.map((i) => ({ product: i.product, quantity: Number(i.quantity) })),
        amount: parseFloat(formData.amount),
        discount: parseFloat(formData.discount) || 0,
      };
      if (formData.email?.trim()) clean.email = formData.email.trim();
      if (formData.phone?.trim()) clean.phone = formData.phone.trim();
      await invoiceSchema.validate(clean, { abortEarly: false });
      const res = await api.post("/invoices/create", clean);
      if (res.status === 201) {
        setResponseMessage(res.data);
        localStorage.removeItem("draftInvoice");
        setFormData({ name: "", email: "", phone: "", items: [{ product: "", quantity: 1 }], amount: 0, discount: 0 });
      }
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setError("Validation: " + err.errors.join(", "));
      } else {
        setError(err.response?.data?.message || err.message || "Failed to create invoice");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="Create Invoice" subtitle="Create a new sales invoice" />

      {responseMessage && (
        <div className="card" style={{ marginBottom: "var(--space-5)", borderColor: "rgba(16,185,129,0.3)", background: "var(--success-bg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", color: "var(--success)" }}>
            <span style={{ fontSize: "2rem" }}>✅</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Invoice created!</div>
              <div style={{ fontSize: "1.3rem", opacity: 0.85 }}>
                Invoice #{responseMessage?.invoice?.invoiceNumber || "—"} has been created.
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setResponseMessage(null)}>×</button>
          </div>
        </div>
      )}

      <div className="card">
        {error && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <Alert type="error" onClose={() => setError(null)}>{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer section */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Customer</div>
            <div className="form-section">
              <div className="form-group">
                <label className="form-label" htmlFor="inv-name">Customer *</label>
                {loadingData ? (
                  <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
                    <Spinner size={14} /> Loading…
                  </div>
                ) : (
                  <select
                    id="inv-name"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => {
                      const c = customers.find((x) => x.name === e.target.value);
                      setFormData((p) => ({
                        ...p,
                        name: e.target.value,
                        email: c?.email || p.email,
                        phone: c?.phone || p.phone,
                      }));
                    }}
                    required
                  >
                    <option value="">Select a customer…</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-email">Email</label>
                  <input id="inv-email" type="email" className="form-control"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="customer@email.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-phone">Phone</label>
                  <input id="inv-phone" type="tel" className="form-control"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <span className="form-section-title" style={{ margin: 0 }}>Items</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                + Add Item
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {formData.items.map((item, idx) => (
                <div key={idx} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto",
                  gap: "var(--space-3)", alignItems: "flex-end",
                  padding: "var(--space-4)", background: "var(--bg-card-2)",
                  borderRadius: "var(--r-md)", border: "1px solid var(--border)",
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Product *</label>
                    {loadingData ? (
                      <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
                        <Spinner size={14} /> Loading…
                      </div>
                    ) : (
                      <select
                        className="form-control"
                        value={item.product}
                        onChange={(e) => handleItemChange(idx, "product", e.target.value)}
                        required
                      >
                        <option value="">Select a product…</option>
                        {products.map((p) => (
                          <option key={p._id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="form-group" style={{ margin: 0, minWidth: 90 }}>
                    <label className="form-label">Qty *</label>
                    <input
                      type="number" min="1" className="form-control"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeItem(idx)}
                    disabled={formData.items.length === 1}
                    aria-label="Remove item"
                    style={{ marginBottom: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Pricing</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="inv-amount">Total Amount (EGP) *</label>
                <input id="inv-amount" type="number" min="0" step="0.01"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => handleFieldChange("amount", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="inv-discount">Discount (%)</label>
                <input id="inv-discount" type="number" min="0" max="100" step="0.01"
                  className="form-control"
                  value={formData.discount}
                  onChange={(e) => handleFieldChange("discount", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || loadingData}>
              {loading ? <><Spinner size={14} /> Creating Invoice…</> : "Create Invoice"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => {
              localStorage.removeItem("draftInvoice");
              setFormData({ name: "", email: "", phone: "", items: [{ product: "", quantity: 1 }], amount: 0, discount: 0 });
            }}>
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
