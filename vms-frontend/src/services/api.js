// vms-frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

let tenantSubdomain = localStorage.getItem('tenantSubdomain') || '';

export const setTenantSubdomain = (subdomain) => {
  tenantSubdomain = subdomain || '';
  if (tenantSubdomain) localStorage.setItem('tenantSubdomain', tenantSubdomain);
  else localStorage.removeItem('tenantSubdomain');
};

export const clearTenantSubdomain = () => setTenantSubdomain('');

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const superadminToken = localStorage.getItem('superadminToken');
    const adminToken = localStorage.getItem('adminToken');
    const guardToken = localStorage.getItem('guardToken');
    const token = superadminToken || adminToken || guardToken;
    if (token) config.headers['Authorization'] = `Bearer ${token}`;

    const isSuperAdminPath = (config.url || '').startsWith('/superadmin');
    if (!isSuperAdminPath) {
      if (tenantSubdomain) config.headers['x-tenant-subdomain'] = tenantSubdomain;
    } else {
      if (config.headers['x-tenant-subdomain']) delete config.headers['x-tenant-subdomain'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;