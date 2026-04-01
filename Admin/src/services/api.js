/**
 * Admin API Service
 * 
 * Centralizes all API calls and handles:
 * - Base URL from env
 * - Auth token injection (reads from localStorage)
 * - Consistent error handling
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  get: async (path, params = {}) => {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), {
      headers: { ...getAuthHeaders() }
    });
    return res.json();
  },

  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  patch: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return res.json();
  },

  upload: async (path, formData, method = 'POST') => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { ...getAuthHeaders() }, // No Content-Type — browser sets multipart boundary
      body: formData
    });
    return res.json();
  }
};

export default api;
