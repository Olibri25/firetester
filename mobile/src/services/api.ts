// AK FISH API Service

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Token refresh would go here
      // For now, we'll just reject and let the auth store handle it
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
    cached?: boolean;
  };
}

// Fish Counts API
export const fishCountsApi = {
  getStations: () => api.get<ApiResponse<any[]>>('/fish-counts/stations'),
  getStation: (id: string) => api.get<ApiResponse<any>>(`/fish-counts/stations/${id}`),
  getLatest: (params?: { stationId?: string; species?: string; limit?: number }) =>
    api.get<ApiResponse<any[]>>('/fish-counts/latest', { params }),
  getSummary: (date?: string) =>
    api.get<ApiResponse<any[]>>('/fish-counts/summary', { params: { date } }),
  getHistory: (stationId: string, params?: { species?: string; year?: number }) =>
    api.get<ApiResponse<any>>(`/fish-counts/history/${stationId}`, { params }),
  getComparison: (stationId: string, species: string) =>
    api.get<ApiResponse<any>>('/fish-counts/compare', { params: { stationId, species } }),
  favorite: (stationId: string) => api.post(`/fish-counts/favorite/${stationId}`),
  unfavorite: (stationId: string) => api.delete(`/fish-counts/favorite/${stationId}`),
};

// Emergency Orders API
export const emergencyOrdersApi = {
  getAll: (params?: { active?: boolean; region?: string; species?: string }) =>
    api.get<ApiResponse<any[]>>('/emergency-orders', { params }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/emergency-orders/${id}`),
  getByLocation: (lat: number, lng: number) =>
    api.get<ApiResponse<any[]>>(`/emergency-orders/location/${lat}/${lng}`),
  getRecent: (days?: number) =>
    api.get<ApiResponse<any[]>>('/emergency-orders/feed/recent', { params: { days } }),
};

// Regulations API
export const regulationsApi = {
  getAll: (params?: { area?: string; species?: string }) =>
    api.get<ApiResponse<any[]>>('/regulations', { params }),
  getByLocation: (lat: number, lng: number) =>
    api.get<ApiResponse<any[]>>(`/regulations/location/${lat}/${lng}`),
  search: (query: string) =>
    api.get<ApiResponse<any[]>>('/regulations/search', { params: { q: query } }),
};

// Lakes API
export const lakesApi = {
  getAll: (params?: { region?: string; species?: string; stocked?: boolean }) =>
    api.get<ApiResponse<any[]>>('/lakes', { params }),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get<ApiResponse<any[]>>('/lakes/nearby', { params: { lat, lng, radius } }),
  search: (query: string) =>
    api.get<ApiResponse<any[]>>('/lakes/search', { params: { q: query } }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/lakes/${id}`),
  getStocking: (id: string, years?: number) =>
    api.get<ApiResponse<any>>(`/lakes/${id}/stocking`, { params: { years } }),
  favorite: (id: string) => api.post(`/lakes/${id}/favorite`),
  unfavorite: (id: string) => api.delete(`/lakes/${id}/favorite`),
  getRecentStocking: (days?: number) =>
    api.get<ApiResponse<any[]>>('/lakes/stocking/recent', { params: { days } }),
};

// Fishing Reports API
export const fishingReportsApi = {
  getAll: (params?: { region?: string; area?: string }) =>
    api.get<ApiResponse<any[]>>('/fishing-reports', { params }),
  getRegions: () => api.get<ApiResponse<string[]>>('/fishing-reports/regions'),
  getLatest: () => api.get<ApiResponse<any[]>>('/fishing-reports/latest'),
  getById: (id: string) => api.get<ApiResponse<any>>(`/fishing-reports/${id}`),
};

// Weather API
export const weatherApi = {
  getCurrent: (lat: number, lng: number) =>
    api.get<ApiResponse<any>>('/weather/current', { params: { lat, lng } }),
  getForecast: (lat: number, lng: number) =>
    api.get<ApiResponse<any>>('/weather/forecast', { params: { lat, lng } }),
  getSolunar: (lat: number, lng: number, date?: string) =>
    api.get<ApiResponse<any>>('/weather/solunar', { params: { lat, lng, date } }),
};

// Tides API
export const tidesApi = {
  getStations: () => api.get<ApiResponse<any[]>>('/tides/stations'),
  getPredictions: (stationId: string, days?: number) =>
    api.get<ApiResponse<any>>('/tides/predictions', { params: { stationId, days } }),
  getNearestStation: (lat: number, lng: number) =>
    api.get<ApiResponse<any>>('/tides/nearest', { params: { lat, lng } }),
  getCurrent: (stationId: string) =>
    api.get<ApiResponse<any>>('/tides/current', { params: { stationId } }),
};

// Run Timing API
export const runTimingApi = {
  getHistorical: (params?: { location?: string; species?: string; years?: number }) =>
    api.get<ApiResponse<any[]>>('/run-timing/historical', { params }),
  getPredictions: (params?: { location?: string; species?: string }) =>
    api.get<ApiResponse<any[]>>('/run-timing/predictions', { params }),
  getPrediction: (location: string, species: string) =>
    api.get<ApiResponse<any>>(`/run-timing/predictions/${location}/${species}`),
  getCalendar: (region?: string, month?: number) =>
    api.get<ApiResponse<any>>('/run-timing/calendar', { params: { region, month } }),
  getCurrent: () => api.get<ApiResponse<any[]>>('/run-timing/current'),
};

// Waypoints API
export const waypointsApi = {
  getAll: (params?: { type?: string; tag?: string }) =>
    api.get<ApiResponse<any[]>>('/waypoints', { params }),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get<ApiResponse<any[]>>('/waypoints/nearby', { params: { lat, lng, radius } }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/waypoints/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/waypoints', data),
  update: (id: string, data: any) => api.patch<ApiResponse<any>>(`/waypoints/${id}`, data),
  delete: (id: string) => api.delete(`/waypoints/${id}`),
  exportGPX: () => api.get('/waypoints/export/gpx', { responseType: 'blob' }),
};

// Trips API
export const tripsApi = {
  getAll: (params?: { year?: number }) =>
    api.get<ApiResponse<any[]>>('/trips', { params }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/trips/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/trips', data),
  update: (id: string, data: any) => api.patch<ApiResponse<any>>(`/trips/${id}`, data),
  delete: (id: string) => api.delete(`/trips/${id}`),
  addTrackPoints: (id: string, points: any[]) =>
    api.post<ApiResponse<any>>(`/trips/${id}/track`, { points }),
};

// Catches API
export const catchesApi = {
  getAll: (params?: { species?: string; year?: number; tripId?: string }) =>
    api.get<ApiResponse<any[]>>('/catches', { params }),
  getStats: (year?: number) =>
    api.get<ApiResponse<any>>('/catches/stats', { params: { year } }),
  getFeed: (params?: { species?: string }) =>
    api.get<ApiResponse<any[]>>('/catches/feed', { params }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/catches/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/catches', data),
  update: (id: string, data: any) => api.patch<ApiResponse<any>>(`/catches/${id}`, data),
  delete: (id: string) => api.delete(`/catches/${id}`),
};

export default api;
