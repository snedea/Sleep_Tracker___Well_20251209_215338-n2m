import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiGet, apiPut, apiDelete } from '../lib/api';
import {
  getToken,
  getStoredUser,
  setAuth,
  clearAuth,
  isAuthenticated as checkAuth,
} from '../lib/auth';
import type { User, RegisterInput, LoginInput, AuthResponse } from '../types';

// Profile update input type
interface UpdateProfileInput {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check auth status on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Verify token is still valid
      apiGet<{ user: User }>('/auth/me')
        .then((data) => {
          setUser(data.user);
          setAuth(data.user, token);
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => apiPost<AuthResponse>('/auth/login', input),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => apiPost<AuthResponse>('/auth/register', input),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => apiPut<{ user: User }>('/auth/profile', input),
    onSuccess: (data) => {
      setUser(data.user);
      const token = getToken();
      if (token) {
        setAuth(data.user, token);
      }
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => apiDelete('/auth/account'),
    onSuccess: () => {
      clearAuth();
      setUser(null);
      queryClient.clear();
    },
  });

  // Login function
  const login = useCallback(async (input: LoginInput) => {
    await loginMutation.mutateAsync(input);
  }, [loginMutation]);

  // Register function
  const register = useCallback(async (input: RegisterInput) => {
    await registerMutation.mutateAsync(input);
  }, [registerMutation]);

  // Logout function
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Update profile function
  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    await updateProfileMutation.mutateAsync(input);
  }, [updateProfileMutation]);

  // Delete account function
  const deleteAccount = useCallback(async () => {
    await deleteAccountMutation.mutateAsync();
  }, [deleteAccountMutation]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && checkAuth(),
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending ||
               updateProfileMutation.isPending || deleteAccountMutation.isPending,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get current user
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

// Hook to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// Export context for use in provider
export { AuthContext };
