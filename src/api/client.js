
import axios from "axios";

export const TOKEN_STORAGE_KEY = "acc_erp_auth_token";

export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_URL;
  return raw ? String(raw).replace(/\/$/, "") : "";
}

const api = axios.create({
  baseURL: getApiBaseUrl() || undefined,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

function isPublicPath(url) {
  const u = (url || "").toString();
  return (
    u.includes("/auth/login") ||
    u.includes("/auth/register") ||
    u.includes("/health") ||
    u.includes("/sales/")
  );
}

api.interceptors.request.use((config) => {
  if (isPublicPath(config.url)) {
    return config;
  }
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requireAuth = process.env.REACT_APP_REQUIRE_AUTH !== "false";
    if (requireAuth && error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      const p = window.location.pathname;
      if (!p.startsWith("/login") && !p.startsWith("/signup")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
