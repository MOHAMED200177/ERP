import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import {
  PageLoading, Alert, EmptyState, Currency,
  ConfirmDialog, SortTh, Pagination, StatsRow,
} from "./common/UI";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({ field: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payment");
      setPayments(res.data?.data?.data || []);
    } catch { setError("Failed to load payments."); }
    finally { setLoading(false); }
  };

  const handleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...payments];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((p) =>
      (p.customerName || "").toLowerCase().includes(q) ||
      (p.invoiceNumber || "").toLowerCase().includes(q)
    );
    r.sort((a, b) => {
      let av = a[sort.field] ?? "", bv = b[sort.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [payments, searchTerm, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/payment/${confirmDelete}`);
      setPayments((p) => p.filter((pay) => pay._id !== confirmDelete));
    } catch { setError("Failed to delete payment."); }
    finally { setConfirmDelete(null); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const stats = useMemo(() => {
    const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
    return [
      { label: "Total Payments", value: payments.length, icon: "💳" },
      { label: "Total Amount",   value: `EGP ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: "💰", iconBg: "rgba(16,185,129,0.12)" },
      { label: "This Month",     value: payments.filter((p) => { const d = new Date(p.date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length, icon: "📅", iconBg: "rgba(99,102,241,0.12)" },
    ];
  }, [payments]);

  if (loading) return <PageLoading message="Loading payments…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Payments" subtitle={`${payments.length} total payments`}
        actions={
          <button className="btn btn-primary" onClick={() => navigate("/payments/create")}>
            + Add Payment
          </button>
        }
      />

      <StatsRow stats={stats} />

      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-box-icon">🔍</span>
            <input
              className="form-control"
              style={{ paddingLeft: 34 }}
              placeholder="Search by customer or invoice…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="customerName"  sort={sort} onSort={handleSort}>Customer</SortTh>
                <SortTh field="amount"        sort={sort} onSort={handleSort}>Amount</SortTh>
                <SortTh field="invoiceNumber" sort={sort} onSort={handleSort}>Invoice #</SortTh>
                <SortTh field="date"          sort={sort} onSort={handleSort}>Date</SortTh>
                <SortTh field="method"        sort={sort} onSort={handleSort}>Method</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon="💳" title="No payments found" description="Add your first payment or adjust your search." />
                </td></tr>
              ) : paginated.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 500 }}>{p.customerName || "—"}</td>
                  <td><Currency amount={p.amount} /></td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {p.invoiceNumber
                      ? <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-400)", padding: "2px 0" }}
                          onClick={() => navigate(`/payments/view/${p._id}`)}>
                          {p.invoiceNumber}
                        </button>
                      : "—"
                    }
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{fmt(p.date)}</td>
                  <td>
                    <span className="chip">{p.method || "—"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/payments/view/${p._id}`)}>View</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/payments/edit/${p._id}`)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(p._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page} total={filtered.length}
          perPage={perPage} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Payment"
          message="This action cannot be undone."
          danger onConfirm={doDelete} onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default PaymentList;
