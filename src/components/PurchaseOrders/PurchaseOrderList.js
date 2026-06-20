import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { PURCHASE_ORDERS } from "../../api/endpoints";
import PageHeader from "../PageHeader";
import { PageLoading, Alert, EmptyState, StatusBadge, Currency, ConfirmDialog, SortTh, Pagination, StatsRow } from "../common/UI";
import { formatCurrency } from "../../utils/format";

const PurchaseOrderList = () => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [searchTerm, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [sort, setSort]         = useState({ field: "createdAt", dir: "desc" });
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(10);
  const [confirmDelete, setDel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get(PURCHASE_ORDERS.list);
      setOrders(res.data?.data?.data ?? res.data?.data ?? []);
    } catch { setError("Failed to load purchase orders."); }
    finally { setLoading(false); }
  };

  const handleSort = (f) => setSort((s) => ({ field: f, dir: s.field === f && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...orders];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((o) => (o.orderNumber || "").toLowerCase().includes(q) || (o.supplier?.name || "").toLowerCase().includes(q));
    if (statusFilter !== "all") r = r.filter((o) => o.status === statusFilter);
    r.sort((a, b) => {
      let av = a[sort.field] ?? "", bv = b[sort.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sort.dir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
    });
    return r;
  }, [orders, searchTerm, statusFilter, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const doDelete = async () => {
    if (!confirmDelete) return;
    try { await api.delete(PURCHASE_ORDERS.delete(confirmDelete)); setOrders((p) => p.filter((o) => o._id !== confirmDelete)); }
    catch { setError("Failed to delete."); } finally { setDel(null); }
  };

  const statCards = useMemo(() => [
    { label: "Total Orders", value: orders.length, icon: "📋" },
    { label: "Pending",      value: orders.filter((o) => o.status === "pending").length,  icon: "⏳", iconBg: "rgba(245,158,11,0.12)" },
    { label: "Received",     value: orders.filter((o) => o.status === "received").length, icon: "✅", iconBg: "rgba(16,185,129,0.12)" },
    { label: "Total Value",  value: formatCurrency(orders.reduce((s, o) => s + (o.totalAmount || 0), 0)), icon: "💰", iconBg: "rgba(99,102,241,0.12)" },
  ], [orders]);

  if (loading) return <PageLoading message="Loading purchase orders…" />;
  if (error)   return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle={`${orders.length} orders`}
        actions={<button className="btn btn-primary" onClick={() => navigate("/purchase-orders/create")}>+ New Order</button>}
      />
      <StatsRow stats={statCards} />
      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-box-icon">🔍</span>
            <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Search by order # or supplier…"
              value={searchTerm} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control" style={{ width: "auto", minWidth: 150 }}
            value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="orderNumber" sort={sort} onSort={handleSort}>Order #</SortTh>
                <SortTh field="supplier"    sort={sort} onSort={handleSort}>Supplier</SortTh>
                <SortTh field="createdAt"   sort={sort} onSort={handleSort}>Date</SortTh>
                <SortTh field="totalAmount" sort={sort} onSort={handleSort}>Total</SortTh>
                <SortTh field="amountPaid"  sort={sort} onSort={handleSort}>Paid</SortTh>
                <th>Balance</th>
                <SortTh field="status"      sort={sort} onSort={handleSort}>Status</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="📋" title="No purchase orders" description="Create your first purchase order." /></td></tr>
              ) : paginated.map((o) => (
                <tr key={o._id}>
                  <td><button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-400)", padding: "2px 0" }}
                    onClick={() => navigate(`/purchase-orders/${o._id}`)}>
                    {o.orderNumber || o._id?.slice(-8)}
                  </button></td>
                  <td style={{ fontWeight: 500 }}>{o.supplier?.name || "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{fmt(o.createdAt)}</td>
                  <td><Currency amount={o.totalAmount} /></td>
                  <td style={{ color: "var(--success)" }}><Currency amount={o.amountPaid} /></td>
                  <td style={{ color: ((o.totalAmount||0)-(o.amountPaid||0))>0 ? "var(--danger)" : "var(--text-muted)" }}>
                    <Currency amount={(o.totalAmount||0)-(o.amountPaid||0)} />
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/purchase-orders/${o._id}`)}>View</button>
                      {o.status === "pending" && (
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--success)" }}
                          onClick={() => navigate(`/purchase-orders/${o._id}/receive`)}>Receive</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => setDel(o._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={perPage}
          onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
      </div>
      {confirmDelete && <ConfirmDialog title="Delete Purchase Order" message="This cannot be undone."
        danger onConfirm={doDelete} onCancel={() => setDel(null)} />}
    </div>
  );
};

export default PurchaseOrderList;
