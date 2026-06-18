import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { PageLoading, Alert, Spinner } from "./common/UI";

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({ name: "", productCode: "", costPrice: 0, sellingPrice: 0, unit: "", taxes: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/product/${id}`)
      .then((r) => {
        const row = r.data?.data?.data ?? r.data?.data ?? {};
        setProduct({ name: row.name || "", productCode: row.productCode || "", costPrice: row.costPrice || 0, sellingPrice: row.sellingPrice || 0, unit: row.unit || "", taxes: row.taxes || 0 });
      })
      .catch(() => setError("Failed to load product."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setProduct((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const data = {};
      if (product.name?.trim()) data.name = product.name.trim();
      if (product.productCode?.trim()) data.productCode = product.productCode.trim();
      if (product.costPrice !== "") data.costPrice = parseFloat(product.costPrice);
      if (product.sellingPrice !== "") data.sellingPrice = parseFloat(product.sellingPrice);
      if (product.unit?.trim()) data.unit = product.unit.trim();
      if (product.taxes !== "") data.taxes = parseFloat(product.taxes);
      await api.patch(`/product/${id}`, data);
      setSuccess(true);
      setTimeout(() => navigate("/stock/ProductsList"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product.");
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoading message="Loading product…" />;

  return (
    <div className="form-page">
      <PageHeader title="Edit Product" subtitle={product.name} />
      <div className="card">
        {error   && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error"   onClose={() => setError(null)}>{error}</Alert></div>}
        {success && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="success">Product updated! Redirecting…</Alert></div>}
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input name="name" className="form-control" value={product.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Product Code</label>
                <input name="productCode" className="form-control" value={product.productCode} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cost Price (EGP)</label>
                <input name="costPrice" type="number" min="0" step="0.01" className="form-control" value={product.costPrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (EGP)</label>
                <input name="sellingPrice" type="number" min="0" step="0.01" className="form-control" value={product.sellingPrice} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input name="unit" className="form-control" value={product.unit} onChange={handleChange} placeholder="e.g. box, bottle, kg" />
              </div>
              <div className="form-group">
                <label className="form-label">Taxes (%)</label>
                <input name="taxes" type="number" min="0" step="0.01" className="form-control" value={product.taxes} onChange={handleChange} />
              </div>
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

export default ProductEdit;
