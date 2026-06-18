import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../PageHeader";
import { PageLoading, Alert, Spinner } from "../common/UI";

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [updatedFields, setUpdatedFields] = useState({});

  useEffect(() => {
    api.get(`/customers/${id}`)
      .then((res) => setCustomer(res.data?.data?.data ?? res.data?.data ?? res.data))
      .catch(() => setError("Failed to load customer."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedFields((p) => ({ ...p, [name]: value }));
    setCustomer((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.keys(updatedFields).length) return;
    setSaving(true); setError(null);
    try {
      await api.patch(`/customers/${id}`, updatedFields);
      setSuccess(true);
      setTimeout(() => navigate("/customers/view"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update customer.");
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoading message="Loading customer…" />;
  if (!customer && error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="form-page">
      <PageHeader title="Edit Customer" subtitle={customer?.name} />

      <div className="card">
        {error && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error" onClose={() => setError(null)}>{error}</Alert></div>}
        {success && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="success">Customer updated! Redirecting…</Alert></div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input id="name" name="name" type="text" className="form-control"
                value={customer?.name || ""} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className="form-control"
                  value={customer?.email || ""} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" className="form-control"
                  value={customer?.phone || ""} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="address">Address</label>
              <textarea id="address" name="address" className="form-control" rows={3}
                value={customer?.address || ""} onChange={handleChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving || !Object.keys(updatedFields).length}>
              {saving ? <><Spinner size={14} /> Saving…</> : "Save Changes"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomer;
