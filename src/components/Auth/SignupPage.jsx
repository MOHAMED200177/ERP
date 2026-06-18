import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../api/client";

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = Boolean(getApiBaseUrl());

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError("Name is required");
    if (formData.password.length < 8) return setError("Password must be at least 8 characters");
    setError("");
    setLoading(true);
    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">ACC</div>
          <h1>Create your account</h1>
          <p>Register to access the ERP platform</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!configured && (
            <div className="auth-alert auth-alert--error" role="alert">
              Set <code>REACT_APP_API_URL</code> in your <code>.env</code> file.
            </div>
          )}
          {error && (
            <div className="auth-alert auth-alert--error" role="alert">{error}</div>
          )}

          <div className="auth-field">
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name" name="name" type="text"
              className="form-control" autoComplete="name"
              value={formData.name} onChange={handleChange}
              placeholder="Your full name" required
              disabled={!configured || loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email" name="email" type="email"
              className="form-control" autoComplete="email"
              value={formData.email} onChange={handleChange}
              placeholder="you@company.com" required
              disabled={!configured || loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password" name="password" type="password"
              className="form-control" autoComplete="new-password"
              value={formData.password} onChange={handleChange}
              placeholder="Min. 8 characters" required
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
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>

          <div className="auth-divider">
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--brand-400)", fontWeight: 500 }}>
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
