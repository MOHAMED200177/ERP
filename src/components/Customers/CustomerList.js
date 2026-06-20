import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "../PageHeader";
import {
  PageLoading, Alert, EmptyState,
  Currency, ConfirmDialog, SortTh, Pagination, StatsRow,
} from "../common/UI";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [sort, setSort] = useState({ field: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers");
      setCustomers(res.data?.data?.data || []);
    } catch {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...customers];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
    if (balanceFilter === "positive") r = r.filter((c) => (c.balance || 0) > 0);
    if (balanceFilter === "zero")     r = r.filter((c) => (c.balance || 0) === 0);
    r.sort((a, b) => {
      let av = a[sort.field] ?? "", bv = b[sort.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [customers, searchTerm, balanceFilter, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/customers/${confirmDelete.id}`);
      setCustomers((p) => p.filter((c) => c._id !== confirmDelete.id));
    } catch { setError("Failed to delete customer."); }
    finally { setConfirmDelete(null); }
  };


  const stats = useMemo(() => {
    const totalBal = customers.reduce((s, c) => s + (c.balance || 0), 0);
    const totalOut = customers.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
    return [
      { label: "Total Customers",  value: customers.length, icon: "👥" },
      { label: "With Balance",     value: customers.filter((c) => c.balance > 0).length, icon: "💳", iconBg: "rgba(99,102,241,0.12)" },
      { label: "Total Balance",    value: `EGP ${totalBal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: "💰", iconBg: "rgba(16,185,129,0.12)" },
      { label: "Outstanding",      value: `EGP ${totalOut.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: "⚠️", iconBg: "rgba(239,68,68,0.12)" },
    ];
  }, [customers]);

  if (loading) return <PageLoading message="Loading customers…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} total customers`}
        actions={
          <button className="btn btn-primary" onClick={() => navigate("/customers/create")}>
            + New Customer
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
              placeholder="Search by name, email, phone…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="form-control"
            style={{ width: "auto", minWidth: 140 }}
            value={balanceFilter}
            onChange={(e) => { setBalanceFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All customers</option>
            <option value="positive">Has balance</option>
            <option value="zero">Zero balance</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="name"    sort={sort} onSort={handleSort}>Name</SortTh>
                <SortTh field="email"   sort={sort} onSort={handleSort}>Email</SortTh>
                <SortTh field="phone"   sort={sort} onSort={handleSort}>Phone</SortTh>
                <SortTh field="balance" sort={sort} onSort={handleSort}>Balance</SortTh>
                <th>Invoices</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon="👥" title="No customers found" description="Try adjusting your search or filters." />
                </td></tr>
              ) : paginated.map((c) => (
                <tr key={c._id}>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-400)", padding: "2px 0" }}
                      onClick={() => navigate(`/customers/data-customer/${c._id}`)}>
                      {c.name}
                    </button>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.email || "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.phone || "—"}</td>
                  <td>
                    {(c.balance || 0) > 0
                      ? <span style={{ color: "var(--warning)", fontWeight: 500 }}><Currency amount={c.balance} /></span>
                      : <span style={{ color: "var(--text-muted)" }}><Currency amount={0} /></span>
                    }
                  </td>
                  <td>
                    <span className="chip">{c.invoice?.length || 0} invoices</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/customers/data-customer/${c._id}`)}>View</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/customers/edit-customer/${c._id}`)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ id: c._id, name: c.name })}>Delete</button>
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
          title="Delete Customer"
          message={`Are you sure you want to delete "${confirmDelete.name}"? This cannot be undone.`}
          danger onConfirm={doDelete} onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default CustomerList;
