export type UserRole = 'Admin' | 'Director' | 'TeamLead' | 'SupportAgent';

export interface UserProfile {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  directPermissions?: string[];
  effectivePermissions?: string[];
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  roles: string[];
  permissions: string[];
  expiresAt: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password?: string;
  encryptedPassword?: string;
}

