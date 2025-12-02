import axios from 'axios';
import { APP_CONFIG } from '../config/app.config';

const api = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${APP_CONFIG.apiUrl}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/token/', { username, password }),
  refreshToken: (refresh: string) =>
    api.post('/token/refresh/', { refresh }),
  getProfile: () => api.get('/users/me/'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/update_profile/', data),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/users/change_password/', data),
};

// Products API
export const productsAPI = {
  getAll: (params?: Record<string, string>) => api.get('/products/', { params }),
  getById: (id: number) => api.get(`/products/${id}/`),
  getByBarcode: (code: string) => api.get('/products/by_barcode/', { params: { code } }),
  create: (data: Record<string, unknown>) => api.post('/products/', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/products/${id}/`, data),
  delete: (id: number) => api.delete(`/products/${id}/`),
  getCategories: () => api.get('/products/categories/'),
  createCategory: (data: Record<string, unknown>) => api.post('/products/categories/', data),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params?: Record<string, string>) => api.get('/inventory/', { params }),
  getById: (id: number) => api.get(`/inventory/${id}/`),
  adjust: (id: number, data: Record<string, unknown>) => api.post(`/inventory/${id}/adjust/`, data),
  getLowStock: () => api.get('/inventory/low_stock/'),
  getMovements: () => api.get('/inventory/movements/'),
};

// Sales API
export const salesAPI = {
  getAll: (params?: Record<string, string>) => api.get('/sales/', { params }),
  getById: (id: number) => api.get(`/sales/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/sales/', data),
  cancel: (id: number) => api.post(`/sales/${id}/cancel/`),
  getInvoices: (params?: Record<string, string>) => api.get('/sales/invoices/', { params }),
};

// Clients API
export const clientsAPI = {
  getAll: (params?: Record<string, string>) => api.get('/clients/', { params }),
  getById: (id: number) => api.get(`/clients/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/clients/', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/clients/${id}/`, data),
  delete: (id: number) => api.delete(`/clients/${id}/`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: Record<string, string>) => api.get('/clients/suppliers/', { params }),
  getById: (id: number) => api.get(`/clients/suppliers/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/clients/suppliers/', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/clients/suppliers/${id}/`, data),
  delete: (id: number) => api.delete(`/clients/suppliers/${id}/`),
};

// Expenses API
export const expensesAPI = {
  getAll: (params?: Record<string, string>) => api.get('/expenses/', { params }),
  getById: (id: number) => api.get(`/expenses/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/expenses/', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/expenses/${id}/`, data),
  delete: (id: number) => api.delete(`/expenses/${id}/`),
  getCategories: () => api.get('/expenses/categories/'),
};

// Quotes API
export const quotesAPI = {
  getAll: (params?: Record<string, string>) => api.get('/quotes/', { params }),
  getById: (id: number) => api.get(`/quotes/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/quotes/', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/quotes/${id}/`, data),
  delete: (id: number) => api.delete(`/quotes/${id}/`),
  send: (id: number) => api.post(`/quotes/${id}/send/`),
  accept: (id: number) => api.post(`/quotes/${id}/accept/`),
  reject: (id: number) => api.post(`/quotes/${id}/reject/`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard/'),
  getSalesChart: (days?: number) => api.get('/reports/sales-chart/', { params: { days } }),
  getSalesByCategory: (days?: number) => api.get('/reports/sales-by-category/', { params: { days } }),
  getTopProducts: (days?: number, limit?: number) => 
    api.get('/reports/top-products/', { params: { days, limit } }),
  getSalesBySeller: (days?: number) => api.get('/reports/sales-by-seller/', { params: { days } }),
  getInventoryReport: () => api.get('/reports/inventory/'),
  getMonthlyComparison: (months?: number) => 
    api.get('/reports/monthly-comparison/', { params: { months } }),
  getAccountingReport: (params?: Record<string, string>) => 
    api.get('/reports/accounting/', { params }),
};

// Config API
export const configAPI = {
  getAppConfig: () => api.get('/config/'),
};


