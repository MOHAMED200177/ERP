import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import { PageLoading, Alert, EmptyState, Currency, StatusBadge, SortTh, Pagination, StatsRow } from "./common/UI";

const ReturnList = () => {
  const [returns, setReturns]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [sort, setSort]               = useState({ field: "date", dir: "desc" });
  const [page, setPage]               = useState(1);
  const [perPage, setPerPage]         = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/return")
      .then((r) => setReturns(r.data?.data?.data ?? r.data?.data ?? []))
      .catch(() => setError("Failed to load returns."))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...returns];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((x) => (x.customer?.name || "").toLowerCase().includes(q) || (x.product?.name || "").toLowerCase().includes(q));
    r.sort((a, b) => {
      let av = a[sort.field] ?? "", bv = b[sort.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sort.dir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
    });
    return r;
  }, [returns, searchTerm, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const stats = useMemo(() => {
    const totalAmt = returns.reduce((s, r) => s + (r.amount || r.totalRefund || 0), 0);
    return [
      { label: "Total Returns", value: returns.length, icon: "↩️" },
      { label: "Total Refunded", value: `EGP ${totalAmt.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: "💸", iconBg: "rgba(239,68,68,0.12)" },
    ];
  }, [returns]);

  if (loading) return <PageLoading message="Loading returns…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Returns" subtitle={`${returns.length} returns`}
        actions={<button className="btn btn-primary" onClick={() => navigate("/returns/create")}>+ New Return</button>}
      />
      <StatsRow stats={stats} />
      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-box-icon">🔍</span>
            <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Search by customer or product…"
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="date" sort={sort} onSort={handleSort}>Date</SortTh>
                <th>Customer</th><th>Product</th>
                <SortTh field="quantity" sort={sort} onSort={handleSort}>Qty</SortTh>
                <th>Reason</th>
                <SortTh field="amount" sort={sort} onSort={handleSort}>Amount</SortTh>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="↩️" title="No returns found" /></td></tr>
              ) : paginated.map((r) => (
                <tr key={r._id}>
                  <td style={{ color: "var(--text-secondary)" }}>{fmt(r.date)}</td>
                  <td style={{ fontWeight: 500 }}>{r.customer?.name || r.customerName || "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{r.product?.name || r.productName || "—"}</td>
                  <td>{r.quantity || "—"}</td>
                  <td><span className="chip">{r.reason || "—"}</span></td>
                  <td><Currency amount={r.amount || r.totalRefund} /></td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
      </div>
    </div>
  );
};

export default ReturnList;
