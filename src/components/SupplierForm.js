import React, { useState } from "react";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { Alert, Spinner } from "./common/UI";

const empty = { name: "", contactPerson: "", email: "", phone: "", address: { street: "", city: "", state: "", country: "", postalCode: "" }, taxNumber: "", paymentTerms: "", accountNumber: "", notes: "" };

const SupplierForm = () => {
  const [form, setForm]   = useState(empty);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setForm((p) => ({ ...p, address: { ...p.address, [field]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    try {
      await api.post("/supplier", form);
      setMessage({ type: "success", text: "Supplier created successfully!" });
      setForm(empty);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create supplier." });
    } finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="Add Supplier" subtitle="Register a new supplier" />
      <div className="card">
        {message && <div style={{ marginBottom: "var(--space-4)" }}><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Contact Details</div>
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Supplier Name *</label>
                  <input name="name" className="form-control" value={form.name} onChange={handleChange} placeholder="Company name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input name="contactPerson" className="form-control" value={form.contactPerson} onChange={handleChange} placeholder="Full name" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} placeholder="supplier@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input name="phone" type="tel" className="form-control" value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000" />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Address</div>
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Street</label>
                <input name="address.street" className="form-control" value={form.address.street} onChange={handleChange} placeholder="123 Main St" />
              </div>
              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input name="address.city" className="form-control" value={form.address.city} onChange={handleChange} placeholder="Cairo" />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input name="address.state" className="form-control" value={form.address.state} onChange={handleChange} placeholder="Giza" />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input name="address.postalCode" className="form-control" value={form.address.postalCode} onChange={handleChange} placeholder="11511" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input name="address.country" className="form-control" value={form.address.country} onChange={handleChange} placeholder="Egypt" />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section-title">Financial Info</div>
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tax Number</label>
                  <input name="taxNumber" className="form-control" value={form.taxNumber} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input name="accountNumber" className="form-control" value={form.accountNumber} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Terms</label>
                <input name="paymentTerms" className="form-control" value={form.paymentTerms} onChange={handleChange} placeholder="e.g. Net 30" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="notes" className="form-control" rows={3} value={form.notes} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size={14} /> Saving…</> : "Create Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;
