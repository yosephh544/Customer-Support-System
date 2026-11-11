import { api } from './client';
import type { AuthResponse, LoginRequest, UserProfile } from '../types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return await api.post<AuthResponse>('/auth/login', {
      username: credentials.usernameOrEmail,
      email: credentials.usernameOrEmail,
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password,
    });
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    return await api.get<UserProfile>('/users/me');
  },
};

