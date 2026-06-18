import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../api/client";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = Boolean(getApiBaseUrl());

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email: formData.email.trim(), password: formData.password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">ACC</div>
          <h1>Welcome back</h1>
          <p>Sign in to your ERP dashboard</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!configured && (
            <div className="auth-alert auth-alert--error" role="alert">
              Set <code>REACT_APP_API_URL</code> in your <code>.env</code> file.
            </div>
          )}
          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="form-control"
              autoComplete="username"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              disabled={!configured || loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="form-control"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={!configured || loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "var(--space-2)" }}
            disabled={loading || !configured}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="auth-divider">
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "var(--brand-400)", fontWeight: 500 }}>
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
