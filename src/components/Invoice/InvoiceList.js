import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "../PageHeader";
import {
  PageLoading, Alert, EmptyState, StatusBadge,
  Currency, ConfirmDialog, SortTh, Pagination, StatsRow,
} from "../common/UI";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState({ field: "issueDate", dir: "desc" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/invoices");
      setInvoices(res.data?.data?.data || []);
    } catch {
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...invoices];
    const q = searchTerm.toLowerCase();
    if (q) {
      r = r.filter((inv) =>
        (inv.invoiceNumber || "").toLowerCase().includes(q) ||
        (inv.customer?.name || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") r = r.filter((inv) => inv.status === statusFilter);
    r.sort((a, b) => {
      let av = a[sort.field] ?? "", bv = b[sort.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [invoices, searchTerm, statusFilter, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/invoices/${confirmDelete}`);
      setInvoices((p) => p.filter((i) => i._id !== confirmDelete));
    } catch { setError("Failed to delete invoice."); }
    finally { setConfirmDelete(null); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const paid  = invoices.filter((i) => i.status === "paid").length;
    const due   = invoices.reduce((s, i) => s + (i.balanceDue || 0), 0);
    return [
      { label: "Total Invoices", value: invoices.length, icon: "🧾" },
      { label: "Paid",           value: paid,            icon: "✅", iconBg: "rgba(16,185,129,0.12)" },
      { label: "Unpaid",         value: invoices.filter((i) => i.status === "unpaid").length, icon: "⚠️", iconBg: "rgba(245,158,11,0.12)" },
      { label: "Total Revenue",  value: `EGP ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: "💰", iconBg: "rgba(99,102,241,0.12)" },
      { label: "Balance Due",    value: `EGP ${due.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,   icon: "📊", iconBg: "rgba(239,68,68,0.12)" },
    ];
  }, [invoices]);

  if (loading) return <PageLoading message="Loading invoices…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${invoices.length} total invoices`}
        actions={
          <button className="btn btn-primary" onClick={() => navigate("/invoices/create")}>
            + New Invoice
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
              placeholder="Search by number or customer…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="form-control"
            style={{ width: "auto", minWidth: 140 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="invoiceNumber" sort={sort} onSort={handleSort}>Invoice #</SortTh>
                <SortTh field="customer" sort={sort} onSort={handleSort}>Customer</SortTh>
                <SortTh field="issueDate" sort={sort} onSort={handleSort}>Date</SortTh>
                <SortTh field="totalAmount" sort={sort} onSort={handleSort}>Amount</SortTh>
                <SortTh field="balanceDue" sort={sort} onSort={handleSort}>Balance Due</SortTh>
                <SortTh field="status" sort={sort} onSort={handleSort}>Status</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon="🧾" title="No invoices found" description="Try adjusting your search or filters." />
                  </td>
                </tr>
              ) : paginated.map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--brand-400)", padding: "2px 0" }}
                      onClick={() => navigate(`/invoices/view/${inv._id}`)}
                    >
                      {inv.invoiceNumber || inv._id?.slice(-8)}
                    </button>
                  </td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {inv.customer?.name || "—"}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{fmt(inv.issueDate)}</td>
                  <td><Currency amount={inv.totalAmount} /></td>
                  <td>
                    {inv.balanceDue > 0
                      ? <span style={{ color: "var(--danger)" }}><Currency amount={inv.balanceDue} /></span>
                      : <span style={{ color: "var(--success)" }}>EGP 0.00</span>
                    }
                  </td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/view/${inv._id}`)}>View</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/edit/${inv._id}`)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(inv._id)}>Delete</button>
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
          title="Delete Invoice"
          message="This action cannot be undone. The invoice will be permanently removed."
          danger
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default InvoiceList;
