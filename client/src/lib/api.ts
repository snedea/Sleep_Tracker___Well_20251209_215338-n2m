import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, clearAuth } from './auth';
import type { ApiError } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && originalRequest && !originalRequest.headers['X-Retry']) {
        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;

          // Update tokens
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          originalRequest.headers['X-Retry'] = 'true';
          return api(originalRequest);
        } catch {
          // Refresh failed, clear auth
          clearAuth();
          window.location.href = '/login';
        }
      } else {
        // No refresh token or already retried
        clearAuth();
        window.location.href = '/login';
      }
    }

    // Extract error message
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred';

    return Promise.reject({
      error: errorMessage,
      details: error.response?.data?.details,
      statusCode: error.response?.status,
    } as ApiError);
  }
);

export default api;

// Helper functions for common requests
export const apiGet = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then((res) => res.data);

export const apiPost = <T>(url: string, data?: unknown) =>
  api.post<T>(url, data).then((res) => res.data);

export const apiPut = <T>(url: string, data?: unknown) =>
  api.put<T>(url, data).then((res) => res.data);

export const apiDelete = <T>(url: string) =>
  api.delete<T>(url).then((res) => res.data);
