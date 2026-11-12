/**
 * UserRole enum aligned directly with backend Infrustructure.Enums.UserRole:
 * Admin = 1, Director = 2, TeamLead = 3, SupportAgent = 4
 */
export enum UserRole {
  Admin = 1,
  Director = 2,
  TeamLead = 3,
  SupportAgent = 4,
}

export const UserRoleNames: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Director]: 'Director',
  [UserRole.TeamLead]: 'TeamLead',
  [UserRole.SupportAgent]: 'SupportAgent',
};

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: 'Administrator',
  [UserRole.Director]: 'Executive Director',
  [UserRole.TeamLead]: 'Team Lead',
  [UserRole.SupportAgent]: 'Support Agent',
};

export const USER_ROLE_OPTIONS = [
  { value: UserRole.SupportAgent, label: UserRoleLabels[UserRole.SupportAgent] },
  { value: UserRole.TeamLead, label: UserRoleLabels[UserRole.TeamLead] },
  { value: UserRole.Director, label: UserRoleLabels[UserRole.Director] },
  { value: UserRole.Admin, label: UserRoleLabels[UserRole.Admin] },
];

/**
 * Normalizes any role representation (numeric integer enum or string name) to the UserRole enum.
 */
export function toUserRole(val: unknown): UserRole {
  if (typeof val === 'number' && val in UserRole) {
    return val as UserRole;
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && num in UserRole) {
      return num as UserRole;
    }
    const clean = val.trim().toLowerCase();
    if (clean === 'admin') return UserRole.Admin;
    if (clean === 'director') return UserRole.Director;
    if (clean === 'teamlead' || clean === 'team lead') return UserRole.TeamLead;
    if (clean === 'supportagent' || clean === 'support agent') return UserRole.SupportAgent;
  }
  return UserRole.SupportAgent;
}

/**
 * Returns program name string (e.g. 'Admin', 'TeamLead', 'SupportAgent')
 */
export function getRoleName(val: unknown): string {
  const roleEnum = toUserRole(val);
  return UserRoleNames[roleEnum] || 'SupportAgent';
}

/**
 * Returns user-friendly display label (e.g. 'Administrator', 'Team Lead')
 */
export function getRoleLabel(val: unknown): string {
  const roleEnum = toUserRole(val);
  return UserRoleLabels[roleEnum] || 'Support Agent';
}

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

export interface AuthTokenData {
  token: string;
  expiration: string;
}

export interface AuthUserData {
  id: string;
  fullName: string;
  email: string;
  role: UserRole | string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  tokenData?: AuthTokenData;
  user?: AuthUserData;
  token?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  role?: UserRole | string;
  roles?: string[];
  permissions?: string[];
  expiresAt?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password?: string;
  encryptedPassword?: string;
}
