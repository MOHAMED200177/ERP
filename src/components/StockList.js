import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import {
  PageLoading, Alert, EmptyState, ConfirmDialog,
  SortTh, Pagination, StatsRow,
} from "./common/UI";

const getDaysUntilExpiry = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
};

const ExpiryBadge = ({ date }) => {
  const days = getDaysUntilExpiry(date);
  if (days === null) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  if (days < 0)  return <span className="badge badge-danger">Expired</span>;
  if (days <= 30) return <span className="badge badge-warning">{days}d left</span>;
  return <span style={{ color: "var(--text-secondary)", fontSize: "1.3rem" }}>{new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>;
};

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [sort, setSort] = useState({ field: "productName", dir: "asc" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchStocks(); }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/stock");
      setStocks(res.data?.data?.data || []);
    } catch { setError("Failed to load stock."); }
    finally { setLoading(false); }
  };

  const handleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...stocks];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((s) =>
      (s.product?.name || "").toLowerCase().includes(q) ||
      (s.batchNumber || "").toLowerCase().includes(q)
    );
    if (expiryFilter === "expired") r = r.filter((s) => getDaysUntilExpiry(s.expiryDate) < 0);
    if (expiryFilter === "expiring") r = r.filter((s) => {
      const d = getDaysUntilExpiry(s.expiryDate);
      return d !== null && d >= 0 && d <= 30;
    });
    r.sort((a, b) => {
      const av = sort.field === "productName" ? (a.product?.name || "").toLowerCase() : (a[sort.field] ?? "");
      const bv = sort.field === "productName" ? (b.product?.name || "").toLowerCase() : (b[sort.field] ?? "");
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [stocks, searchTerm, expiryFilter, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/stock/${confirmDelete}`);
      setStocks((p) => p.filter((s) => s._id !== confirmDelete));
    } catch { setError("Failed to delete stock entry."); }
    finally { setConfirmDelete(null); }
  };

  const stats = useMemo(() => {
    const totalQty   = stocks.reduce((s, i) => s + (i.quantity || 0), 0);
    const expired    = stocks.filter((s) => getDaysUntilExpiry(s.expiryDate) < 0).length;
    const expiring   = stocks.filter((s) => { const d = getDaysUntilExpiry(s.expiryDate); return d !== null && d >= 0 && d <= 30; }).length;
    const totalValue = stocks.reduce((s, i) => s + (i.quantity || 0) * (i.product?.sellingPrice || 0), 0);
    return [
      { label: "Stock Items",   value: stocks.length, icon: "📦" },
      { label: "Total Quantity",value: totalQty.toLocaleString(), icon: "🔢", iconBg: "rgba(99,102,241,0.12)" },
      { label: "Expiring Soon", value: expiring, icon: "⏳", iconBg: "rgba(245,158,11,0.12)" },
      { label: "Expired",       value: expired,  icon: "⚠️", iconBg: "rgba(239,68,68,0.12)" },
      { label: "Est. Value",    value: `EGP ${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: "💰", iconBg: "rgba(16,185,129,0.12)" },
    ];
  }, [stocks]);

  if (loading) return <PageLoading message="Loading stock…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Stock" subtitle={`${stocks.length} stock entries`}
        actions={
          <button className="btn btn-primary" onClick={() => navigate("/stock/create")}>
            + Add Stock
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
              placeholder="Search by product or batch number…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="form-control"
            style={{ width: "auto", minWidth: 150 }}
            value={expiryFilter}
            onChange={(e) => { setExpiryFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All stock</option>
            <option value="expiring">Expiring (30 days)</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="productName" sort={sort} onSort={handleSort}>Product</SortTh>
                <SortTh field="quantity"    sort={sort} onSort={handleSort}>Quantity</SortTh>
                <SortTh field="batchNumber" sort={sort} onSort={handleSort}>Batch #</SortTh>
                <SortTh field="expiryDate"  sort={sort} onSort={handleSort}>Expiry</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={5}>
                  <EmptyState icon="📦" title="No stock found" description="Add your first stock entry." />
                </td></tr>
              ) : paginated.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 500 }}>{s.product?.name || "—"}</td>
                  <td>
                    <span style={{
                      fontVariantNumeric: "tabular-nums", fontWeight: 600,
                      color: (s.quantity || 0) < 10 ? "var(--warning)" : "var(--text-primary)"
                    }}>
                      {s.quantity || 0}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}><span className="chip">{s.batchNumber || "—"}</span></td>
                  <td><ExpiryBadge date={s.expiryDate} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(s._id)}>Delete</button>
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
          title="Delete Stock Entry"
          message="This action cannot be undone."
          danger onConfirm={doDelete} onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default StockList;
