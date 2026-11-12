import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { UserRole, toUserRole } from '../types';
import type { AuthResponse, UserProfile } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[] | string | string[]) => boolean;
  updateCurrentUser: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('auth_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.role !== undefined) {
        parsed.role = toUserRole(parsed.role);
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [permissions, setPermissions] = useState<string[]>(() => {
    const saved = localStorage.getItem('auth_permissions');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const role: UserRole | null =
    user?.role !== undefined && user?.role !== null ? toUserRole(user.role) : null;

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const profile = await authApi.getCurrentUser();
          const normalizedUser: UserProfile = {
            ...profile,
            role: toUserRole(profile.role),
          };
          setUser(normalizedUser);
          localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
          if (profile.effectivePermissions) {
            setPermissions(profile.effectivePermissions);
            localStorage.setItem('auth_permissions', JSON.stringify(profile.effectivePermissions));
          }
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    // Note: Do NOT set the global session isLoading here.
    // Global isLoading is for initial app bootstrap; toggling it unmounts LoginPage and erases error state.
    const authData: AuthResponse = await authApi.login({ usernameOrEmail, password });
    const jwtToken = authData.tokenData?.token || authData.token;
    if (!jwtToken) {
      throw new Error('Authentication failed: No token received.');
    }

    setToken(jwtToken);
    localStorage.setItem('auth_token', jwtToken);

    const userId = authData.user?.id || authData.userId || 'me';
    const userFullName = authData.user?.fullName || authData.fullName || usernameOrEmail;
    const userEmail = authData.user?.email || authData.email || '';
    const rawRole = authData.user?.role ?? authData.role;
    const normalizedRole = toUserRole(rawRole);

    let userProfile: UserProfile = {
      id: userId,
      userName: usernameOrEmail,
      fullName: userFullName,
      email: userEmail,
      role: normalizedRole,
      isActive: true,
      createdAt: new Date().toISOString(),
      effectivePermissions: authData.permissions || [],
    };

    try {
      const profile = await authApi.getCurrentUser();
      if (profile && profile.role !== undefined) {
        userProfile = {
          ...userProfile,
          ...profile,
          role: toUserRole(profile.role),
        };
      }
    } catch {
      // If /users/me is not ready or fails, fallback to userProfile built from token response
    }

    setUser(userProfile);
    setPermissions(userProfile.effectivePermissions || []);
    localStorage.setItem('auth_user', JSON.stringify(userProfile));
    localStorage.setItem('auth_permissions', JSON.stringify(userProfile.effectivePermissions || []));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_permissions');
  };

  const hasPermission = (permission: string): boolean => {
    if (!permissions || permissions.length === 0) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const hasRole = (targetRole: UserRole | UserRole[] | string | string[]): boolean => {
    if (role === null || role === undefined) return false;
    if (Array.isArray(targetRole)) {
      return targetRole.some((r) => toUserRole(r) === role);
    }
    return toUserRole(targetRole) === role;
  };

  const updateCurrentUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser: UserProfile = {
        ...prev,
        ...updated,
        role: updated.role !== undefined && updated.role !== null ? toUserRole(updated.role) : prev.role,
      };
      localStorage.setItem('auth_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
