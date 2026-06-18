
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api, { TOKEN_STORAGE_KEY, getApiBaseUrl } from "../api/client";
import { extractApiData, extractApiError } from "../api/utils";

const USER_STORAGE_KEY = "acc_erp_user";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function extractToken(payload) {
  return (
    payload?.data?.token ??
    payload?.token ??
    payload?.data?.data?.token ??
    null
  );
}

function extractUser(payload) {
  return (
    payload?.data?.user ??
    payload?.user ??
    payload?.data?.data?.user ??
    null
  );
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(token));

  const persistSession = useCallback((payload) => {
    const t = extractToken(payload);
    if (!t || typeof t !== "string") {
      throw new Error("Response did not include a usable token.");
    }
    const nextUser = extractUser(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, t);
    setTokenState(t);
    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const response = await api.get("/auth/me");
      const profile = extractApiData(response) ?? response.data;
      if (profile && typeof profile === "object") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        setUser(profile);
        return profile;
      }
    } catch {
      clearSession();
    }
    return null;
  }, [token, clearSession]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await refreshProfile();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshProfile]);

  const login = useCallback(
    async ({ email, password }) => {
      const base = getApiBaseUrl();
      if (!base) {
        throw new Error(
          "REACT_APP_API_URL is not set. Configure your API base URL."
        );
      }
      const { data } = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      persistSession(data);
      return data;
    },
    [persistSession]
  );

  const signup = useCallback(
    async ({ name, email, password }) => {
      const base = getApiBaseUrl();
      if (!base) {
        throw new Error(
          "REACT_APP_API_URL is not set. Configure your API base URL."
        );
      }
      const { data } = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      persistSession(data);
      return data;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      signup,
      logout,
      refreshProfile,
      isAuthenticated: Boolean(token),
      getAuthError: extractApiError,
    }),
    [token, user, loading, login, signup, logout, refreshProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
