/**
 * Shared UI primitives — used across all pages
 */
import React from "react";

/* ── Loading ─────────────────────────────────────── */
export const Spinner = ({ size = 32, style }) => (
  <div
    className="spinner"
    style={{ width: size, height: size, borderWidth: Math.max(2, size / 12), ...style }}
    aria-label="Loading"
  />
);

export const PageLoading = ({ message = "Loading…" }) => (
  <div className="page-loading">
    <Spinner />
    <span>{message}</span>
  </div>
);

export const SkeletonRow = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div className="skeleton" style={{ height: 16, borderRadius: 4 }} />
      </td>
    ))}
  </tr>
);

/* ── Alert Banner ─────────────────────────────────── */
export const Alert = ({ type = "error", children, onClose }) => {
  const map = {
    error: "alert-error", success: "alert-success",
    warning: "alert-warning", info: "alert-info",
  };
  return (
    <div className={`alert ${map[type]}`} role="alert">
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer",
            color: "inherit", padding: "0 4px", fontSize: "1.4rem" }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

/* ── Empty State ─────────────────────────────────── */
export const EmptyState = ({ icon = "📭", title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    {title && <p className="empty-state-title">{title}</p>}
    {description && <p className="empty-state-desc">{description}</p>}
    {action}
  </div>
);

/* ── Status Badge ─────────────────────────────────── */
const STATUS_BADGE_MAP = {
  paid:           "badge-success",
  active:         "badge-success",
  completed:      "badge-success",
  unpaid:         "badge-danger",
  overdue:        "badge-danger",
  cancelled:      "badge-danger",
  partially_paid: "badge-warning",
  partial:        "badge-warning",
  pending:        "badge-warning",
  draft:          "badge-neutral",
};

export const StatusBadge = ({ status }) => {
  const cls = STATUS_BADGE_MAP[status?.toLowerCase()] || "badge-neutral";
  const label = status ? status.replace(/_/g, " ") : "—";
  return <span className={`badge ${cls}`}>{label}</span>;
};

/* ── Currency ─────────────────────────────────────── */
export const Currency = ({ amount, currency = "EGP" }) => (
  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
    {currency} {(+amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </span>
);

/* ── Confirmation Modal ───────────────────────────── */
export const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className="modal" style={{ maxWidth: 400 }}>
      <h3 id="confirm-title" style={{ margin: "0 0 var(--space-3)", fontSize: "1.7rem" }}>{title}</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "1.4rem", margin: "0 0 var(--space-6)" }}>{message}</p>
      <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
          {danger ? "Delete" : "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

/* ── Sortable Table Header ────────────────────────── */
export const SortTh = ({ field, sort, onSort, children }) => (
  <th onClick={() => onSort(field)} style={{ cursor: "pointer", userSelect: "none" }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
      {sort.field === field && (
        <span style={{ fontSize: "0.9em", opacity: 0.7 }}>
          {sort.dir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </span>
  </th>
);

/* ── Searchable Select ───────────────────────────── */
export const SearchableSelect = ({
  id, value, onChange, options, placeholder = "Select…",
  loading: isLoading, disabled, label, required,
}) => (
  <div className="form-group">
    {label && <label htmlFor={id} className="form-label">{label}{required && " *"}</label>}
    <select
      id={id}
      className="form-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      required={required}
    >
      <option value="">{isLoading ? "Loading…" : placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

/* ── Pagination ──────────────────────────────────── */
export const Pagination = ({ page, total, perPage, onPage, onPerPage }) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = Math.min((page - 1) * perPage + 1, total);
  const end   = Math.min(page * perPage, total);

  const pages = [];
  const max = 5;
  let s = Math.max(1, page - Math.floor(max / 2));
  let e = Math.min(totalPages, s + max - 1);
  if (e - s + 1 < max) s = Math.max(1, e - max + 1);
  for (let i = s; i <= e; i++) pages.push(i);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </span>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
        <select
          className="form-control"
          style={{ width: "auto", padding: "4px 28px 4px 8px" }}
          value={perPage}
          onChange={(e) => onPerPage(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {[10, 20, 50].map((n) => <option key={n}>{n}</option>)}
        </select>
        <div className="pagination-pages">
          <button className="page-btn" onClick={() => onPage(1)} disabled={page === 1} aria-label="First">«</button>
          <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous">‹</button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn${p === page ? " active" : ""}`}
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Next">›</button>
          <button className="page-btn" onClick={() => onPage(totalPages)} disabled={page === totalPages} aria-label="Last">»</button>
        </div>
      </div>
    </div>
  );
};

/* ── Stats Grid ──────────────────────────────────── */
export const StatsRow = ({ stats }) => (
  <div className="stats-row">
    {stats.map((s, i) => (
      <div key={i} className="stat-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span className="stat-card-label">{s.label}</span>
          {s.icon && (
            <div className="stat-card-icon" style={{ background: s.iconBg || "var(--bg-elevated)" }}>
              {s.icon}
            </div>
          )}
        </div>
        <div className="stat-card-value">{s.value}</div>
        {s.sub && <div className="stat-card-sub">{s.sub}</div>}
      </div>
    ))}
  </div>
);
