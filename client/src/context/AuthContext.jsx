import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client.js';
import { getToken, setToken, clearToken } from '../api/tokenStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Throws on failure so callers that need to know (e.g. login) can react.
  const loadProfile = useCallback(async () => {
    const { data } = await apiClient.get('/auth/me');
    setProfile(data.data);
    return data.data;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        await loadProfile();
      } catch {
        // Token missing/expired/invalid, or backend unreachable: treat as
        // logged out rather than hanging forever. The api client already
        // clears an expired token on a 401 response.
        if (isMounted) setProfile(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  const login = async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { token, profile: loggedInProfile } = data.data;
    setToken(token);
    setProfile(loggedInProfile);
    return loggedInProfile;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout is stateless (JWT-based) — even if this call fails, clearing
      // the local token below is what actually logs the user out.
    }
    clearToken();
    setProfile(null);
  };

  const value = {
    profile,
    isAuthenticated: !!profile,
    isAdmin: profile?.role === 'admin',
    isCoach: profile?.role === 'coach',
    isParent: profile?.role === 'parent',
    loading,
    login,
    logout,
    refreshProfile: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
