import React from "react";
import { useNavigate } from "react-router-dom";

const PageHeader = React.memo(({ title, subtitle, actions }) => {
  const navigate = useNavigate();

  return (
    <div className="page-header-bar">
      <button
        type="button"
        className="page-header-back"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ←
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
});

export default PageHeader;
