import React, { useState, useEffect } from "react";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { Alert, Spinner } from "./common/UI";

const StockForm = ({ onStockCreated }) => {
  const [productId, setProductId]     = useState("");
  const [quantity, setQuantity]       = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate]   = useState("");
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage]         = useState(null);
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const selectedProduct = products.find((p) => p._id === productId);

  const createStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/stock", {
        productName: selectedProduct?.name || productId,
        quantity: Number(quantity),
        batchNumber,
        expiryDate,
      });
      setMessage("Stock entry created successfully!");
      setMessageType("success");
      if (typeof onStockCreated === "function") onStockCreated();
      setProductId(""); setQuantity(""); setBatchNumber(""); setExpiryDate("");
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Failed to create stock.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <PageHeader title="Add Stock" subtitle="Create a new stock entry" />

      <div className="card">
        {message && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <Alert type={messageType} onClose={() => setMessage(null)}>{message}</Alert>
          </div>
        )}

        <form onSubmit={createStock}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="productId">Product *</label>
              {loadingProducts ? (
                <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
                  <Spinner size={14} /> Loading products…
                </div>
              ) : (
                <select
                  id="productId"
                  className="form-control"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}{p.category?.name ? ` — ${p.category.name}` : ""}</option>
                  ))}
                </select>
              )}
            </div>

            {selectedProduct && (
              <div className="alert alert-info" style={{ fontSize: "1.3rem" }}>
                <strong>{selectedProduct.name}</strong>
                {selectedProduct.sellingPrice && ` — Selling Price: EGP ${selectedProduct.sellingPrice}`}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="quantity">Quantity *</label>
                <input
                  id="quantity" type="number" min="1"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="batchNumber">Batch Number *</label>
                <input
                  id="batchNumber" type="text"
                  className="form-control"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2024-001"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expiryDate">Expiry Date *</label>
              <input
                id="expiryDate" type="date"
                className="form-control"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || loadingProducts}>
              {loading ? <><Spinner size={14} /> Creating…</> : "Create Stock Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockForm;
