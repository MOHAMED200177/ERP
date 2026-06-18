import React, { useState } from "react";
import api from "../../api/client";
import PageHeader from "../PageHeader";
import { Alert, Spinner } from "../common/UI";

const CustomerManagement = () => {
  const [formData, setFormData] = useState({ name: "", email: "", address: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (message.text) setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage({ text: "", type: "" });
    try {
      await api.post("/customers", formData);
      setFormData({ name: "", email: "", address: "", phone: "" });
      setMessage({ text: "Customer created successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Error creating customer.", type: "error" });
    } finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="Add Customer" subtitle="Create a new customer record" />

      <div className="card">
        {message.text && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <Alert type={message.type} onClose={() => setMessage({ text: "", type: "" })}>{message.text}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input id="name" name="name" type="text" className="form-control"
                placeholder="Enter customer full name"
                value={formData.name} onChange={handleChange}
                required disabled={loading} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className="form-control"
                  placeholder="customer@example.com"
                  value={formData.email} onChange={handleChange}
                  disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" className="form-control"
                  placeholder="+1 555 000 0000"
                  value={formData.phone} onChange={handleChange}
                  disabled={loading} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">Address</label>
              <textarea id="address" name="address" className="form-control"
                placeholder="Street, City, Country"
                value={formData.address} onChange={handleChange}
                disabled={loading} rows={3} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size={14} /> Saving…</> : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerManagement;
