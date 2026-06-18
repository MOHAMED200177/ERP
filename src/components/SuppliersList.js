import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { PageLoading, Alert, EmptyState, SortTh, Pagination } from "./common/UI";

const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort]           = useState({ field: "name", dir: "asc" });
  const [page, setPage]           = useState(1);
  const [perPage, setPerPage]     = useState(10);

  useEffect(() => {
    api.get("/supplier")
      .then((r) => setSuppliers(r.data?.data?.data || []))
      .catch(() => setError("Failed to load suppliers."))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...suppliers];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((s) => (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q));
    r.sort((a, b) => {
      let av = a[sort.field] ?? "", bv = b[sort.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sort.dir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
    });
    return r;
  }, [suppliers, searchTerm, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) return <PageLoading message="Loading suppliers…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Suppliers" subtitle={`${suppliers.length} suppliers`} />
      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-box-icon">🔍</span>
            <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Search suppliers…"
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="name"  sort={sort} onSort={handleSort}>Name</SortTh>
                <SortTh field="email" sort={sort} onSort={handleSort}>Email</SortTh>
                <SortTh field="phone" sort={sort} onSort={handleSort}>Phone</SortTh>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={4}><EmptyState icon="🏭" title="No suppliers found" /></td></tr>
              ) : paginated.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{s.email || "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{s.phone || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.address || "—"}</td>
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

export default SuppliersList;
