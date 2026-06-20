import React from "react";
import { formatCurrency } from "../../utils/format";

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
      <td key={i}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
    ))}
  </tr>
);

/* ── Alert Banner ─────────────────────────────────── */
export const Alert = ({ type = "error", children, onClose }) => {
  const map = { error: "alert-error", success: "alert-success", warning: "alert-warning", info: "alert-info" };
  return (
    <div className={`alert ${map[type] || "alert-info"}`} role="alert">
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss"
          style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 4px", fontSize: "1.6rem", lineHeight: 1 }}>
          ×
        </button>
      )}
    </div>
  );
};

/* ── Toast Notification ──────────────────────────── */
export const Toast = ({ toasts, remove }) => {
  if (!toasts?.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
      {toasts.map((t) => (
        <div key={t.id} className={`alert ${t.type === "success" ? "alert-success" : t.type === "warning" ? "alert-warning" : "alert-error"}`}
          style={{ boxShadow: "var(--shadow-lg)", animation: "slideInRight 0.2s ease", cursor: "pointer" }}
          onClick={() => remove(t.id)}>
          <span style={{ flex: 1 }}>{t.message}</span>
          <span style={{ fontSize: "1.4rem", opacity: 0.7 }}>×</span>
        </div>
      ))}
    </div>
  );
};

/* ── Empty State ─────────────────────────────────── */
export const EmptyState = ({ icon = "📭", title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    {title       && <p className="empty-state-title">{title}</p>}
    {description && <p className="empty-state-desc">{description}</p>}
    {action}
  </div>
);

/* ── Status Badge ─────────────────────────────────── */
const STATUS_MAP = {
  paid: "badge-success", active: "badge-success", completed: "badge-success",
  unpaid: "badge-danger", overdue: "badge-danger", cancelled: "badge-danger",
  partially_paid: "badge-warning", partial: "badge-warning", pending: "badge-warning",
  draft: "badge-neutral",
};
export const StatusBadge = ({ status }) => {
  const cls   = STATUS_MAP[status?.toLowerCase()] || "badge-neutral";
  const label = status ? status.replace(/_/g, " ") : "—";
  return <span className={`badge ${cls}`}>{label}</span>;
};

/* ── Currency — clean, no .00 ────────────────────── */
export const Currency = ({ amount }) => (
  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
    {formatCurrency(amount)}
  </span>
);

/* ── Confirmation Modal ───────────────────────────── */
export const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger, confirmLabel }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title"
    onClick={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="modal" style={{ maxWidth: 420 }}>
      <h3 id="confirm-title" style={{ margin: "0 0 var(--space-3)", fontSize: "1.7rem" }}>{title}</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "1.4rem", margin: "0 0 var(--space-6)", lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
          {confirmLabel || (danger ? "Delete" : "Confirm")}
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
        <span style={{ fontSize: "0.85em", opacity: 0.6 }}>{sort.dir === "asc" ? "↑" : "↓"}</span>
      )}
    </span>
  </th>
);

/* ── Pagination ──────────────────────────────────── */
export const Pagination = ({ page, total, perPage, onPage, onPerPage }) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total);
  const end   = Math.min(page * perPage, total);

  const pages = [];
  const maxVisible = 5;
  let s = Math.max(1, page - Math.floor(maxVisible / 2));
  let e = Math.min(totalPages, s + maxVisible - 1);
  if (e - s + 1 < maxVisible) s = Math.max(1, e - maxVisible + 1);
  for (let i = s; i <= e; i++) pages.push(i);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </span>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
        <select className="form-control" style={{ width: "auto", padding: "4px 28px 4px 8px" }}
          value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} aria-label="Rows per page">
          {[10, 20, 50, 100].map((n) => <option key={n}>{n}</option>)}
        </select>
        <div className="pagination-pages">
          <button className="page-btn" onClick={() => onPage(1)}          disabled={page === 1}          aria-label="First">«</button>
          <button className="page-btn" onClick={() => onPage(page - 1)}   disabled={page === 1}          aria-label="Prev">‹</button>
          {pages.map((p) => (
            <button key={p} className={`page-btn${p === page ? " active" : ""}`}
              onClick={() => onPage(p)} aria-current={p === page ? "page" : undefined}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => onPage(page + 1)}   disabled={page === totalPages} aria-label="Next">›</button>
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
        <div className="stat-card-value"
          style={{ fontSize: String(s.value).length > 10 ? "1.8rem" : undefined, wordBreak: "break-word", overflowWrap: "break-word" }}>
          {s.value}
        </div>
        {s.sub && <div className="stat-card-sub">{s.sub}</div>}
      </div>
    ))}
  </div>
);
