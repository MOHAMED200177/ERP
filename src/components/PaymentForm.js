import React, { useState, useEffect } from "react";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { Alert, Spinner } from "./common/UI";

const PaymentForm = ({ onPaymentCreated }) => {
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount]             = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customers, setCustomers]       = useState([]);
  const [invoices, setInvoices]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [loadingData, setLoadingData]   = useState(true);
  const [message, setMessage]           = useState(null);
  const [messageType, setMessageType]   = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [cusRes, invRes] = await Promise.all([
          api.get("/customers"),
          api.get("/invoices"),
        ]);
        setCustomers(cusRes.data?.data?.data || []);
        setInvoices(invRes.data?.data?.data || []);
      } catch {
        setMessage("Failed to load reference data.");
        setMessageType("error");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, []);

  // Filter invoices by selected customer
  const customerInvoices = invoices.filter(
    (inv) => !customerName || inv.customer?.name === customerName
  );

  const addPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = { name: customerName, amount: parseFloat(amount) };
      if (invoiceNumber.trim()) payload.invoiceNumber = invoiceNumber;
      await api.post("/payment/add", payload);
      setMessage("Payment added successfully!");
      setMessageType("success");
      if (typeof onPaymentCreated === "function") onPaymentCreated();
      setCustomerName(""); setAmount(""); setInvoiceNumber("");
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Failed to add payment.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <PageHeader title="Add Payment" subtitle="Record a customer payment" />

      <div className="card">
        {message && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <Alert type={messageType} onClose={() => setMessage(null)}>{message}</Alert>
          </div>
        )}

        <form onSubmit={addPayment}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="customerName">Customer *</label>
              {loadingData ? (
                <div className="form-control" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
                  <Spinner size={14} /> Loading customers…
                </div>
              ) : (
                <select
                  id="customerName"
                  className="form-control"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setInvoiceNumber(""); }}
                  required
                >
                  <option value="">Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invoiceNumber">Invoice (optional)</label>
              <select
                id="invoiceNumber"
                className="form-control"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={loadingData || !customerName}
              >
                <option value="">{customerName ? "Select an invoice…" : "Select a customer first"}</option>
                {customerInvoices.map((inv) => (
                  <option key={inv._id} value={inv.invoiceNumber}>
                    {inv.invoiceNumber} — EGP {(inv.balanceDue || 0).toFixed(2)} due
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount">Amount (EGP) *</label>
              <input
                id="amount"
                className="form-control"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || loadingData}>
              {loading ? <><Spinner size={14} /> Processing…</> : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
