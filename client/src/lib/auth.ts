import type { User } from '../types';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Get stored token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Set token
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Get refresh token
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Set refresh token
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

// Get stored user
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Set user
export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Set auth data (user + tokens)
export function setAuth(user: User, token: string, refreshToken?: string): void {
  setStoredUser(user);
  setToken(token);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

// Clear all auth data
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Parse JWT token to get expiration (without verification)
export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration.getTime() < Date.now();
}

// Check if token needs refresh (expires within 5 minutes)
export function shouldRefreshToken(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
  return expiration.getTime() < fiveMinutesFromNow;
}
