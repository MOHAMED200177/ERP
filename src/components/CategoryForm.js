import React, { useState, useEffect } from "react";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { Alert, Spinner } from "./common/UI";

const CategoryForm = ({ onCategoryCreated }) => {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [parentCategory, setParent]   = useState("");
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState(null);

  useEffect(() => {
    api.get("/categories")
      .then((r) => setCategories(r.data?.data?.data ?? r.data?.data ?? []))
      .catch(() => {});
  }, []);

  const createCategory = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    try {
      await api.post("/categories", { name, description, ...(parentCategory && { parentCategory }) });
      setMessage({ type: "success", text: "Category created!" });
      setName(""); setDescription(""); setParent("");
      if (typeof onCategoryCreated === "function") onCategoryCreated();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create category." });
    } finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="Add Category" subtitle="Create a new product category" />
      <div className="card">
        {message && <div style={{ marginBottom: "var(--space-4)" }}><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}
        <form onSubmit={createCategory}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="catName">Category Name *</label>
              <input id="catName" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Antibiotics" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="catDesc">Description</label>
              <textarea id="catDesc" className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="catParent">Parent Category</label>
              <select id="catParent" className="form-control" value={parentCategory} onChange={(e) => setParent(e.target.value)}>
                <option value="">None (top-level)</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size={14} /> Creating…</> : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
