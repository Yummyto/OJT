import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  getAgents: () => api.get('/auth/agents'),
  setup: (email, password, name) => api.post('/auth/setup', { email, password, name }),
};

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ═══════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
};

// ═══════════════════════════════════════════
// BORROW REQUESTS
// ═══════════════════════════════════════════
export const borrowAPI = {
  getAll: (params) => api.get('/borrow-requests', { params }),
  getByStudent: (studentId) => api.get(`/borrow-requests/student/${studentId}`),
  lookup: (identifier) => api.get(`/borrow-requests/lookup/${encodeURIComponent(identifier)}`),
  create: (data) => api.post('/borrow-requests', data),
  updateStatus: (id, status, admin_notes, tags) =>
    api.put(`/borrow-requests/${id}/status`, { status, admin_notes, tags }),
};

// ═══════════════════════════════════════════
// UPLOAD
// ═══════════════════════════════════════════
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (path) => api.delete('/upload', { data: { path } }),
};

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
