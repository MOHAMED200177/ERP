import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import PageHeader from "./PageHeader";
import { PageLoading, Alert, EmptyState, SortTh, Pagination } from "./common/UI";

const CategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort]             = useState({ field: "name", dir: "asc" });
  const [page, setPage]             = useState(1);
  const [perPage, setPerPage]       = useState(10);

  useEffect(() => {
    api.get("/categories")
      .then((r) => setCategories(r.data?.data?.data || []))
      .catch(() => setError("Failed to load categories."))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    let r = [...categories];
    const q = searchTerm.toLowerCase();
    if (q) r = r.filter((c) => (c.name || "").toLowerCase().includes(q));
    r.sort((a, b) => {
      let av = (a[sort.field] || "").toLowerCase(), bv = (b[sort.field] || "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return r;
  }, [categories, searchTerm, sort]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) return <PageLoading message="Loading categories…" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Categories" subtitle={`${categories.length} categories`} />
      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-box-icon">🔍</span>
            <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Search categories…"
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh field="name"        sort={sort} onSort={handleSort}>Name</SortTh>
                <SortTh field="description" sort={sort} onSort={handleSort}>Description</SortTh>
                <th>Parent</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={3}><EmptyState icon="🏷️" title="No categories found" /></td></tr>
              ) : paginated.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.description || "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.parentCategory?.name || "—"}</td>
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

export default CategoriesList;
