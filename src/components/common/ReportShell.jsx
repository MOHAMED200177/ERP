import React from "react";
import { Spinner } from "./UI";

export function ReportLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <Spinner />
      <span>Loading report data…</span>
    </div>
  );
}

export function ReportError({ message, onRetry }) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-state-icon">⚠️</div>
      <p className="empty-state-title">Unable to load report</p>
      <p className="empty-state-desc">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>Try Again</button>
      )}
    </div>
  );
}

export function ReportEmpty({ title = "No data found", message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{message || "No records match your selected filters. Try adjusting the date range."}</p>
    </div>
  );
}

export function ReportHeader({ title, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Analytics</p>
        <h1 style={{ margin: 0, fontSize: "2.2rem", fontFamily: "var(--font-display)", fontWeight: 700 }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function FilterBar({ children, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="card" style={{ marginBottom: "var(--space-5)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
          {children}
        </div>
      </div>
    </form>
  );
}
