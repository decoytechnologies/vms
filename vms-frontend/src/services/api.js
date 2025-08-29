// vms-frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';
const TENANT_SUBDOMAIN = 'dev';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-subdomain': TENANT_SUBDOMAIN,
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('guardToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;