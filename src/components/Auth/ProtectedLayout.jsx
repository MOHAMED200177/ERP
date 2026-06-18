import React, { Suspense, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Footer from "../Footer";

const ProtectedLayout = () => {
  const { token, loading } = useAuth();
  const requireAuth = process.env.REACT_APP_REQUIRE_AUTH !== "false";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (requireAuth && loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading session…</p>
      </div>
    );
  }

  if (requireAuth && !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 99,
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Suspense
        fallback={
          <div className="app-loading">
            <div className="spinner" />
            <p>Loading…</p>
          </div>
        }
      >
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </Suspense>
      <Footer />
    </div>
  );
};

export default ProtectedLayout;
