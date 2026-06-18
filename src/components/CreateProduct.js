import React, { useState, useEffect } from "react";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { Alert, Spinner } from "./common/UI";

const CreateProduct = () => {
  const [form, setForm] = useState({ name: "", productCode: "", costPrice: "", sellingPrice: "", unit: "", category: "", supplier: "" });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage]       = useState(null);

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/suppliers")])
      .then(([catRes, supRes]) => {
        setCategories(catRes.data?.data?.data || catRes.data?.data || []);
        setSuppliers(supRes.data?.data?.data || supRes.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    try {
      await api.post("/product", form);
      setMessage({ type: "success", text: "Product created successfully!" });
      setForm({ name: "", productCode: "", costPrice: "", sellingPrice: "", unit: "", category: "", supplier: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create product." });
    } finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="Create Product" subtitle="Add a new product to inventory" />

      <div className="card">
        {message && <div style={{ marginBottom: "var(--space-4)" }}><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Product Name *</label>
                <input id="name" name="name" className="form-control" value={form.name} onChange={handleChange} placeholder="e.g. Paracetamol 500mg" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="productCode">Product Code</label>
                <input id="productCode" name="productCode" className="form-control" value={form.productCode} onChange={handleChange} placeholder="e.g. PARA-500" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="costPrice">Cost Price (EGP)</label>
                <input id="costPrice" name="costPrice" type="number" min="0" step="0.01" className="form-control" value={form.costPrice} onChange={handleChange} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sellingPrice">Selling Price (EGP)</label>
                <input id="sellingPrice" name="sellingPrice" type="number" min="0" step="0.01" className="form-control" value={form.sellingPrice} onChange={handleChange} placeholder="0.00" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="unit">Unit</label>
              <input id="unit" name="unit" className="form-control" value={form.unit} onChange={handleChange} placeholder="e.g. box, bottle, kg" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select id="category" name="category" className="form-control" value={form.category} onChange={handleChange} disabled={loadingData}>
                  <option value="">{loadingData ? "Loading…" : "Select category…"}</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="supplier">Supplier</label>
                <select id="supplier" name="supplier" className="form-control" value={form.supplier} onChange={handleChange} disabled={loadingData}>
                  <option value="">{loadingData ? "Loading…" : "Select supplier…"}</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size={14} /> Creating…</> : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
