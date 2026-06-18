import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import { PageLoading, Alert, EmptyState, Currency, ConfirmDialog, SortTh, Pagination, StatsRow } from "./common/UI";

const ProductsList = () => {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort]               = useState({ field: "name", dir: "asc" });
  const [page, setPage]               = useState(1);
  const [perPage, setPerPage]         = useState(10);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/product");
      setProducts(res.data?.data?.data || []);
    } catch { setError("Failed to load products."); }
    finally { setLoading(false); }
  };

  const categories = useMemo(() => [...new Set(products.map((p) => p.category?.name).filter(Boolean))], [products]);
  const handleSort = (field) => setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...products];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.productCode || "").toLowerCase().includes(q));
    if (categoryFilter !== "all") r = r.filter((p) => p.category?.name === categoryFilter);
    r.sort((a, b) => {
      let av = a[sort.field] ?? "", bv = b[sort.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sort.dir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
    });
    return r;
  }, [products, searchTerm, categoryFilter, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/product/${confirmDelete}`);
      setProducts((p) => p.filter((x) => x._id !== confirmDelete));
    } catch { setError("Failed to delete product."); }
    finally { setConfirmDelete(null); }
  };

  const stats = useMemo(() => [
    { label: "Total Products", value: products.length, icon: "📦" },
    { label: "Categories",     value: categories.length, icon: "🏷️", iconBg: "rgba(99,102,241,0.12)" },
    { label: "Avg. Sell Price",value: products.length ? `EGP ${(products.reduce((s, p) => s + (p.sellingPrice || 0), 0) / products.length).toFixed(2)}` : "—", icon: "💰", iconBg: "rgba(16,185,129,0.12)" },
  ], [products, categories]);

  if (loading) return <PageLoading message="Loading products…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Products" subtitle={`${products.length} products`}
        actions={<button className="btn btn-primary" onClick={() => navigate("/stock/Create Product")}>+ New Product</button>}
      />
      <StatsRow stats={stats} />
      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-box-icon">🔍</span>
            <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Search by name or code…"
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control" style={{ width: "auto", minWidth: 160 }} value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="name"         sort={sort} onSort={handleSort}>Name</SortTh>
                <SortTh field="productCode"  sort={sort} onSort={handleSort}>Code</SortTh>
                <th>Category</th><th>Supplier</th>
                <SortTh field="costPrice"    sort={sort} onSort={handleSort}>Cost</SortTh>
                <SortTh field="sellingPrice" sort={sort} onSort={handleSort}>Sell</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="📦" title="No products found" /></td></tr>
              ) : paginated.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><span className="chip">{p.productCode || "—"}</span></td>
                  <td style={{ color: "var(--text-secondary)" }}>{p.category?.name || "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{p.supplier?.name || "—"}</td>
                  <td><Currency amount={p.costPrice} /></td>
                  <td style={{ color: "var(--success)", fontWeight: 500 }}><Currency amount={p.sellingPrice} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/stock/product/${p._id}`)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(p._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }} />
      </div>
      {confirmDelete && <ConfirmDialog title="Delete Product" message="This cannot be undone." danger onConfirm={doDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
};

export default ProductsList;
