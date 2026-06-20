import React from "react";
import { Spinner } from "./UI";

export function ReportLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <Spinner />
      <span>Loading report…</span>
    </div>
  );
}

export function ReportError({ message, onRetry }) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-state-icon">⚠️</div>
      <p className="empty-state-title">Could not load report</p>
      <p className="empty-state-desc">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>Try Again</button>
      )}
    </div>
  );
}

export function ReportEmpty({ title = "No data for this period", message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">
        {message || "No records match the selected date range. Try widening the period."}
      </p>
    </div>
  );
}

export function FilterBar({ children, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="card filter-bar-card" style={{ marginBottom: "var(--space-5)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
          {children}
        </div>
      </div>
    </form>
  );
}
