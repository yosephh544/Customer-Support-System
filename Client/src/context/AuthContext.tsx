import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import type { AuthResponse, UserProfile, UserRole } from '../types';

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [permissions, setPermissions] = useState<string[]>(() => {
    const saved = localStorage.getItem('auth_permissions');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const role: UserRole | null = user?.role || null;

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const profile = await authApi.getCurrentUser();
          setUser(profile);
          localStorage.setItem('auth_user', JSON.stringify(profile));
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
    setIsLoading(true);
    try {
      const authData: AuthResponse = await authApi.login({ usernameOrEmail, password });
      if (!authData || !authData.token) {
        throw new Error('Authentication failed: No token received.');
      }

      setToken(authData.token);
      localStorage.setItem('auth_token', authData.token);

      let userProfile: UserProfile = {
        id: authData.userId,
        userName: usernameOrEmail,
        fullName: authData.fullName || usernameOrEmail,
        email: authData.email || '',
        role: authData.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        effectivePermissions: authData.permissions || [],
      };

      try {
        const profile = await authApi.getCurrentUser();
        if (profile && profile.role) {
          userProfile = {
            ...userProfile,
            ...profile,
          };
        }
      } catch {
        // If /users/me is not ready or fails, fallback to userProfile built from token response
      }

      setUser(userProfile);
      setPermissions(userProfile.effectivePermissions || []);
      localStorage.setItem('auth_user', JSON.stringify(userProfile));
      localStorage.setItem('auth_permissions', JSON.stringify(userProfile.effectivePermissions || []));
    } finally {
      setIsLoading(false);
    }
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

  const hasRole = (targetRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    if (Array.isArray(targetRole)) {
      return targetRole.includes(role);
    }
    return role === targetRole;
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

