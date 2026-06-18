import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { PageLoading, Alert, Spinner } from "./common/UI";

const EditPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(false);
  const [updatedFields, setUpdatedFields] = useState({});

  useEffect(() => {
    api.get(`/payment/${id}`)
      .then((r) => {
        const body = r.data?.data?.data ?? r.data?.data ?? r.data;
        setPayment(body?.payment || body);
      })
      .catch(() => setError("Failed to load payment."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedFields((p) => ({ ...p, [name]: value }));
    setPayment((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.keys(updatedFields).length) return;
    setSaving(true); setError(null);
    try {
      const payload = { ...updatedFields };
      if (payload.paymentMethod != null) { payload.method = payload.paymentMethod; delete payload.paymentMethod; }
      if (payload.amount) payload.amount = parseFloat(payload.amount);
      await api.patch(`/payment/${id}`, payload);
      setSuccess(true);
      setTimeout(() => navigate("/payments/view"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update payment.");
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoading message="Loading payment…" />;

  return (
    <div className="form-page">
      <PageHeader title="Edit Payment" />
      <div className="card">
        {error   && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="error"   onClose={() => setError(null)}>{error}</Alert></div>}
        {success && <div style={{ marginBottom: "var(--space-4)" }}><Alert type="success">Payment updated! Redirecting…</Alert></div>}
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input name="customerName" className="form-control" value={payment?.customerName || ""} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (EGP)</label>
                <input name="amount" type="number" min="0" step="0.01" className="form-control" value={payment?.amount || ""} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select name="method" className="form-control" value={payment?.method || ""} onChange={handleChange}>
                  <option value="">Select method…</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" className="form-control" rows={3} value={payment?.notes || ""} onChange={handleChange} />
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

export default EditPayment;
